/**
 * Centralized Authentication Middleware - API Gateway
 * Handles all authentication for the entire Kelmah platform
 * Uses shared JWT utility for consistency across services
 */

const crypto = require('crypto');
const jwtUtils = require('../../shared/utils/jwt');
const { User } = require('../../shared/models');
const { AppError, AuthenticationError, AuthorizationError } = require('../../shared/utils/errorTypes');

// User cache to reduce database lookups (bounded LRU)
const MAX_CACHE_SIZE = 500;
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// LRU-style set: evict oldest entry when cache exceeds max size
function cacheSet(key, value) {
  if (userCache.size >= MAX_CACHE_SIZE) {
    // Map iterates in insertion order — delete the oldest
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(key, value);
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

/**
 * Main authentication middleware
 * Validates JWT tokens and populates req.user for downstream services
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendAuthError(res, 401, 'No token provided', 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token) {
      return sendAuthError(res, 401, 'Invalid token format', 'INVALID_TOKEN_FORMAT');
    }

    // Verify JWT token using shared utility
    let decoded;
    try {
      decoded = jwtUtils.verifyAccessToken(token);
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

    // Check cache first
    const cacheKey = `user:${userId}`;
    let user = userCache.get(cacheKey);
    
    if (!user || Date.now() - user.cachedAt > CACHE_TTL) {
      // Lookup user in database
      try {
        user = await User.findById(userId).select('-password');
        if (!user) {
          return sendAuthError(res, 401, 'Token references non-existent user', 'USER_NOT_FOUND');
        }

        // Cache user for performance
        cacheSet(cacheKey, { ...user.toObject(), cachedAt: Date.now() });
      } catch (dbError) {
        console.error('Database error during authentication:', dbError);
        return sendAuthError(res, 500, 'Unable to verify user', 'AUTH_DB_ERROR');
      }
    }

    // Populate request with user info for downstream services
    req.user = {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      tokenVersion: decoded.version || 0
    };

    // Add authentication headers for service-to-service communication
    const userPayload = JSON.stringify(req.user);
    req.headers['x-authenticated-user'] = userPayload;
    req.headers['x-auth-source'] = 'api-gateway';
    // HMAC signature to prevent header spoofing on direct service access
    const hmacSecret = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || '';
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
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token provided, continue without authentication
  }

  // Use main authenticate middleware but suppress errors
  authenticate(req, res, (err) => {
    // If authentication fails, continue without user info
    if (err || !req.user) {
      req.user = null;
    }
    next();
  });
};

module.exports = {
  authenticate,
  authorizeRoles,
  optionalAuth
}; 