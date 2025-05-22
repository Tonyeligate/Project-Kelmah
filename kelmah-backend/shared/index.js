/**
 * Shared utilities for Kelmah services
 * Centralized exports of common utilities, configs, and middleware
 */

// Database configuration
const database = require('./config/database');

// Response utils
const response = require('./response');

// Import all middleware
const middleware = require('./middleware');

// Utils
const utils = require('./utils/response');

module.exports = {
  // Main modules
  database,
  response,
  middleware,
  
  // Direct middleware exports for backwards compatibility
  authenticate: middleware.authenticate,
  authorize: middleware.authorize,
  
  // Utils
  utils
}; 