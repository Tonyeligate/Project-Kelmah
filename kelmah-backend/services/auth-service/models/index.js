/**
 * Auth Service Models Index
 * Uses shared User model, local auth-specific models
 */

// Import shared cross-service models
const { User, WorkerProfile } = require('../../../shared/models');

// Import LOCAL auth-specific models
const RefreshToken = require('./RefreshToken');  // ✅ Local (only auth-service)
const RevokedToken = require('./RevokedToken');  // ✅ Local (only auth-service)

// Export models
module.exports = {
  User,          // ✅ Shared (used by all services)
  WorkerProfile, // ✅ Shared worker canonical profile
  RefreshToken,  // ✅ Local (only auth-service)
  RevokedToken   // ✅ Local (only auth-service)
};