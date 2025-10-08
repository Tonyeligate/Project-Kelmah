const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Message Model
 * Stores individual chat messages
 */
const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'attachment', 'system'],
      default: 'text'
    },
    attachment: {
      url: String,
      filename: String,
      contentType: String,
      size: Number
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    bufferCommands: true,
    autoCreate: true
  }
);

// Index for fast retrieval
MessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema); 