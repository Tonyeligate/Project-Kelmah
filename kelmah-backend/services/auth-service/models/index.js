/**
 * Auth Service Models Index
 * Exports all models and defines associations
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../../src/config/db').sequelize;

// Import models
const RefreshToken = require('./RefreshToken')(sequelize);

// Import User model from user-service
// In a real microservice architecture, this would be handled differently
// For now, we're sharing models between services for simplicity
const User = require('../../../services/user-service/models/User')(sequelize);

// Define associations
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// Define model associate methods
if (RefreshToken.associate) RefreshToken.associate();

module.exports = {
  RefreshToken,
  // Export User for convenience in auth service
  User
};