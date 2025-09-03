/**
 * MongoDB Models Index for Job Service
 */

// Export models without initiating a DB connection here.
// The application is responsible for establishing the MongoDB connection
// via `config/db.js` with retry/backoff logic.
module.exports = {
  Job: require('./Job'),
  Application: require('./Application'), // Keep for backward compatibility
  Bid: require('./Bid'), // New bidding system
  UserPerformance: require('./UserPerformance'), // New performance tracking
  Category: require('./Category'),
  Contract: require('./Contract'),
  ContractDispute: require('./ContractDispute'),
  ContractTemplate: require('./ContractTemplate'),
  SavedJob: require('./SavedJob'),
  User: require('./User')
};
