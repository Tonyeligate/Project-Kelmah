require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah_review_service',
  JWT_SECRET: process.env.JWT_SECRET || 'review_service_secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:5000',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://localhost:5002',
};
