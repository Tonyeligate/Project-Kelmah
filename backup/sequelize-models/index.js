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

// Import new models
const Subscription = require('../../models/subscription')(sequelize, DataTypes);
const Plan = require('../../models/plan')(sequelize, DataTypes);
const Transaction = require('../../models/transaction')(sequelize, DataTypes);
const Dispute = require('../../models/dispute')(sequelize, DataTypes);
const Escrow = require('../../models/escrow')(sequelize, DataTypes);
const Wallet = require('../../models/wallet')(sequelize, DataTypes);
const Review = require('../../models/review')(sequelize, DataTypes);

// Set up associations
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// Define associations between models
const models = { User, Job, RefreshToken, Message, Notification, Setting, Role,
  Subscription, Plan, Transaction, Dispute, Escrow, Wallet, Review };

if (User.associate) User.associate(models);
if (RefreshToken.associate) RefreshToken.associate(models);
if (Job.associate) Job.associate(models);
if (Message.associate) Message.associate(models);
if (Notification.associate) Notification.associate(models);
if (Setting.associate) Setting.associate(models);
if (Role.associate) Role.associate(models);
if (Subscription.associate) Subscription.associate(models);
if (Plan.associate) Plan.associate(models);
if (Transaction.associate) Transaction.associate(models);
if (Dispute.associate) Dispute.associate(models);
if (Escrow.associate) Escrow.associate(models);
if (Wallet.associate) Wallet.associate(models);
if (Review.associate) Review.associate(models);

module.exports = models; 