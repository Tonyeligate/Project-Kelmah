const jwt = require('jsonwebtoken');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

/**
 * Authentication middleware to verify user JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header, query, or cookies
    const token = 
      req.header('Authorization')?.replace('Bearer ', '') || 
      req.query?.token || 
      req.cookies?.token;

    // If no token, return unauthorized
    if (!token) {
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Invalid token, authorization denied' });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  // Convert string to array if only one role provided
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // User must be authenticated first
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user role is in allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Authorization denied for user ${req.user.id}: Required role(s): ${roles.join(', ')}, User role: ${req.user.role}`);
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }

    // If authorized, proceed
    next();
  };
};

/**
 * Service-to-service authentication middleware
 * Uses a service API key for authentication between microservices
 */
const authenticateService = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Invalid service authentication' });
    }
    
    next();
  } catch (error) {
    logger.error(`Service authentication error: ${error.message}`);
    res.status(401).json({ error: 'Service authentication failed' });
  }
};

module.exports = {
  authenticate,
  authorize,
  authenticateService,
  logger
}; 