const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

// Import rate limiter for notifications
const { createLimiter } = require('../utils/rateLimiter');

// Apply notification-specific rate limiting
router.use(createLimiter('notifications'));

// Authentication middleware is applied in server.js

// Notification routes
router.get("/", notificationController.getUserNotifications);
router.get("/unread/count", notificationController.getUnreadCount);
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);
router.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsRead,
);
router.patch("/read/all", notificationController.markAllNotificationsAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);
router.delete("/clear-all", notificationController.clearAllNotifications);

module.exports = router;
