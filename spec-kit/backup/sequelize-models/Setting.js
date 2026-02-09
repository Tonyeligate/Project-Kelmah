const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Setting Model
 * Stores user-specific settings and preferences
 */
const SettingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      realtime: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    locale: {
      type: String,
      default: 'en'
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
      },
      searchVisibility: {
        type: Boolean,
        default: true
      },
      dataSharing: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for fast lookup by user
SettingSchema.index({ user: 1 });

module.exports = mongoose.model('Setting', SettingSchema); 