/**
 * Shared Models Index - MongoDB/Mongoose Only
 * Centralized model exports for all services
 */

const User = require('./User');
const Job = require('./Job');
const Message = require('./Message');
const Notification = require('./Notification');
const Conversation = require('./Conversation');
const Application = require('./Application');
const SavedJob = require('./SavedJob');
const RefreshToken = require('./RefreshToken');

// Export all models
module.exports = {
  User,
  Job,
  Message,
  Notification,
  Conversation,
  Application,
  SavedJob,
  RefreshToken
};