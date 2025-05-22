const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    action: {
      url: String,
      text: String
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add TTL index for auto-deletion of old notifications (if expiresAt is set)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create a compound index for querying by recipient and read status for better performance
notificationSchema.index({ recipient: 1, read: 1 });

// Add a virtual for the time since creation (for frontend display)
notificationSchema.virtual('timeAgo').get(function () {
  return new Date() - this.createdAt;
});

// Add a method to mark a notification as read
notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  return await this.save();
};

// Add a static method to mark all of a user's notifications as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
};

// Add a static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ recipient: userId, read: false });
};

// Add a static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function (userId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return await this.deleteMany({
    recipient: userId,
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema); 