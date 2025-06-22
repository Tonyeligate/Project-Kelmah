/**
 * Models Index
 * Exports all models and defines associations
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const User = require('./User')(sequelize);
const Job = require('./Job');
const Message = require('./Message');
const Notification = require('./Notification');
const Setting = require('./Setting');
const Role = require('./Role');
const RefreshToken = require('./auth/RefreshToken')(sequelize);

// Set up associations
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// Define associations between models
if (User.associate) User.associate();
if (RefreshToken.associate) RefreshToken.associate({ User });
if (Job.associate) Job.associate();
if (Message.associate) Message.associate();
if (Notification.associate) Notification.associate();
if (Setting.associate) Setting.associate();
if (Role.associate) Role.associate({ User });

module.exports = {
  User,
  Job,
  RefreshToken,
  Message,
  Notification,
  Setting,
  Role
}; 