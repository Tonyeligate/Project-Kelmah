/**
 * Legacy Server Entry Point - Redirect to API Gateway
 * This file exists to handle old references to src/server.js
 */

console.log('🚀 Starting Kelmah API Gateway from src/server.js...');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Start the API Gateway
require('../api-gateway/server');