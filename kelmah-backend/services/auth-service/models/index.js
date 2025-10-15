/**
 * Auth Service Models Index
 * Uses shared User model, local auth-specific models
 */

// Import User from shared (cross-service model)
const { User } = require('../../../shared/models');

// Import LOCAL auth-specific models
const RefreshToken = require('./RefreshToken');  // ✅ Local (only auth-service)
const RevokedToken = require('./RevokedToken');  // ✅ Local (only auth-service)

// Export models
module.exports = {
  User,          // ✅ Shared (used by all services)
  RefreshToken,  // ✅ Local (only auth-service)
  RevokedToken   // ✅ Local (only auth-service)
};