/**
 * Centralized Authentication Middleware - API Gateway
 * Handles all authentication for the entire Kelmah platform
 * Uses shared JWT utility for consistency across services
 */

const crypto = require('crypto');
const jwtUtils = require('../../shared/utils/jwt');
const { User } = require('../../shared/models');
const { AppError, AuthenticationError, AuthorizationError } = require('../../shared/utils/errorTypes');

const ACCESS_COOKIE_NAME =
  process.env.AUTH_ACCESS_COOKIE_NAME || 'kelmah_access_token';

// User cache to reduce database lookups (bounded LRU)
const MAX_CACHE_SIZE = 500;
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getServiceTrustSecret = () =>
  process.env.SERVICE_TRUST_HMAC_SECRET || process.env.INTERNAL_API_KEY || '';

const getCacheKey = (userId) => `user:${userId}`;

// LRU-style set: evict oldest entry when cache exceeds max size
function cacheSet(key, value) {
  if (userCache.size >= MAX_CACHE_SIZE) {
    // Map iterates in insertion order — delete the oldest
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(key, value);
}

function invalidateUserCache(userId) {
  if (!userId) {
    return;
  }

  userCache.delete(getCacheKey(String(userId)));
}

function clearUserCache() {
  userCache.clear();
}

async function loadCanonicalUser(userId) {
  const cacheKey = getCacheKey(userId);
  const cachedUser = userCache.get(cacheKey);

  if (cachedUser && Date.now() - cachedUser.cachedAt <= CACHE_TTL) {
    return cachedUser;
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return null;
  }

  const normalizedUser = { ...user.toObject(), cachedAt: Date.now() };
  cacheSet(cacheKey, normalizedUser);
  return normalizedUser;
}

const sendAuthError = (res, status, message, code = 'AUTHENTICATION_ERROR') => {
  return res.status(status).json({
    success: false,
    error: {
      message,
      code,
    },
  });
};

const buildUserFromDecodedToken = (decoded, fallbackId) => ({
  id: fallbackId,
  email: decoded?.email || null,
  role: decoded?.role || decoded?.userRole || null,
  firstName: decoded?.firstName || null,
  lastName: decoded?.lastName || null,
  isEmailVerified: typeof decoded?.isEmailVerified === 'boolean' ? decoded.isEmailVerified : false,
  tokenVersion: decoded?.version || 0,
});

const parseCookieHeader = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      if (!key) {
        return accumulator;
      }

      try {
        accumulator[key] = decodeURIComponent(value);
      } catch (_) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
};

const resolveAccessToken = (req) => {
  const authHeader = req.headers.authorization;
  let malformedAuthHeader = false;

  if (typeof authHeader === 'string' && authHeader.length > 0) {
    if (authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7).trim();
      if (bearerToken) {
        return {
          token: bearerToken,
          source: 'header',
          malformedAuthHeader: false,
        };
      }
    }

    malformedAuthHeader = true;
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieToken = cookies[ACCESS_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return {
      token: cookieToken,
      source: 'cookie',
      malformedAuthHeader,
    };
  }

  return {
    token: null,
    source: null,
    malformedAuthHeader,
  };
};

/**
 * Main authentication middleware
 * Validates JWT tokens and populates req.user for downstream services
 */
const authenticate = async (req, res, next) => {
  try {
    const { token, source, malformedAuthHeader } = resolveAccessToken(req);
    if (!token) {
      if (malformedAuthHeader) {
        return sendAuthError(res, 401, 'Invalid token format', 'INVALID_TOKEN_FORMAT');
      }
      return sendAuthError(res, 401, 'No token provided', 'AUTH_REQUIRED');
    }

    if (source === 'cookie') {
      req.headers.authorization = `Bearer ${token}`;
    }

    // Verify JWT token using shared utility
    let decoded;
    try {
      decoded = await jwtUtils.verifyAccessToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return sendAuthError(res, 401, 'Please refresh your token', 'TOKEN_EXPIRED');
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return sendAuthError(res, 401, 'Token verification failed', 'INVALID_TOKEN');
      }
      throw jwtError; // Re-throw unexpected errors
    }

    // Extract user ID from token
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return sendAuthError(res, 401, 'Token missing user ID', 'INVALID_TOKEN_PAYLOAD');
    }

    let user;

    try {
      user = await loadCanonicalUser(userId);
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return sendAuthError(res, 500, 'Unable to verify user', 'AUTH_DB_ERROR');
    }

    if (!user) {
      return sendAuthError(res, 401, 'Token references non-existent user', 'USER_NOT_FOUND');
    }

    if (user.isActive === false) {
      invalidateUserCache(userId);
      return sendAuthError(res, 401, 'Token references an inactive user', 'USER_INACTIVE');
    }

    if (
      Number.isFinite(decoded?.version) &&
      Number.isFinite(user.tokenVersion) &&
      decoded.version !== user.tokenVersion
    ) {
      invalidateUserCache(userId);
      return sendAuthError(res, 401, 'Please refresh your token', 'TOKEN_REVOKED');
    }

    const tokenUser = buildUserFromDecodedToken(decoded, userId);
    const authUser = {
      id: user._id || user.id || tokenUser.id,
      email: user.email || tokenUser.email,
      role: user.role || tokenUser.role,
      firstName: user.firstName || tokenUser.firstName,
      lastName: user.lastName || tokenUser.lastName,
      isEmailVerified:
        typeof user.isEmailVerified === 'boolean'
          ? user.isEmailVerified
          : tokenUser.isEmailVerified,
      tokenVersion: user.tokenVersion ?? tokenUser.tokenVersion ?? 0,
    };

    req.user = authUser;

    // Add authentication headers for service-to-service communication
    const userPayload = JSON.stringify(req.user);
    req.headers['x-authenticated-user'] = userPayload;
    req.headers['x-auth-source'] = 'api-gateway';
    // HMAC signature to prevent header spoofing on direct service access
    const hmacSecret = getServiceTrustSecret();
    if (!hmacSecret) {
      console.error('CRITICAL: No service trust HMAC secret configured (SERVICE_TRUST_HMAC_SECRET or INTERNAL_API_KEY)');
      return sendAuthError(res, 500, 'Server misconfiguration', 'HMAC_SECRET_MISSING');
    }
    const signature = crypto.createHmac('sha256', hmacSecret).update(userPayload).digest('hex');
    req.headers['x-gateway-signature'] = signature;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return sendAuthError(res, 500, 'Internal authentication failure', 'AUTH_INTERNAL_ERROR');
  }
};

/**
 * Authorization middleware for role-based access control
 * Usage: authorizeRoles('admin', 'hirer')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Populates req.user if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  const { token, source } = resolveAccessToken(req);
  if (!token) {
    return next();
  }

  if (source === 'cookie') {
    req.headers.authorization = `Bearer ${token}`;
  }

  try {
    const decoded = await jwtUtils.verifyAccessToken(token);
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return next();
    }

    const user = await loadCanonicalUser(userId);
    if (!user || user.isActive === false) {
      invalidateUserCache(userId);
      return next();
    }

    if (
      Number.isFinite(decoded?.version) &&
      Number.isFinite(user.tokenVersion) &&
      decoded.version !== user.tokenVersion
    ) {
      invalidateUserCache(userId);
      return next();
    }

    const tokenUser = buildUserFromDecodedToken(decoded, userId);
    const authUser = {
      id: user._id || user.id || tokenUser.id,
      email: user.email || tokenUser.email,
      role: user.role || tokenUser.role,
      firstName: user.firstName || tokenUser.firstName,
      lastName: user.lastName || tokenUser.lastName,
      isEmailVerified:
        typeof user.isEmailVerified === 'boolean'
          ? user.isEmailVerified
          : tokenUser.isEmailVerified,
      tokenVersion: user.tokenVersion ?? tokenUser.tokenVersion ?? 0,
    };

    req.user = authUser;

    const userPayload = JSON.stringify(req.user);
    req.headers['x-authenticated-user'] = userPayload;
    req.headers['x-auth-source'] = 'api-gateway';
    const hmacSecret = getServiceTrustSecret();
    if (!hmacSecret) {
      console.error('CRITICAL: No service trust HMAC secret configured in optionalAuth');
      // Continue without setting gateway headers since we can't sign them
      req.user = authUser;
      return next();
    }
    const signature = crypto.createHmac('sha256', hmacSecret).update(userPayload).digest('hex');
    req.headers['x-gateway-signature'] = signature;

    return next();
  } catch (_) {
    // Optional authentication should never block request flow
    req.user = null;
    return next();
  }
};

module.exports = {
  authenticate,
  authorizeRoles,
  optionalAuth,
  invalidateUserCache,
  clearUserCache
}; 