/**
 * Database Ready Middleware
 * Ensures database is connected before processing requests
 */

const mongoose = require('mongoose');

const dbReady = (req, res, next) => {
  // Check if mongoose is connected
  if (mongoose.connection.readyState === 1) {
    // Connected
    return next();
  }

  // Not connected - return 503 Service Unavailable
  return res.status(503).json({
    success: false,
    message: 'Database connection not ready. Please try again in a moment.',
    status: 'service_unavailable'
  });
};

module.exports = { dbReady };
