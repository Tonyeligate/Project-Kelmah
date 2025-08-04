/**
 * Kelmah API Gateway Entry Point
 * Starts the API Gateway server with production configuration
 */

console.log('🚀 Kelmah API Gateway starting...');

// Load environment variables
require('dotenv').config();

console.log('📡 Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
console.log('🔗 Auth Service:', process.env.AUTH_SERVICE_URL);
console.log('👥 User Service:', process.env.USER_SERVICE_URL);
console.log('💼 Job Service:', process.env.JOB_SERVICE_URL);
console.log('💳 Payment Service:', process.env.PAYMENT_SERVICE_URL);
console.log('💬 Messaging Service:', process.env.MESSAGING_SERVICE_URL);

// Start the API Gateway
require('./api-gateway/server');