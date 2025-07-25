const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const notificationValidation = require('../validations/notification.validation');
const notificationController = require('../controllers/notification.controller');

// All notification routes require authentication
router.use(authenticateUser);

// Create a notification (admin only)
router.post(
  '/',
  authorizeRoles(['admin']),
  validate(notificationValidation.createNotification),
  notificationController.createNotification
);

// List all notifications (admin only)
router.get(
  '/',
  authorizeRoles(['admin']),
  notificationController.getNotifications
);

// Get notification by ID (admin only)
router.get(
  '/:id',
  authorizeRoles(['admin']),
  notificationController.getNotificationById
);

// Update notification by ID (admin only)
router.put(
  '/:id',
  authorizeRoles(['admin']),
  validate(notificationValidation.updateNotification),
  notificationController.updateNotification
);

// Delete notification by ID (admin only)
router.delete(
  '/:id',
  authorizeRoles(['admin']),
  notificationController.deleteNotification
);

module.exports = router; 