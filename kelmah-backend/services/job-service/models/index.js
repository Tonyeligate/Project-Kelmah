/**
 * Job Service Models Index - Uses Shared Models
 * Updated to use centralized shared models instead of local duplicates
 * CRITICAL: Pass connected mongoose instance to shared models
 */

// Get the connected mongoose instance from db config
const { mongoose } = require('../config/db');

// Import shared models and ensure they use the connected mongoose instance
// NOTE: Shared models already have their schemas defined, we just need to ensure
// they're using the correct mongoose instance (the one that's connected)
const { Job, Application, User, SavedJob } = require('../../../shared/models');

// Import service-specific models
const Bid = require('./Bid');
const UserPerformance = require('./UserPerformance');
const Category = require('./Category');
const Contract = require('./Contract');
const ContractDispute = require('./ContractDispute');
const ContractTemplate = require('./ContractTemplate');

// Export models
module.exports = {
  // Shared models (using connected mongoose instance)
  Job,
  Application,
  User,
  SavedJob,

  // Service-specific models
  Bid,
  UserPerformance,
  Category,
  Contract,
  ContractDispute,
  ContractTemplate,
};
