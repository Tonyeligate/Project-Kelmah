/**
 * Job Service Models Index
 * Initializes and exports all job-related models and their associations
 */

const db = require('../config/database');
const Job = require('./job.model');
const Application = require('./application.model');
const Review = require('./review.model');
const Contract = require('./contract.model');
const ContractTemplate = require('./contract-template.model');

const initializeModels = async () => {
  try {
    // Initialize database connection
    const sequelize = await db.connect();
    
    // Initialize models with the sequelize instance
    const models = {
      Job: Job(sequelize),
      Application: Application(sequelize),
      Review: Review(sequelize),
      Contract: Contract(sequelize),
      ContractTemplate: ContractTemplate(sequelize)
    };
    
    // Initialize associations between models
    Object.values(models)
      .filter(model => typeof model.associate === 'function')
      .forEach(model => model.associate(models));
    
    return models;
  } catch (error) {
    console.error('Error initializing models:', error);
    throw error;
  }
};

// Lazy-load initialized models to avoid circular dependencies
let initializedModels = null;

/**
 * Get initialized models
 * @returns {Object} Models object
 */
const getModels = async () => {
  if (!initializedModels) {
    initializedModels = await initializeModels();
  }
  return initializedModels;
};

module.exports = {
  getModels,
  db
}; 