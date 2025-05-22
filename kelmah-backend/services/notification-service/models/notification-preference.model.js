/**
 * Notification Preference Model
 * Stores user preferences for notifications
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, DEFAULT_PREFERENCES } = require('../constants');

/**
 * Notification Preference Schema
 */
const NotificationPreferenceSchema = new Schema({
  // Reference to the user
    user: {
    type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
  
  // Channel preferences (in-app, email, SMS, push)
    channels: {
      type: Map,
      of: Boolean,
      default: () => {
      return DEFAULT_PREFERENCES.channels;
    }
  },
  
  // Type preferences (based on NOTIFICATION_TYPES)
    types: {
      type: Map,
      of: Boolean,
      default: () => {
      return DEFAULT_PREFERENCES.types;
    }
  },
  
  // Quiet hours settings
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00', // 10 PM
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    },
    end: {
      type: String,
      default: '07:00', // 7 AM
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    excludeUrgent: {
      type: Boolean,
      default: false, // If true, urgent notifications will still be sent during quiet hours
    }
  },
  
  // Weekly digest settings
  weeklyDigest: {
      enabled: {
        type: Boolean,
        default: false
      },
    day: {
        type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: 'Monday'
      },
    time: {
        type: String,
      default: '09:00', // 9 AM
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure unique user preferences
NotificationPreferenceSchema.index({ user: 1 }, { unique: true });

/**
 * Methods
 */
NotificationPreferenceSchema.methods = {
  /**
   * Check if a notification type is enabled
   * @param {string} type - Notification type
   * @returns {boolean} Is enabled
   */
  isTypeEnabled(type) {
    if (!this.types) return true;
    return this.types.get(type) !== false;
  },
  
  /**
   * Check if a notification channel is enabled
   * @param {string} channel - Notification channel
   * @returns {boolean} Is enabled
   */
  isChannelEnabled(channel) {
    if (!this.channels) return true;
    return this.channels.get(channel) !== false;
  },
  
  /**
   * Check if notification should be delivered during quiet hours
   * @param {string} priority - Notification priority
   * @returns {boolean} Should deliver
   */
  shouldDeliverDuringQuietHours(priority) {
    if (!this.quietHours || !this.quietHours.enabled) return true;
    if (priority === 'urgent' && this.quietHours.excludeUrgent) return true;
    
    // Otherwise, check if current time is during quiet hours
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.quietHours.timezone,
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    const nowTime = formatter.format(now).replace(':', '').padStart(4, '0');
    const startTime = this.quietHours.start.replace(':', '').padStart(4, '0');
    const endTime = this.quietHours.end.replace(':', '').padStart(4, '0');
    
    // Handle time ranges that cross midnight
    if (startTime > endTime) {
      return !(nowTime >= startTime || nowTime < endTime);
    } else {
      return !(nowTime >= startTime && nowTime < endTime);
    }
  }
};

/**
 * Statics
 */
NotificationPreferenceSchema.statics = {
  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getForUser(userId) {
  let preferences = await this.findOne({ user: userId });
  
  if (!preferences) {
      // Create default preferences
      preferences = await this.create({
        user: userId,
        channels: DEFAULT_PREFERENCES.channels,
        types: DEFAULT_PREFERENCES.types
      });
  }
  
  return preferences;
  }
};

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);