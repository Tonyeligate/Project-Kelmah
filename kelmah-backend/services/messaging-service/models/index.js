/**
 * Models Index
 * Exports all Mongoose models for the messaging service
 */

const Conversation = require('./Conversation');
const Message = require('./Message');
const Notification = require('./Notification');
const User = require('./User');

module.exports = {
  Conversation,
  Message,
  Notification,
  User
};