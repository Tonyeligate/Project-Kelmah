/**
 * Admin Routes
 * Routes for admin operations
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const systemConfigController = require('../controllers/system-config.controller');
const { auth: authMiddleware } = require('../../../middleware/auth');
const { roleCheck: checkRole } = require('../../../middleware/roleCheck');
const adminReviewController = require('../controllers/admin.review.controller');
const { authenticateJWT, authorizeAdmin } = require('../middleware/auth');

// Apply authentication and admin authorization to all routes
router.use(authenticateJWT, authorizeAdmin);

// User Management Routes
router.get('/users',
  [authMiddleware, checkRole('admin')],
  adminController.getAllUsers
);

router.get('/users/:id',
  [authMiddleware, checkRole('admin')],
  adminController.getUserById
);

router.post('/users/:id/status',
  [
    authMiddleware,
    checkRole('admin'),
    body('status').isIn(['active', 'inactive', 'suspended', 'banned']).withMessage('Invalid status value')
  ],
  adminController.updateUserStatus
);

// System Analytics Routes
router.get('/analytics',
  [authMiddleware, checkRole('admin')],
  adminController.getAnalytics
);

router.post('/analytics/generate',
  [authMiddleware, checkRole('admin')],
  adminController.generateDailyAnalytics
);

// Get admin action logs
router.get('/logs',
  [authMiddleware, checkRole('admin')],
  adminController.getActionLogs
);

// System Configuration Routes
router.get('/system-config',
  [authMiddleware, checkRole('admin')],
  systemConfigController.getAllConfigs
);

router.get('/system-config/category/:category',
  [authMiddleware, checkRole('admin')],
  systemConfigController.getConfigsByCategory
);

router.post('/system-config',
  [
    authMiddleware,
    checkRole('admin'),
    body('category').notEmpty().withMessage('Category is required'),
    body('key').notEmpty().withMessage('Key is required'),
    body('value').exists().withMessage('Value is required')
  ],
  systemConfigController.updateConfig
);

router.delete('/system-config/:id',
  [authMiddleware, checkRole('admin')],
  systemConfigController.deleteConfig
);

router.post('/system-config/initialize',
  [authMiddleware, checkRole('admin')],
  systemConfigController.initializeDefaults
);

// System Overview route
router.get('/system',
  [authMiddleware, checkRole('admin')],
  adminController.getSystemAnalytics
);

// Admin review moderation routes
router.get('/reviews', adminReviewController.getReviewsForModeration);
router.get('/reviews/:reviewId', adminReviewController.getReviewDetails);
router.post('/reviews/approve', adminReviewController.approveReview);
router.post('/reviews/reject', adminReviewController.rejectReview);
router.post('/reviews/flag', adminReviewController.flagReview);

module.exports = router; 