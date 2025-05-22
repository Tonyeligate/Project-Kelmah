const Notification = require('../models/notification.model');
const NotificationPreference = require('../models/notification-preference.model');
const User = require('../../user-service/models/user.model');
const { sendError } = require('../../../utils/error-handler');
const { validateObjectId } = require('../../../utils/validators');
const logger = require('../../../utils/logger');
const { 
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS
} = require('../constants');

// Fetch notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, read, type } = req.query;
    const userId = req.user.id;

    // Build query
    const query = { recipient: userId };
    
    // Filter by read status if provided
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    // Filter by type if provided
    if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
      query.type = type;
    }

    const options = {
      sort: { createdAt: -1 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };

    const notifications = await Notification.find(query, null, options);
    const total = await Notification.countDocuments(query);
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        total,
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error });
    sendError(res, error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOne({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read', { error });
    sendError(res, error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error });
    sendError(res, error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOne({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification', { error });
    sendError(res, error);
  }
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    // Create default preferences if not found
    if (!preferences) {
      preferences = await NotificationPreference.create({
        user: userId,
        channels: Object.values(NOTIFICATION_CHANNELS).reduce((acc, channel) => {
          acc[channel] = true;
          return acc;
        }, {}),
        types: Object.values(NOTIFICATION_TYPES).reduce((acc, type) => {
          acc[type] = true;
          return acc;
        }, {})
      });
    }

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error fetching notification preferences', { error });
    sendError(res, error);
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { channels, types } = req.body;
    
    // Validate that channels and types contain only valid keys
    if (channels) {
      const validChannels = Object.values(NOTIFICATION_CHANNELS);
      Object.keys(channels).forEach(key => {
        if (!validChannels.includes(key)) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification channel: ${key}`
          });
        }
        
        if (typeof channels[key] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'Channel preference must be a boolean value'
          });
        }
      });
    }
    
    if (types) {
      const validTypes = Object.values(NOTIFICATION_TYPES);
      Object.keys(types).forEach(key => {
        if (!validTypes.includes(key)) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification type: ${key}`
          });
        }
        
        if (typeof types[key] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'Type preference must be a boolean value'
          });
        }
      });
    }

    // Find or create preferences
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    if (!preferences) {
      // Create with defaults and override with provided values
      const defaultChannels = Object.values(NOTIFICATION_CHANNELS).reduce((acc, channel) => {
        acc[channel] = true;
        return acc;
      }, {});
      
      const defaultTypes = Object.values(NOTIFICATION_TYPES).reduce((acc, type) => {
        acc[type] = true;
        return acc;
      }, {});
      
      preferences = await NotificationPreference.create({
        user: userId,
        channels: channels ? { ...defaultChannels, ...channels } : defaultChannels,
        types: types ? { ...defaultTypes, ...types } : defaultTypes
      });
    } else {
      // Update existing preferences
      if (channels) {
        preferences.channels = { ...preferences.channels, ...channels };
      }
      
      if (types) {
        preferences.types = { ...preferences.types, ...types };
      }
      
      await preferences.save();
    }

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences', { error });
    sendError(res, error);
  }
};

// Create and send notification (for admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const { 
      recipient, 
      title, 
      message, 
      type, 
      action, 
      data 
    } = req.body;

    // Validation
    if (!validateObjectId(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient ID'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!type || !Object.values(NOTIFICATION_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid notification type is required'
      });
    }

    // Verify recipient exists
    const user = await User.findById(recipient);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check user's notification preferences
    const preferences = await NotificationPreference.findOne({ user: recipient });
    
    // Only create if user has this notification type enabled or preferences don't exist (default is true)
    if (!preferences || preferences.types[type]) {
      const notification = await Notification.create({
        recipient,
        title,
        message,
        type,
        action,
        data,
        read: false
      });

      // If real-time notification needed, we would emit a socket event here
      // This would be handled by a notification service

      res.status(201).json({
        success: true,
        data: notification
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Notification not created - user has disabled this notification type',
        data: null
      });
    }
  } catch (error) {
    logger.error('Error creating notification', { error });
    sendError(res, error);
  }
};

// Get notification by ID (for admin/system use)
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Error fetching notification by ID', { error });
    sendError(res, error);
  }
}; 