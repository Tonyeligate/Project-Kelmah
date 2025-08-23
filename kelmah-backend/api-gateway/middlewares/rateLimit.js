/**
 * Rate Limiting Middleware
 * Limits requests from the same IP address
 */
const rateLimit = require('express-rate-limit');

// Simple rate limiter that doesn't require Redis
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  }
});

module.exports = limiter; 