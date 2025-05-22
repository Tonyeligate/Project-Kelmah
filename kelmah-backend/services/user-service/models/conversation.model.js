/**
 * Conversation Model
 * Defines the structure and behavior of conversations in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Conversation metadata
  title: {
    type: DataTypes.STRING,
    allowNull: true, // May be null for direct messages
    comment: 'Optional title for group conversations'
  },
  type: {
    type: DataTypes.ENUM('direct', 'group', 'job', 'support'),
    defaultValue: 'direct',
    allowNull: false,
    comment: 'Type of conversation: direct (1-1), group, job-related, or support'
  },
  // Related records
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Jobs',
      key: 'id'
    },
    comment: 'If conversation is related to a specific job'
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Contracts',
      key: 'id'
    },
    comment: 'If conversation is related to a specific contract'
  },
  // Group conversation details
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to group conversation avatar image'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Participants data
  participants: {
    type: DataTypes.JSON, // Array of user IDs who are part of this conversation
    allowNull: false,
    validate: {
      isValid(value) {
        if (!Array.isArray(value) || value.length < 1) {
          throw new Error('Conversation must have at least one participant');
        }
      }
    }
  },
  // Status and activity tracking
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastMessagePreview: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Preview of the last message content (truncated)'
  },
  lastMessageSenderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Privacy and security
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the conversation uses end-to-end encryption'
  },
  encryptionMetadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadata for encryption (if applicable)'
  },
  // Access control
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'If true, conversation is only visible to participants'
  },
  // For group chats
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who created the conversation (especially for group chats)'
  },
  adminUserIds: {
    type: DataTypes.JSON, // Array of user IDs who are admins in this conversation
    defaultValue: [],
    comment: 'For group chats, which users have admin privileges'
  },
  // Message controls
  readOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'If true, only admins can send messages'
  },
  // Muting and notifications
  mutedByUserIds: {
    type: DataTypes.JSON, // Array of user IDs who have muted this conversation
    defaultValue: [],
    comment: 'Users who have muted notifications for this conversation'
  },
  // Archiving
  archivedByUserIds: {
    type: DataTypes.JSON, // Array of user IDs who have archived this conversation
    defaultValue: [],
    comment: 'Users who have archived this conversation'
  },
  // Message expiration
  messageExpirationTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'If set, messages in this conversation will expire after this many seconds'
  },
  // Metadata for conversation
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Any additional metadata for the conversation'
  }
}, {
  tableName: 'conversations',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'conversations_participants_idx',
      fields: ['participants'],
      using: 'gin'
    },
    {
      name: 'conversations_last_message_at_idx',
      fields: ['lastMessageAt']
    },
    {
      name: 'conversations_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'conversations_contract_id_idx',
      fields: ['contractId']
    },
    {
      name: 'conversations_type_idx',
      fields: ['type']
    }
  ]
});

/**
 * Class methods
 */

// Find conversations for a user
Conversation.findForUser = async function(userId, limit = 20, offset = 0) {
  return await Conversation.findAll({
    where: {
      participants: { [sequelize.Op.contains]: [userId] },
      archivedByUserIds: { [sequelize.Op.not]: sequelize.literal(`jsonb_exists(archived_by_user_ids, '${userId}')`) }
    },
    order: [['lastMessageAt', 'DESC']],
    limit,
    offset
  });
};

// Find or create direct message conversation between two users
Conversation.findOrCreateDirectMessage = async function(userId1, userId2) {
  // Find existing direct conversation between these users
  const existingConversation = await Conversation.findOne({
    where: {
      type: 'direct',
      participants: { [sequelize.Op.contains]: [userId1, userId2] },
      [sequelize.Op.and]: [
        sequelize.literal(`jsonb_array_length(participants) = 2`)
      ]
    }
  });
  
  if (existingConversation) {
    return { conversation: existingConversation, created: false };
  }
  
  // Create new conversation
  const newConversation = await Conversation.create({
    type: 'direct',
    participants: [userId1, userId2],
    createdBy: userId1
  });
  
  return { conversation: newConversation, created: true };
};

// Find or create job conversation
Conversation.findOrCreateJobConversation = async function(jobId, hirerUserId, workerUserId) {
  // Find existing job conversation
  const existingConversation = await Conversation.findOne({
    where: {
      type: 'job',
      jobId
    }
  });
  
  if (existingConversation) {
    return { conversation: existingConversation, created: false };
  }
  
  // Create new conversation
  const newConversation = await Conversation.create({
    type: 'job',
    jobId,
    participants: [hirerUserId, workerUserId],
    createdBy: hirerUserId
  });
  
  return { conversation: newConversation, created: true };
};

// Create group conversation
Conversation.createGroupConversation = async function(title, creatorUserId, participantIds, options = {}) {
  // Ensure creator is included in participants
  if (!participantIds.includes(creatorUserId)) {
    participantIds.push(creatorUserId);
  }
  
  // Create new group conversation
  const newConversation = await Conversation.create({
    type: 'group',
    title,
    participants: participantIds,
    createdBy: creatorUserId,
    adminUserIds: [creatorUserId],
    isPrivate: options.isPrivate !== undefined ? options.isPrivate : true,
    avatar: options.avatar || null,
    description: options.description || null,
    messageExpirationTime: options.messageExpirationTime || null
  });
  
  return newConversation;
};

// Find archived conversations for a user
Conversation.findArchivedForUser = async function(userId, limit = 20, offset = 0) {
  return await Conversation.findAll({
    where: {
      participants: { [sequelize.Op.contains]: [userId] },
      archivedByUserIds: { [sequelize.Op.contains]: [userId] }
    },
    order: [['lastMessageAt', 'DESC']],
    limit,
    offset
  });
};

/**
 * Instance methods
 */

// Add participant to conversation
Conversation.prototype.addParticipant = async function(userId, addedBy) {
  // Only allow adding to group conversations
  if (this.type === 'direct') {
    throw new Error('Cannot add participants to direct conversations');
  }
  
  // Check if user is already a participant
  if (this.participants.includes(userId)) {
    return this;
  }
  
  this.participants = [...this.participants, userId];
  
  // Record this action in metadata
  if (!this.metadata) this.metadata = {};
  if (!this.metadata.participantHistory) this.metadata.participantHistory = [];
  
  this.metadata.participantHistory.push({
    action: 'added',
    userId,
    addedBy,
    timestamp: new Date()
  });
  
  return await this.save();
};

// Remove participant from conversation
Conversation.prototype.removeParticipant = async function(userId, removedBy) {
  // Only allow removing from group conversations
  if (this.type === 'direct') {
    throw new Error('Cannot remove participants from direct conversations');
  }
  
  // Check if user is a participant
  if (!this.participants.includes(userId)) {
    return this;
  }
  
  this.participants = this.participants.filter(id => id !== userId);
  
  // If user was an admin, remove from admins
  if (this.adminUserIds.includes(userId)) {
    this.adminUserIds = this.adminUserIds.filter(id => id !== userId);
  }
  
  // Record this action in metadata
  if (!this.metadata) this.metadata = {};
  if (!this.metadata.participantHistory) this.metadata.participantHistory = [];
  
  this.metadata.participantHistory.push({
    action: 'removed',
    userId,
    removedBy,
    timestamp: new Date()
  });
  
  return await this.save();
};

// Update conversation last message data
Conversation.prototype.updateLastMessage = async function(message) {
  this.lastMessageAt = message.createdAt;
  this.lastMessageSenderId = message.senderId;
  
  // Create a preview of the message content
  if (message.content) {
    this.lastMessagePreview = message.content.length > 100 
      ? `${message.content.substring(0, 97)}...` 
      : message.content;
  } else if (message.attachments && message.attachments.length > 0) {
    this.lastMessagePreview = `[${message.type}] ${message.attachments[0].name}`;
  } else {
    this.lastMessagePreview = `[${message.type}]`;
  }
  
  return await this.save();
};

// Archive conversation for a user
Conversation.prototype.archiveForUser = async function(userId) {
  if (!this.participants.includes(userId)) {
    throw new Error('User is not a participant in this conversation');
  }
  
  if (!this.archivedByUserIds.includes(userId)) {
    this.archivedByUserIds = [...this.archivedByUserIds, userId];
    return await this.save();
  }
  
  return this;
};

// Unarchive conversation for a user
Conversation.prototype.unarchiveForUser = async function(userId) {
  if (!this.participants.includes(userId)) {
    throw new Error('User is not a participant in this conversation');
  }
  
  if (this.archivedByUserIds.includes(userId)) {
    this.archivedByUserIds = this.archivedByUserIds.filter(id => id !== userId);
    return await this.save();
  }
  
  return this;
};

// Mute conversation for a user
Conversation.prototype.muteForUser = async function(userId) {
  if (!this.participants.includes(userId)) {
    throw new Error('User is not a participant in this conversation');
  }
  
  if (!this.mutedByUserIds.includes(userId)) {
    this.mutedByUserIds = [...this.mutedByUserIds, userId];
    return await this.save();
  }
  
  return this;
};

// Unmute conversation for a user
Conversation.prototype.unmuteForUser = async function(userId) {
  if (!this.participants.includes(userId)) {
    throw new Error('User is not a participant in this conversation');
  }
  
  if (this.mutedByUserIds.includes(userId)) {
    this.mutedByUserIds = this.mutedByUserIds.filter(id => id !== userId);
    return await this.save();
  }
  
  return this;
};

// Add user as admin
Conversation.prototype.addAdmin = async function(userId, addedBy) {
  if (this.type !== 'group') {
    throw new Error('Only group conversations can have admins');
  }
  
  if (!this.participants.includes(userId)) {
    throw new Error('User must be a participant to become an admin');
  }
  
  if (!this.adminUserIds.includes(userId)) {
    this.adminUserIds = [...this.adminUserIds, userId];
    
    // Record this action in metadata
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.adminHistory) this.metadata.adminHistory = [];
    
    this.metadata.adminHistory.push({
      action: 'added',
      userId,
      addedBy,
      timestamp: new Date()
    });
    
    return await this.save();
  }
  
  return this;
};

// Remove user as admin
Conversation.prototype.removeAdmin = async function(userId, removedBy) {
  if (this.type !== 'group') {
    throw new Error('Only group conversations can have admins');
  }
  
  if (this.adminUserIds.includes(userId)) {
    // Prevent removing the last admin
    if (this.adminUserIds.length <= 1) {
      throw new Error('Cannot remove the last admin from a group conversation');
    }
    
    this.adminUserIds = this.adminUserIds.filter(id => id !== userId);
    
    // Record this action in metadata
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.adminHistory) this.metadata.adminHistory = [];
    
    this.metadata.adminHistory.push({
      action: 'removed',
      userId,
      removedBy,
      timestamp: new Date()
    });
    
    return await this.save();
  }
  
  return this;
};

module.exports = Conversation; 