/**
 * Participant Model
 * Represents a user's participation in a conversation
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Participant = sequelize.define('Participant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // User ID
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // Conversation ID
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // Role in the conversation (regular, admin)
    role: {
      type: DataTypes.ENUM('regular', 'admin'),
      defaultValue: 'regular'
    },
    
    // Last read timestamp
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Last delivered timestamp
    lastDeliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Is the conversation muted
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Is the user archived this conversation
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Custom nickname for this user in this conversation
    nickname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Typing status and last typing timestamp
    isTyping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    lastTypingAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Metadata specific to this user in this conversation
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    // Add indexes for improved performance
    indexes: [
      {
        name: 'participant_user_conversation_idx',
        fields: ['userId', 'conversationId'],
        unique: true
      },
      {
        name: 'participant_user_idx',
        fields: ['userId']
      },
      {
        name: 'participant_conversation_idx',
        fields: ['conversationId']
      }
    ]
  });
  
  // Instance method to update last read timestamp
  Participant.prototype.markAsRead = async function() {
    this.lastReadAt = new Date();
    return await this.save();
  };
  
  // Instance method to update typing status
  Participant.prototype.setTyping = async function(isTyping) {
    this.isTyping = isTyping;
    this.lastTypingAt = isTyping ? new Date() : this.lastTypingAt;
    return await this.save();
  };
  
  return Participant;
}; 