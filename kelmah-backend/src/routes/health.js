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

// Aggregate health check endpoint for all services
router.get('/aggregate', async (req, res) => {
  const services = [
    { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001/health' },
    { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://localhost:5002/health' },
    { name: 'job-service', url: process.env.JOB_SERVICE_URL || 'http://localhost:5003/health' },
    { name: 'messaging-service', url: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5004/health' },
    { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005/health' },
    { name: 'review-service', url: process.env.REVIEW_SERVICE_URL || 'http://localhost:5006/health' }
  ];

  const results = {};
  let overallStatus = 'healthy';

  // Check each service
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      results[service.name] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        response_time: Date.now(),
        http_status: response.status
      };

      if (!response.ok) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      results[service.name] = {
        status: 'unhealthy',
        error: error.message,
        response_time: Date.now()
      };
      overallStatus = 'degraded';
    }
  }

  const aggregateHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: results,
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(overallStatus === 'healthy' ? 200 : 503).json(aggregateHealth);
});

module.exports = router; 