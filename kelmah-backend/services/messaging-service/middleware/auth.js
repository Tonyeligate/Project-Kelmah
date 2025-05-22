/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid token provided.'
      });
    }
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Attach user data to request object
      req.user = decoded;
      
      // Continue to next middleware/route handler
      return next();
    } catch (error) {
      // Log error details
      logger.error(`Token verification failed: ${error.message}`, { error });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please login again.'
      });
    }
  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}; 