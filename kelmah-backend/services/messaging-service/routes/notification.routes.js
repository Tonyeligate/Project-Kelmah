const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticate);

// Notification routes
router.get("/", notificationController.getUserNotifications);
router.get("/unread/count", notificationController.getUnreadCount);
router.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsRead,
);
router.patch("/read/all", notificationController.markAllNotificationsAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
