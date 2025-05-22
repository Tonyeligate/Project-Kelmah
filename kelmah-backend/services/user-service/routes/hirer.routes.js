/**
 * Hirer Routes
 */
const express = require('express');
const router = express.Router();
const hirerController = require('../controllers/hirer.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Debug logs for route registration
console.log('Registering hirer routes');

// Health check endpoint (accessible without auth for testing)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hirer routes are working properly',
    timestamp: new Date().toISOString()
  });
});

// Apply auth middleware to all protected routes
router.use(authMiddleware.protect);

// Profile routes
router.get('/profile', hirerController.getHirerProfile);

// Job routes
router.get('/jobs', hirerController.getHirerJobs);
router.post('/jobs', hirerController.createJob);
router.put('/jobs/:jobId', hirerController.updateJob);

// Debug log for all registered routes
console.log('Hirer routes registered:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`- ${Object.keys(r.route.methods).join(', ').toUpperCase()}: /hirer${r.route.path}`);
  }
});

module.exports = router; 