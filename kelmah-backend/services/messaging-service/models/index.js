/**
 * Models Index
 * Initializes and exports all database models with their relationships
 */

const { sequelize } = require('../config/database');
const ConversationModel = require('./conversation.model');
const MessageModel = require('./message.model');
const ParticipantModel = require('./participant.model');

// Initialize models
const Conversation = ConversationModel(sequelize);
const Message = MessageModel(sequelize);
const Participant = ParticipantModel(sequelize);

// Define relationships

// Conversation <-> Message (one-to-many)
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Conversation <-> Participant (one-to-many)
Conversation.hasMany(Participant, { foreignKey: 'conversationId', as: 'participants' });
Participant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Message self-reference for replies
Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

// Additional query helpers and scopes

// Add a scope to get conversations with last message and participants
Conversation.addScope('withDetails', {
  include: [
    {
      model: Message,
      as: 'messages',
      limit: 1,
      order: [['createdAt', 'DESC']],
      separate: true
    },
    {
      model: Participant,
      as: 'participants'
    }
  ]
});

// Add a scope to get messages with sender information
Message.addScope('withSender', (userAttributes = ['id', 'firstName', 'lastName', 'avatar']) => ({
  include: [
    {
      model: sequelize.models.User,
      as: 'sender',
      attributes: userAttributes
    }
  ]
}));

// Export the models
module.exports = {
  sequelize,
  Conversation,
  Message,
  Participant
}; 