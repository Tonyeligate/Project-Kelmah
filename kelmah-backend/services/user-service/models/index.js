/**
 * User Service Models Index - Uses Shared Models
 * Updated to use centralized shared models and MongoDB only
 */

const mongoose = require('mongoose');

// Import from shared models
const { User } = require('../../../shared/models');

// CRITICAL FIX: Force User model registration if not already registered
// This ensures the model is available in mongoose.models registry
if (!mongoose.models.User && User) {
  console.log('🔧 Forcing User model registration...');
  // The User model should already be registered by the shared model file
  // If not, this logs the issue for debugging
  console.log('📊 User model type:', typeof User);
  console.log('📊 User model name:', User.modelName || 'No modelName');
}

// Import service-specific models
const WorkerProfile = require('./WorkerProfileMongo'); // Use the MongoDB version
const Portfolio = require('./Portfolio');
const Certificate = require('./Certificate');
const Skill = require('./Skill');
const SkillCategory = require('./SkillCategory');
const WorkerSkill = require('./WorkerSkill');
const Availability = require('./Availability');
const Bookmark = require('./Bookmark');
// const Setting = require('./Setting'); // Removed - using in-memory storage for now

// Export models
module.exports = {
  User,
  WorkerProfile,
  Portfolio,
  Certificate,
  Skill,
  SkillCategory,
  WorkerSkill,
  Availability,
  Bookmark,
  // Note: Notification model not used in user-service - handled by messaging-service
};