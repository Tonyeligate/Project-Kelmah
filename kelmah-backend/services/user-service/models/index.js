const mongoose = require('mongoose');

// Create empty object that will be populated after connection
const models = {};

// Function to initialize models after connection is ready
function loadModels() {
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
  const WorkerProfile = require('./WorkerProfileMongo');
  const Portfolio = require('./Portfolio');
  const Certificate = require('./Certificate');
  const Skill = require('./Skill');
  const SkillCategory = require('./SkillCategory');
  const WorkerSkill = require('./WorkerSkill');
  const Availability = require('./Availability');
  const Bookmark = require('./Bookmark');

  // Populate the models object
  models.User = User;
  models.WorkerProfile = WorkerProfile;
  models.Portfolio = Portfolio;
  models.Certificate = Certificate;
  models.Skill = Skill;
  models.SkillCategory = SkillCategory;
  models.WorkerSkill = WorkerSkill;
  models.Availability = Availability;
  models.Bookmark = Bookmark;

  return models;
}

// Export the models object AND the load function
module.exports = models;
module.exports.loadModels = loadModels;