/**
 * Models index file
 * Initializes and exports all models for the user service
 */

const db = require('../config/database');
const profileModels = require('./profile.model');
const Skill = require('./skill.model');
const JobApplication = require('./job-application.model');
const SkillAssessment = require('./skill-assessment.model');
const SystemConfig = require('./system-config.model');
const PlatformAnalytics = require('./platform-analytics.model');
const AdminActionLog = require('./admin-action-log.model');
const SavedSearch = require('./saved-search.model');
const FraudAlert = require('./fraud-alert.model');

// Add models to db object
const models = {
  ...profileModels,
  Skill,
  JobApplication: JobApplication(db.getSequelize()),
  SkillAssessment: SkillAssessment(db.getSequelize()),
  SystemConfig,
  PlatformAnalytics,
  AdminActionLog,
  SavedSearch,
  FraudAlert
};

// Set up Skill <-> Profile relationship
const { Profile, ProfileSkill } = profileModels;
Skill.belongsToMany(Profile, { 
  through: ProfileSkill,
  foreignKey: 'skillId'
});
Profile.belongsToMany(Skill, { 
  through: ProfileSkill,
  foreignKey: 'profileId'
});

// Initialize associations
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

// Add associations after all models are loaded
db.setupAssociations = () => {
  // User associations
  db.User.hasOne(db.Profile, { foreignKey: 'userId', as: 'profile' });
  db.Profile.belongsTo(db.User, { foreignKey: 'userId' });
  
  db.User.hasMany(db.Address, { foreignKey: 'userId', as: 'addresses' });
  db.Address.belongsTo(db.User, { foreignKey: 'userId' });
  
  // Review associations
  db.User.hasMany(db.Review, { foreignKey: 'reviewerId', as: 'givenReviews' });
  db.User.hasMany(db.Review, { foreignKey: 'recipientId', as: 'receivedReviews' });
  db.User.hasMany(db.Review, { foreignKey: 'adminReviewedBy', as: 'moderatedReviews' });
  
  db.Review.belongsTo(db.User, { foreignKey: 'reviewerId', as: 'reviewer' });
  db.Review.belongsTo(db.User, { foreignKey: 'recipientId', as: 'recipient' });
  db.Review.belongsTo(db.User, { foreignKey: 'adminReviewedBy', as: 'adminReviewer' });
  
  // Notification associations
  db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
  db.Notification.belongsTo(db.User, { foreignKey: 'userId' });
  
  // Admin associations
  db.AdminActionLog.belongsTo(db.User, { foreignKey: 'adminId', as: 'admin' });
  db.User.hasMany(db.AdminActionLog, { foreignKey: 'adminId', as: 'adminActions' });
  
  // System Config associations
  db.SystemConfig.belongsTo(db.User, { foreignKey: 'updatedBy', as: 'lastUpdatedBy' });
  db.User.hasMany(db.SystemConfig, { foreignKey: 'updatedBy', as: 'updatedConfigs' });
  
  // Saved Search associations
  db.SavedSearch.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
  db.User.hasMany(db.SavedSearch, { foreignKey: 'userId', as: 'savedSearches' });
  
  // Fraud Alert associations
  db.FraudAlert.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
  db.User.hasMany(db.FraudAlert, { foreignKey: 'userId', as: 'fraudAlerts' });
  db.FraudAlert.belongsTo(db.User, { foreignKey: 'resolvedBy', as: 'resolver' });
  db.User.hasMany(db.FraudAlert, { foreignKey: 'resolvedBy', as: 'resolvedAlerts' });
};

// Export all models
module.exports = models; 