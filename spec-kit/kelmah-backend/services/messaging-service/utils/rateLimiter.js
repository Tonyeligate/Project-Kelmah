const expressRateLimit = require('express-rate-limit');

const LIMITS = {
  messaging: { windowMs: 15 * 60 * 1000, max: 500 }, // Increased for notification polling
  notifications: { windowMs: 5 * 60 * 1000, max: 200 }, // Special limit for notifications: 200 requests per 5 minutes
  default: { windowMs: 15 * 60 * 1000, max: 200 }, // Increased default limit
};

function createLimiter(key = 'default') {
  const cfg = LIMITS[key] || LIMITS.default;
  
  return expressRateLimit({
    windowMs: cfg.windowMs,
    max: cfg.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  });
}

module.exports = { createLimiter };

