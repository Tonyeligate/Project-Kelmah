/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests from a single IP
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config/env');
const rateLimits = require('../config/rate-limits');

// In-memory store for more granular rate limiting
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

// General rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes by default
  max: RATE_LIMIT_MAX || 100, // 100 requests per window by default
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});

/**
 * Generate a middleware for more granular rate limiting
 * @param {string} type - Rate limit type (e.g., 'login', 'register')
 * @returns {Function} Express middleware function
 */
const createLimiter = (type) => {
  return (req, res, next) => {
    try {
      // Default values if not configured
      const limit = rateLimits[type]?.limit || rateLimits.default.limit;
      const window = rateLimits[type]?.window || rateLimits.default.window;

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
          
            return res.status(429).json({
              success: false,
              message: `Too many requests. Please try again in ${secondsToWait} seconds.`
            });
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
      console.error(`Rate limiter error: ${error.message}`);
      next(); // Allow request in case of error
    }
  };
};

module.exports = { 
  apiLimiter, 
  authLimiter,
  createLimiter
};