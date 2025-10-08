const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Notification Model
 * Stores notifications for users
 */
const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['message', 'job', 'application', 'contract', 'review', 'payment', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    // bufferCommands controlled globally by mongoose.set() in server startup
    autoCreate: true
  }
);

// Index for fast lookups
NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema); 
