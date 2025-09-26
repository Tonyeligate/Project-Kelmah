/**
 * Monolith Service Routes
 * Proxy configuration for legacy monolith endpoints
 * These will be gradually migrated to dedicated microservices
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middlewares/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').MONOLITH_SERVICE;

// Monolith proxy middleware
const monolithProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '', // No prefix rewrite for legacy routes
    requireAuth: true
  });
  return proxy(req, res, next);
};

// Public monolith proxy (for routes that don't require auth)
const publicMonolithProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '',
    requireAuth: false
  });
  return proxy(req, res, next);
};

// Public routes
router.get('/search/public', publicMonolithProxy); // Public search
router.get('/search/categories', publicMonolithProxy); // Search categories

// Protected routes
router.use(authenticate);

// Notification routes (to be migrated to notification-service)
router.get('/notifications', monolithProxy);
router.post('/notifications', monolithProxy);
router.put('/notifications/:notificationId/read', monolithProxy);
router.delete('/notifications/:notificationId', monolithProxy);
router.get('/notifications/unread-count', monolithProxy);

// Profile routes (to be migrated to user-service)
router.get('/profile', monolithProxy);
router.put('/profile', monolithProxy);
router.post('/profile/avatar', monolithProxy);
router.get('/profile/:userId', monolithProxy);

// Search routes (to be migrated to search-service)
router.get('/search', monolithProxy);
router.get('/search/jobs', monolithProxy);
router.get('/search/workers', monolithProxy);
router.get('/search/hirers', monolithProxy);
router.post('/search/save', monolithProxy);
router.get('/search/saved', monolithProxy);

// Settings routes (to be migrated to user-service)
router.get('/settings', monolithProxy);
router.put('/settings', monolithProxy);
router.put('/settings/notifications', monolithProxy);
router.put('/settings/privacy', monolithProxy);
router.put('/settings/security', monolithProxy);

// Dashboard routes (to be migrated to dashboard-service)
router.get('/api/dashboard/stats', monolithProxy);
router.get('/api/dashboard/worker', monolithProxy);
router.get('/api/dashboard/hirer', monolithProxy);
router.get('/api/dashboard/admin', monolithProxy);
router.get('/api/dashboard/analytics', monolithProxy);

// File upload routes (to be migrated to file-service)
router.post('/upload/avatar', monolithProxy);
router.post('/upload/documents', monolithProxy);
router.post('/upload/job-files', monolithProxy);
router.get('/files/:fileId', monolithProxy);
router.delete('/files/:fileId', monolithProxy);

// Review routes (to be migrated to review-service)
router.get('/reviews', monolithProxy);
router.post('/reviews', monolithProxy);
router.get('/reviews/:reviewId', monolithProxy);
router.put('/reviews/:reviewId', monolithProxy);
router.delete('/reviews/:reviewId', monolithProxy);

// Admin routes (to be migrated to admin-service)
router.get('/admin/users', monolithProxy);
router.put('/admin/users/:userId/status', monolithProxy);
router.get('/admin/jobs', monolithProxy);
router.get('/admin/analytics', monolithProxy);
router.get('/admin/reports', monolithProxy);

// Legacy API routes that haven't been categorized yet
// Guard behind feature flag to avoid masking missing routes
if (process.env.ENABLE_LEGACY_MONOLITH_PROXY === 'true') {
  router.use('*', (req, res, next) => {
    console.warn(`Legacy route accessed: ${req.originalUrl} - Consider migrating to dedicated service`);
    monolithProxy(req, res, next);
  });
} else {
  router.use('*', (req, res) => {
    res.status(404).json({
      message: 'Route not found. Legacy monolith proxy disabled. Use dedicated microservice routes via API Gateway.',
      path: req.originalUrl,
    });
  });
}

module.exports = router;