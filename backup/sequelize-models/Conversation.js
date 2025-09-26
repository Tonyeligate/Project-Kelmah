const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Conversation Model
 * Stores chat conversations between users
 */
const ConversationSchema = new Schema(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Ensure participant arrays of fixed size for two-person chat
ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema); 