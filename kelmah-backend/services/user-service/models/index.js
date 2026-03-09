/**
 * User Service Models Index
 * Uses shared models for cross-service entities, local models for service-specific
 */

const mongoose = require('mongoose');

// Import shared models - they use mongoose.model() which auto-binds correctly
const { User, Job, Application } = require('../../../shared/models');

// Import service-specific models
const WorkerProfile = require('./WorkerProfileMongo');
const Certificate = require('./Certificate');
const Availability = require('./Availability');
const Bookmark = require('./Bookmark');
const Portfolio = require('./Portfolio');
const Settings = require('./Settings');

// Skill models are deprecated - skills are now embedded in User/WorkerProfile
const Skill = null;
const SkillCategory = null;
const WorkerSkill = null;

// Legacy loadModels function for backwards compatibility
function loadModels() {
  console.log('✅ All models ready (models use mongoose.model() auto-binding)');
}

// Export models
module.exports = {
  User,
  Job,
  Application,
  WorkerProfile,
  Portfolio,
  Certificate,
  Skill,
  SkillCategory,
  WorkerSkill,
  Availability,
  Bookmark,
  Settings,
  loadModels
};