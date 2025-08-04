/**
 * Auth Service Models Index - MongoDB/Mongoose
 * Exports all Mongoose models for the auth service
 * Updated for MongoDB migration
 */

// Import Mongoose models
const User = require('./User');
const RefreshToken = require('./RefreshToken');

// Export models
module.exports = {
  User,
  RefreshToken
};

// Note: Mongoose handles relationships differently than Sequelize
// The RefreshToken model already references User via ObjectId and populate()
// No additional association setup is needed like in Sequelize