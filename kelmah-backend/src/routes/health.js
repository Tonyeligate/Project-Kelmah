const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    frontend_url: process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app',
    services: {
      api_gateway: 'healthy',
      database: 'checking...',
      cors_configured: true
    }
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
  }
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    frontend_domain: 'https://kelmah-frontend-cyan.vercel.app',
    cors_enabled: true,
    last_updated: new Date().toISOString()
  });
});

module.exports = router; 