const { Notification, NotificationPreference } = require("../models");
const { handleError } = require("../utils/errorHandler");

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    const query = {
      recipient: req.user._id,
    };

    if (unreadOnly === "true") {
      query["readStatus.isRead"] = false;
    }
    if (type && typeof type === "string" && type !== "all") {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(
        (Math.max(1, parseInt(page)) - 1) *
          Math.min(100, Math.max(1, parseInt(limit))),
      )
      .limit(Math.min(100, Math.max(1, parseInt(limit))))
      .populate({
        path: "relatedEntity.id",
        select: "firstName lastName profilePicture title",
      });

    const totalNotifications = await Notification.countDocuments(query);

    res.json({
      data: notifications,
      pagination: {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, Math.max(1, parseInt(limit))),
        total: totalNotifications,
        pages: Math.ceil(
          totalNotifications / Math.min(100, Math.max(1, parseInt(limit))),
        ),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.markAsRead();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        "readStatus.isRead": false,
      },
      {
        $set: {
          "readStatus.isRead": true,
          "readStatus.readAt": new Date(),
        },
      },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.deleteOne();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Clear all notifications for current user
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
    });

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    handleError(res, error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      "readStatus.isRead": false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    handleError(res, error);
  }
};

// Get or initialize notification preferences for current user
exports.getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user._id });
    }
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error);
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const updates = req.body || {};
    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true },
    );
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error);
  }
};
