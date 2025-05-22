/**
 * Conversation Model
 * Represents a conversation between users
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Conversation type: 'direct' (one-to-one) or 'group'
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct'
    },
    
    // Title (optional for direct conversations)
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // For direct conversations, identifies the two participants
    // For group conversations, identifies the creator
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // Avatar (optional)
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Last message in the conversation (for sorting/preview)
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Metadata for the conversation
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Is the conversation archived
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Additional properties for group conversations
    // Is the conversation a group
    isGroup: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.type === 'group';
      }
    }
  }, {
    // Add indexes for improved performance
    indexes: [
      {
        name: 'conversation_last_message_idx',
        fields: ['lastMessageAt']
      },
      {
        name: 'conversation_created_by_idx',
        fields: ['createdBy']
      },
      {
        name: 'conversation_type_idx',
        fields: ['type']
      }
    ]
  });
  
  return Conversation;
}; 