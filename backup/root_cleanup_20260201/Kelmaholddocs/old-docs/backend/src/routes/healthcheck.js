/**
 * Health check endpoint
 * Used to verify the API server is running correctly
 */
const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify API is working
 * @access  Public
 * @returns {Object} Status information
 */
router.get('/', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + ' seconds',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(healthData);
});

module.exports = router; 