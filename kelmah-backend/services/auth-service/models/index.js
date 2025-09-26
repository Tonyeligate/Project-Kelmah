/**
 * Auth Service Models Index - Uses Shared Models
 * Updated to use centralized shared models instead of local duplicates
 */

// Import from shared models
const { User, RefreshToken } = require('../../../shared/models');
const RevokedToken = require('./RevokedToken');

// Export models
module.exports = {
  User,
  RefreshToken,
  RevokedToken
};

// Note: User and RefreshToken now come from shared models directory
// Only service-specific models like RevokedToken remain local
// No additional association setup is needed like in Sequelize