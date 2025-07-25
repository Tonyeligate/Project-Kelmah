/**
 * Main Configuration
 * Exports all configuration modules
 */

const db = require('./db');
const env = require('./env');

// Import auth config if it exists, otherwise create a placeholder
let auth = {};
try {
  auth = require('./auth');
} catch (error) {
  console.warn('Auth configuration not found, using defaults');
}

module.exports = {
  ...env,
  ...auth,
  db,
  frontendUrl: env.FRONTEND_URL
}; 