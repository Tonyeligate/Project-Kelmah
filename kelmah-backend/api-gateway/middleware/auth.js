/**
 * API Gateway Authentication Middleware
 * Validates JWT tokens and forwards user context to services
 */

const jwt = require('jsonwebtoken');
const jwtUtils = require('../../shared/utils/jwt');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authenticate user via JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with unified settings (iss/aud)
    let decoded;
    try {
      decoded = jwtUtils.verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
          shouldRefresh: true
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Optional: Validate with auth service for revoked tokens
    if (process.env.VALIDATE_TOKENS_WITH_SERVICE === 'true') {
      try {
        const response = await axios.post(
          `${AUTH_SERVICE_URL}/api/auth/validate`,
          { token },
          { 
            timeout: 5000,
            headers: {
              'X-Internal-Request': process.env.INTERNAL_API_KEY
            }
          }
        );
        
        if (!response.data.valid) {
          return res.status(401).json({
            success: false,
            message: 'Token has been revoked',
            code: 'TOKEN_REVOKED'
          });
        }
      } catch (error) {
        // Log but don't fail if auth service is down
        console.warn('Auth service validation failed:', error.message);
      }
    }
    
    // Add user context to request
    const userCtx = jwtUtils.decodeUserFromClaims(decoded);
    req.user = { id: userCtx.id, email: userCtx.email, role: userCtx.role, version: userCtx.version };
    req.token = token;
    req.auth = { jti: userCtx.jti, iat: userCtx.iat, exp: userCtx.exp };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Authorize user based on roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - adds user context if token is present
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwtUtils.verifyAccessToken(token);
    const claims = jwtUtils.decodeUserFromClaims(decoded);
    req.user = { id: claims.id, email: claims.email, role: claims.role, version: claims.version };
    req.token = token;
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token invalid:', error.message);
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};