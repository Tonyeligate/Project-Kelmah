/**
 * Secure Authentication Middleware
 * Unified authentication system for all Kelmah services
 */

const secureJWT = require('../utils/jwt-secure');
const SecurityUtils = require('../utils/security');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

class SecureAuthMiddleware {
  /**
   * Main authentication middleware
   * @param {Object} options - Configuration options
   * @returns {Function} Express middleware
   */
  static authenticate(options = {}) {
    const {
      requireEmailVerification = true,
      allowedRoles = null,
      requireActiveSession = false
    } = options;
    
    return async (req, res, next) => {
      try {
        // Extract token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Access token required',
            code: 'NO_TOKEN'
          });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token format',
            code: 'INVALID_TOKEN_FORMAT'
          });
        }
        
        // Create request context for validation
        const context = {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          deviceFingerprint: secureJWT.generateDeviceFingerprint(req)
        };
        
        // Verify token
        let decoded;
        try {
          decoded = secureJWT.verifyAccessToken(token, context);
        } catch (error) {
          const isExpired = error.message.includes('expired');
          return res.status(401).json({
            success: false,
            message: error.message,
            code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
            shouldRefresh: isExpired
          });
        }
        
        // Get user from database
        const { User } = require('../models');
        const user = await User.findByPk(decoded.sub, {
          attributes: ['id', 'email', 'role', 'isEmailVerified', 'isActive', 'tokenVersion']
        });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }
        
        // Check if user is active
        if (!user.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Account has been deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }
        
        // Check token version (for global token invalidation)
        if (decoded.version !== user.tokenVersion) {
          return res.status(401).json({
            success: false,
            message: 'Token has been invalidated',
            code: 'TOKEN_INVALIDATED'
          });
        }
        
        // Check email verification if required
        if (requireEmailVerification && !user.isEmailVerified) {
          return res.status(403).json({
            success: false,
            message: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED'
          });
        }
        
        // Check role authorization
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            requiredRoles: allowedRoles,
            userRole: user.role
          });
        }
        
        // Check for active session if required
        if (requireActiveSession) {
          // Implementation depends on session store
          // For now, skip this check
        }
        
        // Add user and context to request
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          tokenVersion: user.tokenVersion
        };
        
        req.auth = {
          token,
          context,
          jti: decoded.jti,
          iat: decoded.iat,
          exp: decoded.exp
        };
        
        // Log successful authentication for audit
        req.auditLog = {
          userId: user.id,
          action: 'AUTHENTICATE',
          ip: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date()
        };
        
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication service error',
          code: 'AUTH_SERVICE_ERROR'
        });
      }
    };
  }
  
  /**
   * Role-based authorization middleware
   * @param {...string} roles - Allowed roles
   * @returns {Function} Express middleware
   */
  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: req.user.role
        });
      }
      
      next();
    };
  }
  
  /**
   * Check if user is accessing their own resource
   * @param {string} paramName - Parameter name containing user ID (default: 'userId')
   * @returns {Function} Express middleware
   */
  static requireSameUser(paramName = 'userId') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const resourceUserId = req.params[paramName] || req.body[paramName];
      
      // Admins can access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user is accessing their own resource
      if (req.user.id.toString() !== resourceUserId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - resource belongs to another user',
          code: 'ACCESS_DENIED'
        });
      }
      
      next();
    };
  }
  
  /**
   * Refresh token authentication middleware
   * @returns {Function} Express middleware
   */
  static authenticateRefreshToken() {
    return async (req, res, next) => {
      try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
          return res.status(400).json({
            success: false,
            message: 'Refresh token required',
            code: 'NO_REFRESH_TOKEN'
          });
        }
        
        // Get stored token data
        const { RefreshToken } = require('../models');
        
        // Extract token ID from JWT part
        const tokenId = secureJWT.extractTokenId(refreshToken);
        if (!tokenId) {
          return res.status(401).json({
            success: false,
            message: 'Invalid refresh token format',
            code: 'INVALID_REFRESH_TOKEN'
          });
        }
        
        const storedToken = await RefreshToken.findOne({
          where: {
            tokenId,
            isRevoked: false,
            expiresAt: { [Op.gt]: new Date() }
          },
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['id', 'email', 'role', 'tokenVersion', 'isActive']
          }]
        });
        
        if (!storedToken) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            code: 'INVALID_REFRESH_TOKEN'
          });
        }
        
        // Verify refresh token
        const verification = await secureJWT.verifyRefreshToken(
          refreshToken, 
          storedToken
        );
        
        if (!verification.valid) {
          // Revoke token if verification fails
          await RefreshToken.update(
            { 
              isRevoked: true, 
              revokedAt: new Date(),
              revokedReason: `Verification failed: ${verification.error}`
            },
            { where: { id: storedToken.id } }
          );
          
          return res.status(401).json({
            success: false,
            message: verification.error,
            code: 'REFRESH_TOKEN_INVALID'
          });
        }
        
        // Check if user is still active
        if (!storedToken.user.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Account has been deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }
        
        // Add user and token data to request
        req.user = storedToken.user;
        req.refreshTokenData = {
          tokenId: storedToken.tokenId,
          storedToken
        };
        
        next();
      } catch (error) {
        console.error('Refresh token authentication error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication service error',
          code: 'AUTH_SERVICE_ERROR'
        });
      }
    };
  }
  
  /**
   * CSRF protection middleware
   * @returns {Function} Express middleware
   */
  static csrfProtection() {
    return (req, res, next) => {
      // Skip CSRF for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }
      
      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;
      
      if (!token || !sessionToken) {
        return res.status(403).json({
          success: false,
          message: 'CSRF token required',
          code: 'CSRF_TOKEN_REQUIRED'
        });
      }
      
      if (!SecurityUtils.validateCSRFToken(token, sessionToken)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token',
          code: 'INVALID_CSRF_TOKEN'
        });
      }
      
      next();
    };
  }
  
  /**
   * Rate limiting middleware factory
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  static rateLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // Max requests per window
      message = 'Too many requests, please try again later',
      skipSuccessfulRequests = false,
      keyGenerator = (req) => req.ip
    } = options;
    
    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED'
      },
      skipSuccessfulRequests,
      keyGenerator,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  }
  
  /**
   * Security headers middleware
   * @returns {Function} Express middleware
   */
  static securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "wss:", "ws:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for payment providers
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }
  
  /**
   * API key authentication middleware
   * @param {Object} options - Configuration options
   * @returns {Function} Express middleware
   */
  static authenticateApiKey(options = {}) {
    const { headerName = 'x-api-key', required = true } = options;
    
    return async (req, res, next) => {
      const apiKey = req.headers[headerName];
      
      if (!apiKey && required) {
        return res.status(401).json({
          success: false,
          message: 'API key required',
          code: 'API_KEY_REQUIRED'
        });
      }
      
      if (apiKey) {
        // Validate API key (implement based on your API key strategy)
        const isValid = await this.validateApiKey(apiKey);
        
        if (!isValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid API key',
            code: 'INVALID_API_KEY'
          });
        }
        
        req.apiKey = apiKey;
      }
      
      next();
    };
  }
  
  /**
   * Validate API key (placeholder implementation)
   * @param {string} apiKey - API key to validate
   * @returns {Promise<boolean>} Validation result
   */
  static async validateApiKey(apiKey) {
    // Implement based on your API key storage strategy
    // This could check against database, Redis, etc.
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validApiKeys.includes(apiKey);
  }
}

module.exports = SecureAuthMiddleware;