/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/error');

// Mock user database for development
const MOCK_USERS = {
  'ee650194-5336-4978-9441-046dae049dc9': {
    id: 'ee650194-5336-4978-9441-046dae049dc9',
    firstName: 'Sam',
    lastName: 'Gemini',
    email: 'sammy@gmail.com',
    role: 'hirer'
  }
};

/**
 * Protect route - verify JWT token
 */
exports.protect = (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-for-development');
      
      // Mock user lookup for development
      const user = MOCK_USERS[decoded.id];
      
      if (!user) {
        // If we're using JWT but can't find the user
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      } else {
        req.user = user;
      }
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return next(new AppError('Authentication error', 500));
  }
};

/**
 * Restrict access to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
}; 