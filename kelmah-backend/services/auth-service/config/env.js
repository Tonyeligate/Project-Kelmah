/**
 * Environment Configuration
 * Validates required environment variables and sets defaults
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env files from multiple possible locations
console.log('Attempting to load .env files from multiple locations');
const envPaths = [
  path.resolve(__dirname, '../.env'),        // auth-service/.env
  path.resolve(__dirname, '../../.env'),     // services/.env
  path.resolve(__dirname, '../../../.env'),  // kelmah-backend/.env
];

// Try loading from each path and log results
envPaths.forEach(envPath => {
  console.log(`Checking for .env at: ${envPath}`);
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.log(`No .env found at ${envPath}`);
  } else {
    console.log(`Loaded .env from ${envPath}`);
  }
});

// Required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

// Check for required environment variables
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(env => console.error(`- ${env}`));
  process.exit(1);
}

// Log all SMTP-related environment variables
console.log('Environment variables check:');
console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('- SMTP_HOST:', process.env.SMTP_HOST);
console.log('- SMTP_PORT:', process.env.SMTP_PORT);
console.log('- SMTP_USER:', process.env.SMTP_USER);
console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '******' : 'undefined');

// Environment variables with defaults
const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  
  // Email / SMTP
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@kelmah.com',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests
};

// Log final config values for SMTP
console.log('Final config values:');
console.log('- EMAIL_FROM:', config.EMAIL_FROM);
console.log('- SMTP_HOST:', config.SMTP_HOST);
console.log('- SMTP_PORT:', config.SMTP_PORT);
console.log('- SMTP_USER:', config.SMTP_USER);
console.log('- SMTP_PASS:', config.SMTP_PASS ? '******' : 'undefined');

module.exports = config;