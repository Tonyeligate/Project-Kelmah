/**
 * User Settings Model
 * MongoDB-backed persistence for user preferences (theme, language, notifications, privacy).
 * Replaces the in-memory Map that previously lost all settings on service restart.
 */
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    language: {
      type: String,
      enum: ['en', 'tw', 'ga', 'fr'],
      default: 'en',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: null },
        end: { type: String, default: null },
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'contacts'],
        default: 'public',
      },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', SettingsSchema);
