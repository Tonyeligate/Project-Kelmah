/**
 * Authentication Middleware for Job Service
 * Validates JWT tokens for job API requests
 * ✅ FIXED: Uses process.env.JWT_SECRET directly (standardized with other services)
 */

const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Enhanced logging for debugging
    console.log('🔐 Job Service Auth Check:', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!authHeader,
    });
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn('❌ Job Service Auth Failed: No token or invalid format:', {
        authHeader: authHeader ? 'present but wrong format' : 'missing',
        url: req.url
      });
      return res.status(401).json({ 
        message: "No token provided",
        debug: process.env.NODE_ENV === 'development' ? 'Expected: Bearer <token>' : undefined
      });
    }

    const token = authHeader.split(" ")[1];
    
    // ✅ CRITICAL FIX: Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET environment variable not set in Job Service!');
      return res.status(500).json({ 
        message: "Authentication service misconfigured." 
      });
    }
    
    // Verify JWT token using environment variable directly (standardized approach)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔓 Job Service token decoded successfully:', {
      userId: decoded.sub || decoded.id || decoded.userId,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Job Service authentication error:', {
      error: error.message,
      name: error.name,
      url: req.url
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }
};

const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      console.warn('🚫 Job Service authorization failed:', {
        userRole: req.user.role,
        requiredRoles: roles,
        userId: req.user.sub || req.user.id || req.user.userId
      });
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };

module.exports = { authenticateUser, authorizeRoles };
