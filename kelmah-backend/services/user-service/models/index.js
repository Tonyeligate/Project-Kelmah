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
  // CRITICAL FIX: Use the shared model but ensure it's on THIS connection
  let User;
  
  if (mongoose.connection.models.User) {
    console.log('✅ User model already exists on this connection');
    User = mongoose.connection.models.User;
  } else {
    console.log('🔧 Creating User model on THIS connection...');
    // Import the User model from shared (it has the schema)
    const { User: SharedUserModel } = require('../../../shared/models');
    
    if (SharedUserModel && SharedUserModel.schema) {
      // Create a NEW model on THIS connection using the shared schema
      User = mongoose.connection.model('User', SharedUserModel.schema);
      console.log('✅ User model created on THIS connection using shared schema');
    } else {
      console.error('❌ Could not get User schema from shared model');
      console.error('SharedUserModel:', SharedUserModel);
      console.error('Has schema?:', !!SharedUserModel?.schema);
      // Last resort - use the shared model as-is
      User = SharedUserModel;
    }
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