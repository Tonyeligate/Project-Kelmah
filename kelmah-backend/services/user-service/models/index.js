const mongoose = require('mongoose');

// Store actual models here after loading
let _User, _WorkerProfile, _Portfolio, _Certificate, _Skill, _SkillCategory, _WorkerSkill, _Availability, _Bookmark;

// Function to initialize models after connection is ready
function loadModels() {
  // CRITICAL FIX: Use the shared model but ensure it's on THIS connection
  if (mongoose.connection.models.User) {
    console.log('✅ User model already exists on this connection');
    _User = mongoose.connection.models.User;
  } else {
    console.log('🔧 Creating User model on THIS connection...');
    // Import the User model from shared (it has the schema)
    const { User: SharedUserModel } = require('../../../shared/models');
    
    if (SharedUserModel && SharedUserModel.schema) {
      // Create a NEW model on THIS connection using the shared schema
      _User = mongoose.connection.model('User', SharedUserModel.schema);
      console.log('✅ User model created on THIS connection using shared schema');
    } else {
      console.error('❌ Could not get User schema from shared model');
      _User = SharedUserModel;
    }
  }

  // Import service-specific models
  _WorkerProfile = require('./WorkerProfileMongo');
  _Portfolio = require('./Portfolio');
  _Certificate = require('./Certificate');
  _Skill = require('./Skill');
  _SkillCategory = require('./SkillCategory');
  _WorkerSkill = require('./WorkerSkill');
  _Availability = require('./Availability');
  _Bookmark = require('./Bookmark');

  console.log('✅ All models loaded and ready');
}

// Export object with GETTERS that return the actual models
// This allows controllers to import at module load time
// but they'll get the actual models only when accessed
module.exports = {
  get User() { return _User; },
  get WorkerProfile() { return _WorkerProfile; },
  get Portfolio() { return _Portfolio; },
  get Certificate() { return _Certificate; },
  get Skill() { return _Skill; },
  get SkillCategory() { return _SkillCategory; },
  get WorkerSkill() { return _WorkerSkill; },
  get Availability() { return _Availability; },
  get Bookmark() { return _Bookmark; },
  loadModels
};