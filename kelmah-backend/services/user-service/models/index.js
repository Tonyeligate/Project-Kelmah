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
  // CRITICAL FIX: Create User model directly on THIS connection, not from shared models
  // Shared models use their own mongoose instance which isn't the connected one
  let User;
  
  if (mongoose.connection.models.User) {
    console.log('✅ User model already exists on this connection');
    User = mongoose.connection.models.User;
  } else {
    console.log('🔧 Creating User model directly on THIS mongoose connection...');
    // Import the schema definition (not the model!)
    const userSchemaModule = require('../../../shared/models/User');
    
    // Get the schema from the imported model
    const UserSchema = userSchemaModule.schema;
    
    if (UserSchema) {
      // Create model on THIS connection
      User = mongoose.connection.model('User', UserSchema);
      console.log('✅ User model created on THIS connection with imported schema');
    } else {
      console.error('❌ Could not get User schema from shared model');
      // Fallback to imported model (will probably still fail)
      const { User: ImportedUser } = require('../../../shared/models');
      User = ImportedUser;
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