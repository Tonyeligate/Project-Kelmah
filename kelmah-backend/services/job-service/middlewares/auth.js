/**
 * Authentication Middleware for Job Service
 * Validates JWT tokens for job API requests
 * ✅ FIXED: Uses process.env.JWT_SECRET directly (standardized with other services)
 */

const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Minimal contextual logging; avoid sensitive data
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Use structured logger in future; keep terse output
      return res.status(401).json({ 
        message: "No token provided",
        debug: process.env.NODE_ENV === 'development' ? 'Expected: Bearer <token>' : undefined
      });
    }

    const token = authHeader.split(" ")[1];
    
    // ✅ CRITICAL FIX: Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      // Avoid noisy logs: configuration should be validated at startup
      return res.status(500).json({ 
        message: "Authentication service misconfigured." 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      id: decoded.id || decoded.sub, 
      email: decoded.email, 
      role: decoded.role, 
      version: decoded.version 
    };
    next();
  } catch (error) {
    // Avoid leaking details in production
    
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
