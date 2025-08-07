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
    
    // ✅ ENHANCED: Better logging for debugging 401 errors
    console.log('🔐 Auth Check:', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!authHeader,
      headerFormat: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      userAgent: req.get('User-Agent')?.substring(0, 50),
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('❌ Auth Failed: No token or invalid format:', {
        authHeader: authHeader ? 'present but wrong format' : 'missing',
        url: req.url
      });
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.',
        debug: process.env.NODE_ENV === 'development' ? 'Expected: Bearer <token>' : undefined
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // ✅ ENHANCED: Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET environment variable not set!');
      return res.status(500).json({ 
        error: 'Authentication service misconfigured.' 
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔓 Token decoded successfully:', {
      userId: decoded.sub || decoded.id || decoded.userId,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Get user details with timeout to prevent buffering issues
    const user = await User.findById(decoded.sub || decoded.id || decoded.userId)
      .select('firstName lastName email role isActive')
      .maxTimeMS(8000); // 8 second timeout to prevent buffering issues
    
    if (!user || !user.isActive) {
      console.warn('❌ Auth Failed: User not found or inactive:', {
        userId: decoded.sub || decoded.id || decoded.userId,
        userFound: !!user,
        userActive: user?.isActive
      });
      return res.status(401).json({ 
        error: 'Invalid token or inactive user.',
        debug: process.env.NODE_ENV === 'development' ? 'User not found or inactive' : undefined
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
    console.error('❌ Authentication error:', {
      name: error.name,
      message: error.message,
      url: req.url,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.',
        debug: process.env.NODE_ENV === 'development' ? `Expired at: ${new Date(error.expiredAt).toISOString()}` : undefined
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error during authentication.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  authenticate
};