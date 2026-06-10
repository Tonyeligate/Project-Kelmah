const { ensureConnection } = require('../config/db');

const HEALTH_PATH_PREFIXES = [
  '/health',
  '/api/health',
];

const shouldBypass = (req) => {
  const path = req.path || '';
  if (!path) return false;
  return HEALTH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const ensureDbReadyMiddleware = async (req, res, next) => {
  try {
    if (shouldBypass(req)) {
      return next();
    }

    await ensureConnection();
    return next();
  } catch (error) {
    console.error('❌ User Service database not ready:', error?.message || error);
    if (!res.headersSent) {
      return res.status(503).json({
        success: false,
        message: 'User Service database is not ready. Please try again shortly.',
        code: 'USER_DB_NOT_READY',
      });
    }
    return undefined;
  }
};

module.exports = {
  ensureDbReadyMiddleware,
};
