/**
 * Review Service Models Index - Uses Shared Models
 * Follows consolidated Kelmah architecture pattern
 */

// Import from shared models
const { User, Job, Application } = require('../../../shared/models');

// Import service-specific models
const Review = require('./Review');
const WorkerRating = require('./WorkerRating');

// Export models
module.exports = {
  // Shared models
  User,
  Job,
  Application,

  // Service-specific models
  Review,
  WorkerRating
};