const jwt = require('jsonwebtoken');
const { response } = require('../utils/response');

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.error(res, 401, 'No authentication token, access denied');
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    try {
    // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your_jwt_secret_key_here'
      );
    
    // Add user data to request
    req.user = decoded;
    
    next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return response.error(res, 401, 'Token expired, please login again', {
          expired: true
      });
    }
    
      return response.error(res, 401, 'Invalid token, access denied');
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return response.error(res, 500, 'Authentication failed');
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array|String} roles - Array of allowed roles or single role
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return response.error(res, 401, 'Authentication required');
      }
      
      // Convert single role to array if necessary
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        return response.error(res, 403, 'Unauthorized access, insufficient permissions');
      }
      
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return response.error(res, 500, 'Authorization failed');
    }
  };
};

/**
 * Middleware to verify account is active
 */
exports.verifyActive = async (req, res, next) => {
  try {
    // This middleware assumes a previous middleware has set req.user
    if (!req.user) {
      return response.error(res, 401, 'Authentication required');
    }
    
    // If the user record needs to be loaded from DB, you'd load it here
    // and check if it's active, verified, etc.
    
    // For now, we'll just check if isVerified exists in the token
    if (req.user.isVerified === false) {
      return response.error(res, 403, 'Account not verified. Please verify your email first.');
    }
    
    next();
  } catch (error) {
    console.error('Account verification middleware error:', error);
    return response.error(res, 500, 'Account verification failed');
  }
};

/**
 * Middleware to check if MFA is required
 */
exports.requireMFA = (requiredForRoles = ['admin']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return response.error(res, 401, 'Authentication required');
      }
      
      // MFA is required for specific roles
      if (requiredForRoles.includes(req.user.role) && !req.user.mfaVerified) {
        return response.error(res, 403, 'Multi-factor authentication required', {
          requireMFA: true
        });
      }
      
      next();
    } catch (error) {
      console.error('MFA middleware error:', error);
      return response.error(res, 500, 'MFA verification failed');
    }
  };
}; 