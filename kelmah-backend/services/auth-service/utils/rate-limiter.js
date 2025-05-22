/**
 * Rate Limiter Utility
 * Simple in-memory rate limiting implementation for development
 */

const AppError = require('./app-error');
const { logger } = require('./logger');
const config = require('../config');
const rateLimits = require('../config/rate-limits');

// In-memory store for rate limiting
const ipLimits = new Map();

/**
 * Clean old entries periodically (every 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of ipLimits.entries()) {
    if (data.resetTime < now) {
      ipLimits.delete(key);
      }
  }
}, 10 * 60 * 1000);

/**
 * Generate a middleware for rate limiting
 * @param {string} type - Rate limit type (e.g., 'login', 'register')
 * @returns {Function} Express middleware function
 */
exports.middleware = (type) => {
  return (req, res, next) => {
    try {
      // Default values if not configured
      const limit = rateLimits[type]?.limit || 5;  
      const window = rateLimits[type]?.window || 60;

      // Get IP address
      const ip = req.ip || 
                req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                '127.0.0.1';
      
      // Create a key for this limit type and IP
      const key = `${type}:${ip}`;
      
      // Get current time
      const now = Date.now();
      
      // Check if this IP is already being rate limited
      if (!ipLimits.has(key)) {
        // First request from this IP
        ipLimits.set(key, {
          count: 1,
          resetTime: now + (window * 1000)
        });
      } else {
        // Get existing data
        const data = ipLimits.get(key);
        
        // Check if the reset time has passed
        if (data.resetTime <= now) {
          // Reset count
          ipLimits.set(key, {
            count: 1,
            resetTime: now + (window * 1000)
          });
        } else {
          // Increment count
          data.count += 1;
          
          // Check if limit is exceeded
          if (data.count > limit) {
            const secondsToWait = Math.ceil((data.resetTime - now) / 1000);
            
          res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', secondsToWait);
          
            return next(new AppError(`Too many requests. Please try again in ${secondsToWait} seconds.`, 429));
        }

          // Update the map
          ipLimits.set(key, data);
        }
      }
      
      // Add rate limit headers
      const data = ipLimits.get(key);
        res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - data.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((data.resetTime - now) / 1000));

        next();
      } catch (error) {
      logger.error(`Rate limiter error: ${error.message}`);
      next(); // Allow request in case of error
  }
  };
};