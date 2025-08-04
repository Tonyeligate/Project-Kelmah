/**
 * Authentication Middleware for Messaging Service
 * Validates JWT tokens for messaging API requests
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const user = await User.findById(decoded.sub || decoded.id || decoded.userId)
      .select('firstName lastName email role isActive');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or inactive user.' 
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

module.exports = {
  authenticate
};