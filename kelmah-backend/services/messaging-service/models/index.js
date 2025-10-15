/**
 * Messaging Service Models Index
 * All models are LOCAL to messaging-service (best practice for microservices)
 * Only imports User from shared (used across multiple services)
 */

// Import User from shared (truly cross-service model)
const { User } = require('../../../shared/models');

// Import LOCAL service-specific models
const Conversation = require('./Conversation');
const Message = require('./Message');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');

// Export models
module.exports = {
  User,          // ✅ Shared (used by all services)
  Conversation,  // ✅ Local (only messaging-service)
  Message,       // ✅ Local (only messaging-service)
  Notification,  // ✅ Local (only messaging-service)
  NotificationPreference  // ✅ Local (only messaging-service)
};