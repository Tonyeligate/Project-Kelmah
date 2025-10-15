/**
 * Job Service Models Index
 * Uses shared models for cross-service entities, local models for service-specific
 */

// Get the connected mongoose instance from db config
const { mongoose } = require('../config/db');

// Import shared models (truly cross-service)
const { Job, Application, User } = require('../../../shared/models');

// Import LOCAL service-specific models
const SavedJob = require('./SavedJob');  // ✅ Local (only job-service)
const Bid = require('./Bid');
const UserPerformance = require('./UserPerformance');
const Category = require('./Category');
const Contract = require('./Contract');
const ContractDispute = require('./ContractDispute');
const ContractTemplate = require('./ContractTemplate');

// Export models
module.exports = {
  // Shared models
  Job,         // ✅ Shared (used by job, review, payment)
  Application, // ✅ Shared (used by job, review, payment)
  User,        // ✅ Shared (used by all services)
  
  // Local service-specific models
  SavedJob,
  Bid,
  UserPerformance,
  Category,
  Contract,
  ContractDispute,
  ContractTemplate,
};
