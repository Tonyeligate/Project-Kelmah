/**
 * Models Index - User Service
 * Exports all models with support for mixed MongoDB/PostgreSQL architecture
 */

const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize database connections
let sequelize;

// Initialize Sequelize connection if configured
if (process.env.DATABASE_URL || process.env.USER_SQL_URL) {
  const dbUrl = process.env.USER_SQL_URL || process.env.DATABASE_URL;
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// MongoDB/Mongoose Models
const User = require('./User');
const Bookmark = require('./Bookmark');
const Certificate = require('./Certificate');
const Notification = require('./Notification');
const Portfolio = require('./Portfolio');
const Setting = require('./Setting');
const WorkerProfileMongo = require('./WorkerProfileMongo');

// PostgreSQL/Sequelize Models (if database is configured)
let WorkerProfile, WorkerSkill, Skill, SkillCategory;

if (sequelize) {
  try {
    WorkerProfile = require('./WorkerProfile')(sequelize, DataTypes);
    WorkerSkill = require('./WorkerSkill')(sequelize, DataTypes);
    Skill = require('./Skill')(sequelize, DataTypes);
    SkillCategory = require('./SkillCategory')(sequelize, DataTypes);

    // Set up associations
    const models = { WorkerProfile, WorkerSkill, Skill, SkillCategory, User };

    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    // Sync database (in development only)
    if (process.env.NODE_ENV === 'development') {
      sequelize.sync({ alter: false }).catch(err => {
        console.warn('Sequelize sync failed (non-critical):', err.message);
      });
    }
  } catch (error) {
    console.warn('Sequelize models initialization failed (non-critical):', error.message);
    // Provide fallback empty models
    WorkerProfile = null;
    WorkerSkill = null;
    Skill = null;
    SkillCategory = null;
  }
} else {
  console.log('PostgreSQL not configured, using MongoDB-only models');
  WorkerProfile = null;
  WorkerSkill = null;
  Skill = null;
  SkillCategory = null;
}

module.exports = {
  // MongoDB/Mongoose Models
  User,
  Bookmark,
  Certificate,
  Notification,
  Portfolio,
  Setting,
  WorkerProfileMongo,

  // Use MongoDB WorkerProfile as primary (for dashboard compatibility)
  WorkerProfile: WorkerProfileMongo,

  // PostgreSQL/Sequelize Models (may be null if not configured)
  WorkerProfileSQL: WorkerProfile,
  WorkerSkill,
  Skill,
  SkillCategory,

  // Database connections
  sequelize,
  mongoose
};
