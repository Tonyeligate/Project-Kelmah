/**
 * Routes Index
 * Exports all route modules for the job service
 */

const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');
const contractRoutes = require('./contract.routes');
const reviewRoutes = require('./review.routes');
const contractTemplateRoutes = require('./contract-template.routes');
const contractAnalyticsRoutes = require('./contract-analytics.routes');
const locationRoutes = require('./api/location.routes');
const milestoneRoutes = require('./milestone.routes');
const locationSearchRoutes = require('./location.routes');

module.exports = {
  jobRoutes,
  applicationRoutes,
  contractRoutes,
  reviewRoutes,
  contractTemplateRoutes,
  contractAnalyticsRoutes,
  locationRoutes,
  milestoneRoutes,
  locationSearchRoutes
}; 