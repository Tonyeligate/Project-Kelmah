const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorTypes');
const User = require('../models').User;

/**
 * Authentication middleware - verifies JWT tokens and sets req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Enforce JWT secret presence
    if (!process.env.JWT_SECRET) {
      return next(new AppError('Server configuration error', 500));
    }
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access denied. No token provided.', 401));
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Token has expired. Please login again.', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please login again.', 401));
      } else {
        return next(new AppError('Token verification failed. Please login again.', 401));
      }
    }
    
    // Check if user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists. Please login again.', 401));
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return next(new AppError('Account has been deactivated. Please contact support.', 403));
    }
    
    // Set user on request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified
    };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return next(new AppError('Authentication failed. Please login again.', 401));
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }
    
    // Try to verify token
    if (!process.env.JWT_SECRET) {
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = { authenticate, optionalAuth };
