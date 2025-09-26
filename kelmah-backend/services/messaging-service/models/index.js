/**
 * Messaging Service Models Index - Uses Shared Models with Local Extensions
 * Updated to use centralized shared models with local extended versions where needed
 */

// Import from shared models
const { Conversation, User } = require('../../../shared/models');

// Import service-specific models (extended versions)
const Message = require('./Message'); // Extended version with recipient, attachments, etc.
const Notification = require('./Notification'); // Extended version with readStatus, priority, etc.
const NotificationPreference = require('./NotificationPreference');

// Export models
module.exports = {
  // Shared models
  Conversation,
  Message,
  User,

  // Extended local models
  Notification,
  NotificationPreference
};