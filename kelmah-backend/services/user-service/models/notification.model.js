/**
 * Notification Model
 * Defines the structure and behavior of notifications in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Recipient user
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'The user who should receive this notification'
  },
  // Notification content
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Notification type
  type: {
    type: DataTypes.ENUM(
      'message', 'job_application', 'job_update', 'payment', 'review',
      'contract', 'milestone', 'system', 'profile', 'security', 'marketing'
    ),
    allowNull: false
  },
  // Notification priority
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    allowNull: false
  },
  // Notification status
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Related content references
  relatedId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of related entity (job, message, etc.)'
  },
  relatedType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of related entity (Job, Message, etc.)'
  },
  // Action link
  actionLink: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL or deep link for primary action'
  },
  actionText: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Button/link text for primary action'
  },
  secondaryActionLink: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL or deep link for secondary action'
  },
  secondaryActionText: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Button/link text for secondary action'
  },
  // Icon and image
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Icon name or URL'
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Image URL for rich notifications'
  },
  // Expiration and scheduling
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the notification should expire'
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the notification should be delivered if scheduled'
  },
  // Delivery channels
  channels: {
    type: DataTypes.JSON, // Array of channels: 'in_app', 'email', 'sms', 'push'
    defaultValue: ['in_app'],
    comment: 'Channels this notification was/will be sent through'
  },
  // Delivery status
  deliveryStatus: {
    type: DataTypes.JSON, // Object with channel status: { email: 'sent', push: 'failed', etc. }
    defaultValue: {},
    comment: 'Delivery status for each channel'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for the notification'
  },
  // Source information
  sender: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who triggered this notification, if applicable'
  },
  sourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Source of the notification (system, user action, etc.)'
  },
  // For email notifications
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email provider message ID'
  },
  // For push notifications
  pushSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pushId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Push provider message ID'
  },
  // For SMS notifications
  smsSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  smsId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'SMS provider message ID'
  },
  // User interaction
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the notification was clicked/actioned'
  },
  dismissedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the notification was dismissed'
  },
  // For grouping related notifications
  groupId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID for grouping related notifications'
  },
  groupOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order within the group'
  }
}, {
  tableName: 'notifications',
  timestamps: true, // createdAt and updatedAt
  indexes: [
    {
      name: 'notifications_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'notifications_read_status_idx',
      fields: ['isRead']
    },
    {
      name: 'notifications_type_idx',
      fields: ['type']
    },
    {
      name: 'notifications_created_at_idx',
      fields: ['createdAt']
    },
    {
      name: 'notifications_related_id_type_idx',
      fields: ['relatedId', 'relatedType']
    },
    {
      name: 'notifications_group_id_idx',
      fields: ['groupId']
    }
  ]
});

/**
 * Class methods
 */

// Find unread notifications for a user
Notification.findUnreadForUser = async function(userId, limit = 20, offset = 0) {
  return await Notification.findAll({
    where: {
      userId,
      isRead: false,
      [sequelize.Op.or]: [
        { expiresAt: null },
        { expiresAt: { [sequelize.Op.gt]: new Date() } }
      ],
      [sequelize.Op.or]: [
        { scheduledFor: null },
        { scheduledFor: { [sequelize.Op.lte]: new Date() } }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find all notifications for a user with pagination
Notification.findForUser = async function(userId, options = {}) {
  const { limit = 20, offset = 0, includeRead = true, type = null } = options;
  
  const whereClause = {
    userId,
    [sequelize.Op.or]: [
      { expiresAt: null },
      { expiresAt: { [sequelize.Op.gt]: new Date() } }
    ],
    [sequelize.Op.or]: [
      { scheduledFor: null },
      { scheduledFor: { [sequelize.Op.lte]: new Date() } }
    ]
  };
  
  if (!includeRead) {
    whereClause.isRead = false;
  }
  
  if (type) {
    whereClause.type = type;
  }
  
  return await Notification.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Count unread notifications for a user
Notification.countUnreadForUser = async function(userId, type = null) {
  const whereClause = {
    userId,
    isRead: false,
    [sequelize.Op.or]: [
      { expiresAt: null },
      { expiresAt: { [sequelize.Op.gt]: new Date() } }
    ],
    [sequelize.Op.or]: [
      { scheduledFor: null },
      { scheduledFor: { [sequelize.Op.lte]: new Date() } }
    ]
  };
  
  if (type) {
    whereClause.type = type;
  }
  
  return await Notification.count({ where: whereClause });
};

// Create a notification
Notification.createNotification = async function(data) {
  // Validate required fields
  if (!data.userId || !data.title || !data.message || !data.type) {
    throw new Error('Missing required notification fields');
  }
  
  return await Notification.create(data);
};

// Create notifications for multiple users
Notification.createBulkNotifications = async function(userIds, notificationData) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('Must provide at least one user ID');
  }
  
  const notifications = userIds.map(userId => ({
    ...notificationData,
    userId,
    id: require('uuid').v4() // Generate a unique ID for each notification
  }));
  
  return await Notification.bulkCreate(notifications);
};

// Mark expired notifications
Notification.markExpiredNotifications = async function() {
  const now = new Date();
  
  // Find expired notifications that haven't been marked as such
  const expiredNotifications = await Notification.findAll({
    where: {
      expiresAt: { [sequelize.Op.lt]: now },
      metadata: { 
        [sequelize.Op.or]: [
          { [sequelize.Op.eq]: null },
          { expired: { [sequelize.Op.not]: true } }
        ]
      }
    }
  });
  
  // Mark each as expired in metadata
  for (const notification of expiredNotifications) {
    notification.metadata = {
      ...notification.metadata,
      expired: true,
      expiredAt: now
    };
    await notification.save();
  }
  
  return expiredNotifications.length;
};

/**
 * Instance methods
 */

// Mark notification as read
Notification.prototype.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
  }
  return this;
};

// Mark notification as clicked/actioned
Notification.prototype.markAsClicked = async function() {
  this.clickedAt = new Date();
  this.isRead = true;
  this.readAt = this.readAt || new Date();
  return await this.save();
};

// Mark notification as dismissed
Notification.prototype.dismiss = async function() {
  this.dismissedAt = new Date();
  return await this.save();
};

// Update delivery status for a channel
Notification.prototype.updateDeliveryStatus = async function(channel, status, metadata = {}) {
  if (!this.deliveryStatus) {
    this.deliveryStatus = {};
  }
  
  this.deliveryStatus = {
    ...this.deliveryStatus,
    [channel]: {
      status,
      updatedAt: new Date(),
      ...metadata
    }
  };
  
  // Update specific timestamp fields if applicable
  switch (channel) {
    case 'email':
      if (status === 'sent' || status === 'delivered') {
        this.emailSentAt = new Date();
        if (metadata.messageId) {
          this.emailId = metadata.messageId;
        }
      }
      break;
    case 'push':
      if (status === 'sent' || status === 'delivered') {
        this.pushSentAt = new Date();
        if (metadata.messageId) {
          this.pushId = metadata.messageId;
        }
      }
      break;
    case 'sms':
      if (status === 'sent' || status === 'delivered') {
        this.smsSentAt = new Date();
        if (metadata.messageId) {
          this.smsId = metadata.messageId;
        }
      }
      break;
  }
  
  return await this.save();
};

// Schedule notification for future delivery
Notification.prototype.schedule = async function(date) {
  if (!(date instanceof Date)) {
    throw new Error('Schedule date must be a valid Date object');
  }
  
  if (date <= new Date()) {
    throw new Error('Schedule date must be in the future');
  }
  
  this.scheduledFor = date;
  return await this.save();
};

// Set expiration date
Notification.prototype.setExpiration = async function(date) {
  if (!(date instanceof Date)) {
    throw new Error('Expiration date must be a valid Date object');
  }
  
  if (date <= new Date()) {
    throw new Error('Expiration date must be in the future');
  }
  
  this.expiresAt = date;
  return await this.save();
};

module.exports = Notification; 