/**
 * API Gateway Routes Index
 * Central routing configuration for all microservices
 */

const express = require('express');
const router = express.Router();

// Import individual service routers
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jobRoutes = require('./job.routes');
const messagingRoutes = require('./messaging.routes');
const reviewRoutes = require('./review.routes');
const paymentRoutes = require('./payment.routes');
const monolithRoutes = require('./monolith.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gateway: 'API Gateway',
    version: '1.0.0'
  });
});

// Aggregate health check endpoint
router.get('/health/aggregate', async (req, res) => {
  const serviceUrls = req.app.get('serviceUrls');
  const axios = require('axios');

  const serviceStatus = {};

  for (const [serviceName, url] of Object.entries(serviceUrls)) {
    try {
      const response = await axios.get(`${url}/api/health`, { timeout: 5000 });
      serviceStatus[serviceName] = {
        status: 'healthy',
        url: url,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      serviceStatus[serviceName] = {
        status: 'unhealthy',
        url: url,
        error: error.message
      };
    }
  }

  res.json({
    gateway: 'healthy',
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// Service status endpoint
router.get('/status', async (req, res) => {
  const serviceUrls = req.app.get('serviceUrls');
  const axios = require('axios');

  const serviceStatus = {};

  for (const [serviceName, url] of Object.entries(serviceUrls)) {
    try {
      const response = await axios.get(`${url}/api/health`, { timeout: 5000 });
      serviceStatus[serviceName] = {
        status: 'healthy',
        url: url,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      serviceStatus[serviceName] = {
        status: 'unhealthy',
        url: url,
        error: error.message
      };
    }
  }

  res.json({
    gateway: 'healthy',
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// Route all service requests
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/jobs', jobRoutes);
router.use('/api/messages', messagingRoutes);
router.use('/api/conversations', messagingRoutes);
router.use('/api/notifications', messagingRoutes); // Add notifications route
router.use('/api/payments', paymentRoutes);
router.use('/api/reviews', reviewRoutes);

// Monolith service routes (legacy endpoints)
router.use('/notifications', monolithRoutes);
router.use('/profile', monolithRoutes);
router.use('/search', monolithRoutes);
router.use('/settings', monolithRoutes);

// Dashboard routes - redirect to user service instead of monolith
router.use('/api/dashboard', userRoutes);

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableServices: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      jobs: '/api/jobs/*',
      messaging: '/api/messages/* or /api/conversations/*',
      payments: '/api/payments/*',
      legacy: '/notifications/*, /profile/*, etc.'
    }
  });
});

module.exports = router;
