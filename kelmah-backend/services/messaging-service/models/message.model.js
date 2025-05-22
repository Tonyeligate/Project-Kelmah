/**
 * Message Model
 * Represents a message in a conversation
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Message content
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    
    // Conversation ID that the message belongs to
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // Sender user ID
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // Is the message encrypted
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // When message was read by recipients
    readAt: {
      type: DataTypes.JSONB, // Map of userId -> timestamp
      defaultValue: {}
    },
    
    // Message type (text, image, file, etc.)
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'location', 'system'),
      defaultValue: 'text'
    },
    
    // Message status (sent, delivered, read)
    status: {
      type: DataTypes.ENUM('sending', 'sent', 'delivered', 'read', 'failed'),
      defaultValue: 'sent'
    },
    
    // Attachments
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    
    // Message metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Has been edited
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Message is deleted (soft delete handled by Sequelize paranoid option)
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Reply to another message
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    
    // Forward count
    forwardCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    paranoid: true,
    
    // Add indexes for improved performance
    indexes: [
      {
        name: 'message_conversation_idx',
        fields: ['conversationId']
      },
      {
        name: 'message_sender_idx',
        fields: ['senderId']
      },
      {
        name: 'message_created_at_idx',
        fields: ['createdAt']
      },
      {
        name: 'message_reply_to_idx',
        fields: ['replyToId']
      }
    ],
    
    // Custom methods
    hooks: {
      beforeCreate: (message) => {
        // Sanitize content (implement your own sanitization logic)
        // message.content = sanitize(message.content);
      },
      afterCreate: async (message, options) => {
        // Update the last message timestamp in the conversation
        if (options.transaction) {
          const Conversation = sequelize.models.Conversation;
          await Conversation.update({
            lastMessageAt: message.createdAt
          }, {
            where: { id: message.conversationId },
            transaction: options.transaction
          });
        }
      }
    }
  });
  
  // Instance method to mark message as read by a user
  Message.prototype.markAsRead = async function(userId) {
    const readAt = this.getDataValue('readAt') || {};
    readAt[userId] = new Date().toISOString();
    this.setDataValue('readAt', readAt);
    this.setDataValue('status', 'read');
    return await this.save();
  };
  
  // Class method to find unread messages for a user
  Message.findUnreadForUser = async function(userId, conversationId = null) {
    const where = {
      senderId: { [sequelize.Sequelize.Op.ne]: userId },
      [sequelize.Sequelize.Op.or]: [
        { readAt: null },
        { readAt: { [sequelize.Sequelize.Op.not]: sequelize.Sequelize.fn('JSON_EXISTS', sequelize.col('readAt'), `$."${userId}"`) } }
      ]
    };
    
    if (conversationId) {
      where.conversationId = conversationId;
    }
    
    return await this.findAll({ where });
  };
  
  return Message;
}; 