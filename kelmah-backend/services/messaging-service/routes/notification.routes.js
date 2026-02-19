const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

// Import rate limiter for notifications
const { createLimiter } = require("../utils/rateLimiter");

// Apply notification-specific rate limiting
router.use(createLimiter("notifications"));

// Authentication middleware is applied in server.js

// Notification routes
// ⚠️ ROUTE ORDER: Literal paths MUST come before parameterized /:notificationId
// to prevent Express from matching literals like "read" or "clear-all" as IDs
router.get("/", notificationController.getUserNotifications);
router.get("/unread/count", notificationController.getUnreadCount);
router.get("/preferences", notificationController.getPreferences);
router.put("/preferences", notificationController.updatePreferences);
router.patch("/read/all", notificationController.markAllNotificationsAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);

// System notification creation endpoint (for inter-service use)
router.post("/system", notificationController.createSystemNotification);

router.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsRead,
);
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
