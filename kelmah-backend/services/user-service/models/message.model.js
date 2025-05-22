/**
 * Message Model
 * Defines the structure and behavior of messages in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Conversation reference
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Conversations',
      key: 'id'
    }
  },
  // Sender and recipient
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Content
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      customValidator(value) {
        // Either content or attachments must be present
        if (!value && (!this.attachments || this.attachments.length === 0)) {
          throw new Error('Message must have either content or attachments');
        }
      }
    }
  },
  // Attachments (files, images, etc.)
  attachments: {
    type: DataTypes.JSON, // Array of attachment objects with URLs, types, names, sizes
    defaultValue: [],
    validate: {
      isValidAttachments(value) {
        if (value && Array.isArray(value)) {
          // Check if each attachment has required fields
          value.forEach(attachment => {
            if (!attachment.url || !attachment.type || !attachment.name) {
              throw new Error('Each attachment must have url, type, and name');
            }
          });
        }
      }
    }
  },
  // Message type
  type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system', 'location', 'contract', 'payment'),
    defaultValue: 'text',
    allowNull: false
  },
  // Reading status
  readStatus: {
    type: DataTypes.JSON, // Object mapping userId to read timestamp
    defaultValue: {}
  },
  // Metadata for special message types
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for special message types (e.g., job details for contract messages)'
  },
  // Reply info
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    },
    comment: 'If this message is a reply to another message'
  },
  // Delivery status
  status: {
    type: DataTypes.ENUM('sending', 'sent', 'delivered', 'failed'),
    defaultValue: 'sending',
    allowNull: false
  },
  // Edit history
  edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editHistory: {
    type: DataTypes.JSON, // Array of previous versions with timestamp
    defaultValue: []
  },
  // For message forwarding
  forwardedFrom: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    }
  },
  // Message lifespan (for ephemeral messages)
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the message should expire/self-destruct'
  },
  // For tracking events and analytics
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // For security and compliance
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'messages_conversation_id_idx',
      fields: ['conversationId']
    },
    {
      name: 'messages_sender_id_idx',
      fields: ['senderId']
    },
    {
      name: 'messages_created_at_idx',
      fields: ['createdAt']
    },
    {
      name: 'messages_type_idx',
      fields: ['type']
    }
  ]
});

/**
 * Class methods
 */

// Find messages by conversation ID with pagination
Message.findByConversationId = async function(conversationId, limit = 20, offset = 0) {
  return await Message.findAll({
    where: { conversationId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find recent messages for a user (across all conversations)
Message.findRecentForUser = async function(userId, limit = 20) {
  // This would need a join with Conversation model in practice
  // Simplified version for now
  return await Message.findAll({
    where: {
      [sequelize.Op.or]: [
        { senderId: userId }
        // In real implementation, would include messages from conversations the user is part of
      ]
    },
    order: [['createdAt', 'DESC']],
    limit
  });
};

// Search messages by content
Message.searchByContent = async function(conversationId, query, limit = 20) {
  return await Message.findAll({
    where: {
      conversationId,
      content: {
        [sequelize.Op.iLike]: `%${query}%`
      }
    },
    order: [['createdAt', 'DESC']],
    limit
  });
};

// Find unread messages count for a user
Message.countUnreadForUser = async function(userId, conversationId = null) {
  const whereClause = {
    // Messages not sent by this user
    senderId: { [sequelize.Op.ne]: userId },
    // Messages not marked as read by this user
    readStatus: { [sequelize.Op.not]: sequelize.literal(`jsonb_exists(read_status, '${userId}')`) }
  };
  
  // If conversationId provided, restrict to that conversation
  if (conversationId) {
    whereClause.conversationId = conversationId;
  }
  
  return await Message.count({ where: whereClause });
};

/**
 * Instance methods
 */

// Mark message as read by a user
Message.prototype.markAsRead = async function(userId) {
  if (!this.readStatus) {
    this.readStatus = {};
  }
  
  // Only update if not already read
  if (!this.readStatus[userId]) {
    this.readStatus = {
      ...this.readStatus,
      [userId]: new Date()
    };
    return await this.save();
  }
  
  return this;
};

// Edit message content
Message.prototype.editContent = async function(newContent) {
  // Store the current content in edit history
  if (!this.editHistory) {
    this.editHistory = [];
  }
  
  this.editHistory.push({
    content: this.content,
    updatedAt: this.updatedAt,
    timestamp: new Date()
  });
  
  this.content = newContent;
  this.edited = true;
  
  return await this.save();
};

// Add attachment to message
Message.prototype.addAttachment = async function(attachment) {
  if (!this.attachments) {
    this.attachments = [];
  }
  
  this.attachments.push(attachment);
  return await this.save();
};

// Update delivery status
Message.prototype.updateStatus = async function(newStatus) {
  const allowedStatuses = ['sending', 'sent', 'delivered', 'failed'];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid message status');
  }
  
  this.status = newStatus;
  
  if (newStatus === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  return await this.save();
};

// Forward message to another conversation
Message.prototype.forward = async function(targetConversationId, newSenderId) {
  // Create a new message in the target conversation
  return await Message.create({
    conversationId: targetConversationId,
    senderId: newSenderId,
    content: this.content,
    attachments: this.attachments,
    type: this.type,
    metadata: this.metadata,
    forwardedFrom: this.id
  });
};

module.exports = Message; 