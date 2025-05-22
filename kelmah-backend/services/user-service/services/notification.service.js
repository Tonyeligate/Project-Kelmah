const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const emailService = require('./email.service');
const smsService = require('./sms.service');

// Notification types
const NOTIFICATION_TYPES = {
  JOB_POSTED: 'job_posted',
  JOB_APPLIED: 'job_applied',
  JOB_ASSIGNED: 'job_assigned',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_released',
  MESSAGE_RECEIVED: 'message_received',
  REVIEW_RECEIVED: 'review_received',
  DOCUMENT_VERIFIED: 'document_verified',
  DOCUMENT_REJECTED: 'document_rejected',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

// Notification priorities
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Delivery channels
const DELIVERY_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

// Notification templates for each type and channel
const notificationTemplates = {
  [NOTIFICATION_TYPES.JOB_POSTED]: {
    [DELIVERY_CHANNELS.IN_APP]: {
      title: 'New Job Posted',
      body: 'A new job in {{category}} has been posted that matches your skills.',
      priority: PRIORITY_LEVELS.MEDIUM
    },
    [DELIVERY_CHANNELS.EMAIL]: {
      subject: 'New Job Opportunity on Kelmah',
      body: `
        <h2>New Job Opportunity</h2>
        <p>Hello {{userName}},</p>
        <p>A new job has been posted that matches your skills:</p>
        <p><strong>{{jobTitle}}</strong> - {{jobDescription}}</p>
        <p>Budget: {{budget}}</p>
        <p><a href="{{jobLink}}">View Job Details</a></p>
      `
    }
  },
  [NOTIFICATION_TYPES.JOB_APPLIED]: {
    [DELIVERY_CHANNELS.IN_APP]: {
      title: 'New Job Application',
      body: '{{workerName}} has applied to your job: {{jobTitle}}',
      priority: PRIORITY_LEVELS.HIGH
    },
    [DELIVERY_CHANNELS.EMAIL]: {
      subject: 'New Application for Your Job on Kelmah',
      body: `
        <h2>New Job Application</h2>
        <p>Hello {{userName}},</p>
        <p>{{workerName}} has applied to your job "{{jobTitle}}".</p>
        <p><a href="{{applicationLink}}">Review Application</a></p>
      `
    }
  },
  [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
    [DELIVERY_CHANNELS.IN_APP]: {
      title: 'New Message',
      body: 'You have a new message from {{senderName}}',
      priority: PRIORITY_LEVELS.MEDIUM
    },
    [DELIVERY_CHANNELS.EMAIL]: {
      subject: 'New Message on Kelmah',
      body: `
        <h2>New Message</h2>
        <p>Hello {{userName}},</p>
        <p>You have received a new message from {{senderName}}.</p>
        <p><a href="{{messageLink}}">View Message</a></p>
      `
    },
    [DELIVERY_CHANNELS.SMS]: {
      body: 'Kelmah: New message from {{senderName}}. Check your inbox.'
    }
  },
  // Add templates for other notification types...
};

// Helper to get user preferences
const getUserPreferences = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'notificationPreferences']
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.notificationPreferences || {
      // Default preferences
      [NOTIFICATION_TYPES.JOB_POSTED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.JOB_APPLIED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.JOB_ASSIGNED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL, DELIVERY_CHANNELS.SMS],
      [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL, DELIVERY_CHANNELS.SMS],
      [NOTIFICATION_TYPES.PAYMENT_RELEASED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.REVIEW_RECEIVED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.DOCUMENT_VERIFIED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.DOCUMENT_REJECTED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.ASSESSMENT_COMPLETED]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL]
    };
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    // Return default preferences
    return {
      [NOTIFICATION_TYPES.JOB_POSTED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.JOB_APPLIED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.JOB_ASSIGNED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.PAYMENT_RELEASED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.REVIEW_RECEIVED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.DOCUMENT_VERIFIED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.DOCUMENT_REJECTED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.ASSESSMENT_COMPLETED]: [DELIVERY_CHANNELS.IN_APP],
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: [DELIVERY_CHANNELS.IN_APP]
    };
  }
};

// Process template with data
const processTemplate = (template, data) => {
  let processed = template;
  
  // Replace placeholders with actual data
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key]);
  });
  
  return processed;
};

// Create notification service
const notificationService = {
  // Send notification to a user
  sendNotification: async (userId, type, data = {}, options = {}) => {
    try {
      // Get user preferences
      const preferences = await getUserPreferences(userId);
      
      // Determine which channels to use based on preferences and type
      const channels = preferences[type] || [DELIVERY_CHANNELS.IN_APP];
      
      // Get the user for sending notifications
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'phone', 'firstName', 'lastName']
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Add user name to data
      data.userName = `${user.firstName} ${user.lastName}`;
      
      // Send notifications through each channel
      const deliveryPromises = [];
      const deliveryStatus = {};
      
      // Always create in-app notification
      const inAppTemplate = notificationTemplates[type]?.[DELIVERY_CHANNELS.IN_APP] || {
        title: type,
        body: 'You have a new notification',
        priority: PRIORITY_LEVELS.MEDIUM
      };
      
      // Create notification record
      const notification = await Notification.create({
        userId,
        type,
        title: processTemplate(inAppTemplate.title, data),
        content: processTemplate(inAppTemplate.body, data),
        data: data,
        priority: options.priority || inAppTemplate.priority,
        readAt: null
      });
      
      deliveryStatus[DELIVERY_CHANNELS.IN_APP] = 'sent';
      
      // Send email if in preferences
      if (channels.includes(DELIVERY_CHANNELS.EMAIL) && user.email) {
        const emailTemplate = notificationTemplates[type]?.[DELIVERY_CHANNELS.EMAIL];
        
        if (emailTemplate) {
          deliveryPromises.push(
            emailService.sendEmail({
              to: user.email,
              subject: processTemplate(emailTemplate.subject, data),
              html: processTemplate(emailTemplate.body, data)
            }).then(() => {
              deliveryStatus[DELIVERY_CHANNELS.EMAIL] = 'sent';
            }).catch(error => {
              console.error('Error sending email notification:', error);
              deliveryStatus[DELIVERY_CHANNELS.EMAIL] = 'failed';
            })
          );
        }
      }
      
      // Send SMS if in preferences
      if (channels.includes(DELIVERY_CHANNELS.SMS) && user.phone) {
        const smsTemplate = notificationTemplates[type]?.[DELIVERY_CHANNELS.SMS];
        
        if (smsTemplate) {
          deliveryPromises.push(
            smsService.sendSms({
              to: user.phone,
              message: processTemplate(smsTemplate.body, data)
            }).then(() => {
              deliveryStatus[DELIVERY_CHANNELS.SMS] = 'sent';
            }).catch(error => {
              console.error('Error sending SMS notification:', error);
              deliveryStatus[DELIVERY_CHANNELS.SMS] = 'failed';
            })
          );
        }
      }
      
      // Wait for all delivery promises to resolve
      await Promise.all(deliveryPromises);
      
      // Update notification with delivery status
      await notification.update({
        deliveryStatus
      });
      
      // If websocket is available, send real-time notification
      if (global.io) {
        global.io.to(`user:${userId}`).emit('notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },
  
  // Send batch notifications
  sendBatchNotifications: async (userIds, type, data = {}, options = {}) => {
    try {
      const notifications = [];
      
      // Send notifications to each user
      for (const userId of userIds) {
        try {
          const notification = await notificationService.sendNotification(userId, type, data, options);
          notifications.push(notification);
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error);
          // Continue with other users
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error sending batch notifications:', error);
      throw error;
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId, userId) => {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId
        }
      });
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      notification.readAt = new Date();
      await notification.save();
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    try {
      await Notification.update(
        { readAt: new Date() },
        { where: { userId, readAt: null } }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  // Get notifications for a user
  getNotifications: async (userId, options = {}) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const offset = (page - 1) * limit;
      
      const whereClause = { userId };
      
      if (unreadOnly) {
        whereClause.readAt = null;
      }
      
      const { count, rows } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      
      return {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  // Delete a notification
  deleteNotification: async (notificationId, userId) => {
    try {
      const deleted = await Notification.destroy({
        where: {
          id: notificationId,
          userId
        }
      });
      
      if (!deleted) {
        throw new Error('Notification not found or unauthorized');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
  
  // Get unread count
  getUnreadCount: async (userId) => {
    try {
      const count = await Notification.count({
        where: {
          userId,
          readAt: null
        }
      });
      
      return { count };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },
  
  // Update user notification preferences
  updateUserPreferences: async (userId, preferences) => {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Merge with existing preferences
      const currentPreferences = user.notificationPreferences || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      await user.update({
        notificationPreferences: updatedPreferences
      });
      
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
};

module.exports = {
  notificationService,
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS,
  DELIVERY_CHANNELS
}; 