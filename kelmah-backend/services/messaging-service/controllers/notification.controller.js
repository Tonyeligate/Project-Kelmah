const { Notification, NotificationPreference, User } = require("../models");
const { handleError } = require("../utils/errorHandler");

const getRequesterId = (req) => req?.user?._id || req?.user?.id;

// Allowed fields for preference updates (whitelist)
const ALLOWED_PREF_FIELDS = ["channels", "types"];

/**
 * Preference-aware notification creation helper.
 * Checks user's NotificationPreference before persisting.
 * Returns the created notification or null if user has disabled this type.
 */
const createNotificationForUser = async (
  recipientId,
  { type, title, content, actionUrl, relatedEntity, priority, metadata },
  { io } = {},
) => {
  try {
    // Check user preferences — skip if type is explicitly disabled
    const prefs = await NotificationPreference.findOne({ user: recipientId });
    if (prefs) {
      // Check if the notification type is disabled
      if (prefs.types && prefs.types[type] === false) {
        return null; // User has disabled this notification type
      }
      // Check if in-app channel is disabled
      if (prefs.channels && prefs.channels.inApp === false) {
        return null; // User has disabled in-app notifications
      }
    }

    // Resolve modelRef for relatedEntity
    const ENTITY_MODEL_MAP = Notification.ENTITY_MODEL_MAP || {};
    const entityData = relatedEntity
      ? {
          ...relatedEntity,
          modelRef: ENTITY_MODEL_MAP[relatedEntity.type] || "User",
        }
      : undefined;

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      content,
      actionUrl,
      relatedEntity: entityData,
      priority: priority || "medium",
      metadata: metadata || {},
    });

    // Emit real-time notification via socket if io instance is available
    if (io) {
      io.to(`user_${recipientId}`).emit("notification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        actionUrl: notification.actionUrl,
        relatedEntity: notification.relatedEntity,
        priority: notification.priority,
        metadata: notification.metadata,
        read: false,
        readStatus: { isRead: false },
        createdAt: notification.createdAt,
      });
    }

    // Check if email channel is enabled and send email notification
    if (prefs?.channels?.email) {
      try {
        const emailService = require("../services/notificationEmailService");
        const user = await User.findById(recipientId).select("email firstName").lean();
        if (user?.email) {
          await emailService.sendNotificationEmail(user, notification);
        }
      } catch (emailErr) {
        // Email failure should not block notification creation
        console.warn("Failed to send notification email:", emailErr.message);
      }
    }

    return notification;
  } catch (error) {
    console.error("createNotificationForUser error:", error.message);
    throw error;
  }
};

// Export helper for use by other modules (e.g. messageSocket)
exports.createNotificationForUser = createNotificationForUser;

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    // Validate pagination params
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const query = {
      recipient: requesterId,
    };

    if (unreadOnly === "true") {
      query["readStatus.isRead"] = false;
    }
    if (type && typeof type === "string" && type !== "all") {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(); // Use lean() for read-only — faster, plain objects

    const totalNotifications = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalNotifications,
        pages: Math.ceil(totalNotifications / safeLimit),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark notification as read (optimized: single DB call)
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: requesterId },
      { $set: { "readStatus.isRead": true, "readStatus.readAt": new Date() } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: { message: "Notification not found" } });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    const result = await Notification.updateMany(
      {
        recipient: requesterId,
        "readStatus.isRead": false,
      },
      {
        $set: {
          "readStatus.isRead": true,
          "readStatus.readAt": new Date(),
        },
      },
    );

    res.json({ success: true, message: "All notifications marked as read", data: { modified: result.modifiedCount } });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete notification (optimized: single DB call)
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: requesterId,
    });

    if (!result) {
      return res.status(404).json({ success: false, error: { message: "Notification not found" } });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Clear all notifications for current user
exports.clearAllNotifications = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    const result = await Notification.deleteMany({
      recipient: requesterId,
    });

    res.json({ success: true, message: "All notifications cleared", data: { deleted: result.deletedCount } });
  } catch (error) {
    handleError(res, error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    const count = await Notification.countDocuments({
      recipient: requesterId,
      "readStatus.isRead": false,
    });

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    handleError(res, error);
  }
};

// Get or initialize notification preferences for current user
exports.getPreferences = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let prefs = await NotificationPreference.findOne({ user: requesterId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: requesterId });
    }
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error);
  }
};

// Update notification preferences (sanitized — only allows channels and types)
exports.updatePreferences = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }

    // Whitelist only allowed fields to prevent overwriting user or _id
    const rawBody = req.body || {};
    const sanitized = {};
    for (const key of ALLOWED_PREF_FIELDS) {
      if (rawBody[key] !== undefined) {
        sanitized[key] = rawBody[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ success: false, error: { message: "No valid preference fields provided" } });
    }

    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: requesterId },
      { $set: sanitized },
      { new: true, upsert: true },
    );
    res.json({ success: true, data: prefs });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Create a system notification (used by other services via internal API).
 * Expects: { recipient, type, title, content, actionUrl?, relatedEntity?, priority?, metadata? }
 */
exports.createSystemNotification = async (req, res) => {
  try {
    const { recipient, type, title, content, actionUrl, relatedEntity, priority, metadata } = req.body || {};

    if (!recipient || !type || !title || !content) {
      return res.status(400).json({
        success: false,
        error: { message: "recipient, type, title, and content are required" },
      });
    }

    // Validate type enum
    const validTypes = [
      "job_application", "job_offer", "contract_update",
      "payment_received", "message_received", "system_alert",
      "profile_update", "review_received",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      });
    }

    // Get io instance from app if available
    const io = req.app?.get("io") || null;

    const notification = await createNotificationForUser(
      recipient,
      { type, title, content, actionUrl, relatedEntity, priority, metadata },
      { io },
    );

    if (!notification) {
      return res.json({ success: true, message: "Notification skipped (disabled by user preferences)" });
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    handleError(res, error);
  }
};
