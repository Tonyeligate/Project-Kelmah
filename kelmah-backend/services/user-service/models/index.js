/**
 * User Service Models Index - Uses Shared Models
 * Updated to use centralized shared models and MongoDB only
 */

// Import from shared models
const { User } = require('../../../shared/models');

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
  // Note: Notification model not used in user-service - handled by messaging-service
};