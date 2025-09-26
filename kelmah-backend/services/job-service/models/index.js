/**
 * Job Service Models Index - Uses Shared Models
 * Updated to use centralized shared models instead of local duplicates
 */

// Import from shared models
const { Job, Application, User } = require('../../../shared/models');

// Import service-specific models
const Bid = require('./Bid');
const UserPerformance = require('./UserPerformance');
const Category = require('./Category');
const Contract = require('./Contract');
const ContractDispute = require('./ContractDispute');
const ContractTemplate = require('./ContractTemplate');
const SavedJob = require('./SavedJob');

// Export models
module.exports = {
  // Shared models
  Job,
  Application,
  User,
  
  // Service-specific models
  Bid,
  UserPerformance,
  Category,
  Contract,
  ContractDispute,
  ContractTemplate,
  SavedJob
};
