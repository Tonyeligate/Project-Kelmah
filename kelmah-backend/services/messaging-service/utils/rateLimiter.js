const expressRateLimit = require('express-rate-limit');

const LIMITS = {
  messaging: { windowMs: 15 * 60 * 1000, max: 100 },
  default: { windowMs: 15 * 60 * 1000, max: 50 },
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

