/**
 * Notification Service
 * Handles notification delivery across multiple channels
 */

const Notification = require('../models/notification.model');
const NotificationPreference = require('../models/notification-preference.model');
const emailService = require('./email.service');
const smsService = require('./sms.service');
const templateService = require('./template.service');
const notificationSocket = require('../socket/notificationSocket');
const logger = require('../../../utils/logger');
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, PRIORITY_LEVELS } = require('../constants');
const User = require('../../user-service/models/user.model');
const mongoose = require('mongoose');
const schedule = require('node-schedule');

// Map to track scheduled notifications
const scheduledNotifications = new Map();

/**
 * Initialize the notification service
 */
exports.init = async () => {
  try {
    // Initialize templates
    await templateService.initializeTemplates();
    
    // Schedule job to process scheduled notifications
    schedule.scheduleJob('*/1 * * * *', processScheduledNotifications); // Every minute
    
    // Schedule job to check for expired notifications
    schedule.scheduleJob('0 */2 * * *', cleanupExpiredNotifications); // Every 2 hours
    
    logger.info('Notification service initialized');
  } catch (error) {
    logger.error(`Error initializing notification service: ${error.message}`);
  }
};

/**
 * Send a notification to a user
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
exports.sendNotification = async (userId, type, title, message, options = {}) => {
  try {
    // Validate inputs
    if (!userId || !type || !title || !message) {
      throw new Error('Missing required notification parameters');
    }
    
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      logger.warn(`Unknown notification type: ${type}`);
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Get user preferences
    const preferences = await NotificationPreference.findOne({ user: userId });
    
    // Determine delivery channels based on preferences
    const channels = [];
    
    // In-app notifications are always created
    channels.push(NOTIFICATION_CHANNELS.IN_APP);
    
    // Add other channels based on preferences
    if (preferences) {
      if (preferences.channels.EMAIL && user.email && 
          (!preferences.types[type] || preferences.types[type].includes(NOTIFICATION_CHANNELS.EMAIL))) {
        channels.push(NOTIFICATION_CHANNELS.EMAIL);
      }
      
      if (preferences.channels.SMS && user.phone && 
          (!preferences.types[type] || preferences.types[type].includes(NOTIFICATION_CHANNELS.SMS))) {
        channels.push(NOTIFICATION_CHANNELS.SMS);
      }
      
      if (preferences.channels.PUSH && 
          (!preferences.types[type] || preferences.types[type].includes(NOTIFICATION_CHANNELS.PUSH))) {
        channels.push(NOTIFICATION_CHANNELS.PUSH);
      }
    } else {
      // Default to email if no preferences set
      if (user.email) {
        channels.push(NOTIFICATION_CHANNELS.EMAIL);
      }
    }
    
    // Create notification
    const notificationData = {
      recipient: userId,
      type,
      title,
      message,
      isRead: false,
      priority: options.priority || PRIORITY_LEVELS.MEDIUM,
      channels,
      sender: options.sender,
      relatedTo: options.relatedTo,
      relatedType: options.relatedType,
      relatedId: options.relatedId,
      metadata: options.metadata || {},
      deliveryStatus: {},
      actionLink: options.actionLink,
      actionText: options.actionText,
      expiresAt: options.expiresAt,
      scheduledFor: options.scheduledFor
    };
    
    // If scheduled for future, save and schedule
    if (options.scheduledFor && new Date(options.scheduledFor) > new Date()) {
      notificationData.status = 'scheduled';
      type,
      read: false,
      data: options.data || {},
      action: options.action || null,
      expiresAt: options.expiresAt || null
    };
    
    // Create notification in database
    const notification = await Notification.create(notificationData);
    
    // Track delivery status
    const deliveryStatus = {};
    
    // Deliver through enabled channels
    if (!preferences.channels || preferences.channels[NOTIFICATION_CHANNELS.IN_APP] !== false) {
      // Send in-app notification via socket if user is online
      await notificationSocket.sendNotification(userId, notification);
      deliveryStatus[NOTIFICATION_CHANNELS.IN_APP] = 'delivered';
    }
    
    // Get user details for email/SMS delivery
    const user = await User.findById(userId);
    
    if (!user) {
      logger.error(`User not found for notification: ${userId}`);
      return notification;
    }
    
    // Send email notification if enabled and user has email
    if ((!preferences.channels || preferences.channels[NOTIFICATION_CHANNELS.EMAIL] !== false) && 
        user.email && 
        validateEmail(user.email)) {
      try {
        await sendEmailNotification(user.email, type, title, message, {
          ...options,
          userName: `${user.firstName} ${user.lastName}`
        });
        deliveryStatus[NOTIFICATION_CHANNELS.EMAIL] = 'sent';
      } catch (error) {
        logger.error(`Error sending email notification: ${error.message}`);
        deliveryStatus[NOTIFICATION_CHANNELS.EMAIL] = 'failed';
      }
    }
    
    // Send SMS notification if enabled, user has phone, and notification is high priority
    if ((!preferences.channels || preferences.channels[NOTIFICATION_CHANNELS.SMS] !== false) && 
        user.phone && 
        validatePhone(user.phone) && 
        (priority === PRIORITY_LEVELS.HIGH || priority === PRIORITY_LEVELS.URGENT || options.forceSms)) {
      try {
        await sendSmsNotification(user.phone, type, message);
        deliveryStatus[NOTIFICATION_CHANNELS.SMS] = 'sent';
      } catch (error) {
        logger.error(`Error sending SMS notification: ${error.message}`);
        deliveryStatus[NOTIFICATION_CHANNELS.SMS] = 'failed';
      }
    }
    
    // Update notification with delivery status
    if (Object.keys(deliveryStatus).length > 0) {
      notification.deliveryStatus = deliveryStatus;
      await notification.save();
    }
    
    return notification;
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
    throw error;
  }
};

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Created notifications
 */
exports.sendBulkNotifications = async (userIds, type, title, message, options = {}) => {
  try {
    const notifications = [];
    
    // Process in batches to avoid overloading the system
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(userId => 
        this.sendNotification(userId, type, title, message, options)
          .catch(error => {
            logger.error(`Error sending notification to user ${userId}: ${error.message}`);
            return null;
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      notifications.push(...batchResults.filter(n => n !== null));
    }
    
    return notifications;
  } catch (error) {
    logger.error(`Error sending bulk notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Send system-wide notification to all users or specific role
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Created notifications
 */
exports.sendSystemNotification = async (type, title, message, options = {}) => {
  try {
    // Find all active users, optionally filtered by role
    const filter = { active: true };
    
    if (options.role) {
      filter.role = options.role;
    }
    
    const users = await User.find(filter, '_id');
    const userIds = users.map(user => user._id.toString());
    
    if (userIds.length === 0) {
      logger.info('No users found for system notification');
      return [];
    }
    
    // Set notification type to system announcement if not specified
    const notificationType = type || NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT;
    
    return await this.sendBulkNotifications(
      userIds,
      notificationType,
      title,
      message,
      options
    );
  } catch (error) {
    logger.error(`Error sending system notification: ${error.message}`);
    throw error;
  }
};

/**
 * Send a scheduled notification
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Date} scheduleDate - Date to deliver the notification
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
exports.scheduleNotification = async (userId, type, title, message, scheduleDate, options = {}) => {
  try {
    if (!(scheduleDate instanceof Date) || scheduleDate <= new Date()) {
      throw new Error('Schedule date must be a valid future date');
    }
    
    // Create notification with scheduled status
    const notification = await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      read: false,
      scheduled: true,
      scheduledFor: scheduleDate,
      data: options.data || {},
      action: options.action || null,
      expiresAt: options.expiresAt || null
    });
    
    logger.info(`Notification scheduled for user ${userId} at ${scheduleDate.toISOString()}`);
    
    return notification;
  } catch (error) {
    logger.error(`Error scheduling notification: ${error.message}`);
    throw error;
  }
};

/**
 * Process scheduled notifications that are due
 */
exports.processScheduledNotifications = async () => {
  try {
    const now = new Date();
    
    // Find scheduled notifications that are due
    const dueNotifications = await Notification.find({
      scheduled: true,
      scheduledFor: { $lte: now }
    });
    
    logger.info(`Processing ${dueNotifications.length} scheduled notifications`);
    
    // Process each notification
    for (const notification of dueNotifications) {
      try {
        // Mark as no longer scheduled
        notification.scheduled = false;
        await notification.save();
        
        // Send through appropriate channels
        await this.sendNotification(
          notification.recipient,
          notification.type,
          notification.title,
          notification.message,
          {
            data: notification.data,
            action: notification.action,
            expiresAt: notification.expiresAt
          }
        );
      } catch (error) {
        logger.error(`Error processing scheduled notification ${notification._id}: ${error.message}`);
      }
    }
    
    return dueNotifications.length;
  } catch (error) {
    logger.error(`Error processing scheduled notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
async function getUserPreferences(userId) {
  try {
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    if (!preferences) {
      // Create default preferences
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
    
    return {
      channels: preferences.channels || {},
      types: preferences.types || {}
    };
  } catch (error) {
    logger.error(`Error getting user preferences: ${error.message}`);
    
    // Return default preferences on error
    return {
      channels: {},
      types: {}
    };
  }
}

/**
 * Send email notification
 * @param {string} email - Recipient email
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 */
async function sendEmailNotification(email, type, title, message, data = {}) {
  try {
    // Get email template based on notification type
    const templateName = `${type.toLowerCase().replace(/_/g, '-')}-notification`;
    
    // Send email
    await emailService.sendNotificationEmail(email, title, templateName, {
      title,
      message,
      ...data
    });
    
    logger.info(`Email notification sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending email notification: ${error.message}`);
    throw error;
  }
}

/**
 * Send SMS notification
 * @param {string} phone - Recipient phone number
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 */
async function sendSmsNotification(phone, type, message) {
  try {
    // Send SMS with notification message
    await smsService.sendNotificationSms(phone, message);
    
    logger.info(`SMS notification sent to ${phone}`);
  } catch (error) {
    logger.error(`Error sending SMS notification: ${error.message}`);
    throw error;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate phone number format
 * @param {string} phone - Phone to validate
 * @returns {boolean} Is valid
 */
function validatePhone(phone) {
  // Simple validation - can be enhanced for country-specific formats
  return phone && phone.replace(/\D/g, '').length >= 10;
}