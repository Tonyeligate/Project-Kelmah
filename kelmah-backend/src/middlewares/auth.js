/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/errorTypes');
const config = require('../config');
const logger = require('../utils/logger');

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
      return next(new AppError('No authentication token, access denied', 401));
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    // Verify token
    if (!config.JWT_SECRET) {
      return next(new AppError('Server configuration error', 500));
    }
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Find user by id
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }
    
    // Check if user is verified
    if (!user.isEmailVerified) {
      return next(new AppError('Please verify your email address before proceeding', 403));
    }
    
    // Add user data to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired, please login again', 401));
    }
    
    return next(new AppError('Invalid token, access denied', 401));
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Array of allowed roles
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized access, insufficient permissions', 403));
    }
    
    next();
  };
};

/**
 * Middleware to check if user is acting on their own account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isSameUser = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  
  const userId = req.params.userId || req.params.id;
  
  if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized access to this resource', 403));
  }
  
  next();
};

// Ensure exports match app usage
// Rename authenticate to authenticateUser
exports.authenticateUser = exports.authenticate;

// Rename authorize to authorizeRoles for consistency
exports.authorizeRoles = exports.authorize;

// Placeholder for refresh token middleware
exports.authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token missing', 400));
    }
    // Verify and decode refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
}; 