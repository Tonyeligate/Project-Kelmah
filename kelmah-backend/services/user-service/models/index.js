/**
 * User Service Models Index - Uses Shared Models
 * Updated to use centralized shared models and MongoDB only
 * 
 * CRITICAL: This file exports a function that loads models on-demand
 * Models must NOT be imported at module load time to avoid schema initialization before connection
 */

const mongoose = require('mongoose');

// Export a function that loads and returns models
// This function should be called AFTER MongoDB connection is established
module.exports = function loadModels() {
  // Import from shared models - This returns the model but may not register it
  const { User: ImportedUser } = require('../../../shared/models');

  // CRITICAL FIX: Ensure User model is in mongoose.models registry
  // The import works but the model isn't being registered properly
  let User;
  if (mongoose.models.User) {
    console.log('✅ User model already in registry');
    User = mongoose.models.User;
  } else if (ImportedUser && ImportedUser.modelName === 'User') {
    console.log('🔧 Manually registering User model in mongoose.models...');
    // The model exists but isn't in the registry - force registration
    mongoose.models.User = ImportedUser;
    mongoose.connection.models.User = ImportedUser;
    User = ImportedUser;
    console.log('✅ User model manually registered');
  } else {
    console.error('❌ CRITICAL: Cannot find or register User model!');
    console.error('   ImportedUser:', ImportedUser);
    console.error('   modelName:', ImportedUser?.modelName);
    User = ImportedUser; // Use it anyway and hope for the best
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

  // Return models object
  return {
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
};