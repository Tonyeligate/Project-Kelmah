const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const notificationController = require('../controllers/notification.controller');
const notificationValidation = require('../validations/notification.validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get my notifications (paginated)
router.get('/', notificationController.getNotifications);

// Mark a notification as read
router.put(
  '/:id/read',
  validate(notificationValidation.markRead),
  notificationController.markAsRead
);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 