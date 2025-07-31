/**
 * Auth Service Environment Configuration
 * 
 * Centralized environment variable management for the authentication service.
 * This file handles all environment-specific settings and provides defaults.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Helper function to parse boolean environment variables
const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
};

// Helper function to parse integer environment variables
const parseInteger = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Required environment variables
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

// Check for required environment variables
const missingEnvVars = REQUIRED_ENV_VARS.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingEnvVars.forEach(env => console.error(`   - ${env}`));
  console.error('\nPlease set these environment variables and restart the service.');
  process.exit(1);
}

// ===============================================
// SERVER CONFIGURATION
// ===============================================

const SERVER_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInteger(process.env.AUTH_SERVICE_PORT || process.env.PORT, 5001),
  HOST: process.env.HOST || '0.0.0.0',
  SERVICE_NAME: 'Auth Service',
  SERVICE_VERSION: '1.0.0'
};

// ===============================================
// DATABASE CONFIGURATION
// ===============================================

const DATABASE_CONFIG = {
  // PostgreSQL configuration for user data
  SQL_URL: process.env.AUTH_SQL_URL || process.env.SQL_URL || 
           `postgres://localhost:5432/kelmah_auth_${SERVER_CONFIG.NODE_ENV}`,
  
  // MongoDB configuration for sessions/tokens
  MONGO_URI: process.env.AUTH_MONGO_URI || process.env.MONGODB_URI ||
             `mongodb://localhost:27017/kelmah_auth_${SERVER_CONFIG.NODE_ENV}`,
  
  // Connection options
  DB_CONNECTION_TIMEOUT: parseInteger(process.env.DB_CONNECTION_TIMEOUT, 30000),
  DB_MAX_CONNECTIONS: parseInteger(process.env.DB_MAX_CONNECTIONS, 10),
  DB_SSL: parseBoolean(process.env.DB_SSL, SERVER_CONFIG.NODE_ENV === 'production')
};

// ===============================================
// JWT CONFIGURATION
// ===============================================

const JWT_CONFIG = {
  // Secrets
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  
  // Token expiration
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  
  // Token issuer and audience
  JWT_ISSUER: process.env.JWT_ISSUER || 'kelmah-auth-service',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'kelmah-platform',
  
  // Algorithm
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256'
};

// ===============================================
// SECURITY CONFIGURATION
// ===============================================

const SECURITY_CONFIG = {
  // Password hashing
  BCRYPT_SALT_ROUNDS: parseInteger(process.env.BCRYPT_SALT_ROUNDS, 12),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  
  // Login specific rate limiting
  LOGIN_RATE_LIMIT_WINDOW_MS: parseInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: parseInteger(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 5),
  
  // Account lockout
  MAX_LOGIN_ATTEMPTS: parseInteger(process.env.MAX_LOGIN_ATTEMPTS, 5),
  LOCKOUT_DURATION_MS: parseInteger(process.env.LOCKOUT_DURATION_MS, 30 * 60 * 1000), // 30 minutes
  
  // Session management
  MAX_SESSIONS_PER_USER: parseInteger(process.env.MAX_SESSIONS_PER_USER, 5),
  SESSION_CLEANUP_INTERVAL_MS: parseInteger(process.env.SESSION_CLEANUP_INTERVAL_MS, 60 * 60 * 1000), // 1 hour
  
  // Two-factor authentication
  MFA_TOKEN_VALIDITY_SECONDS: parseInteger(process.env.MFA_TOKEN_VALIDITY_SECONDS, 300), // 5 minutes
  MFA_BACKUP_CODES_COUNT: parseInteger(process.env.MFA_BACKUP_CODES_COUNT, 10)
};

// ===============================================
// EMAIL CONFIGURATION
// ===============================================

const EMAIL_CONFIG = {
  FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@kelmah.com',
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'Kelmah Platform',
  
  // SMTP settings (if using SMTP)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInteger(process.env.SMTP_PORT, 587),
  SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  
  // SendGrid settings (if using SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // Email verification
  EMAIL_VERIFICATION_EXPIRES_HOURS: parseInteger(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS, 24),
  PASSWORD_RESET_EXPIRES_HOURS: parseInteger(process.env.PASSWORD_RESET_EXPIRES_HOURS, 1)
};

// ===============================================
// OAUTH CONFIGURATION
// ===============================================

const OAUTH_CONFIG = {
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Facebook OAuth
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  
  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  
  // OAuth redirect URLs
  OAUTH_SUCCESS_REDIRECT: process.env.OAUTH_SUCCESS_REDIRECT || 
                         (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'http://localhost:5173/dashboard'),
  OAUTH_FAILURE_REDIRECT: process.env.OAUTH_FAILURE_REDIRECT || 
                         (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'https://kelmah-frontend-cyan.vercel.app/login')
};

// ===============================================
// EXTERNAL SERVICES CONFIGURATION
// ===============================================

const EXTERNAL_SERVICES_CONFIG = {
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app',
  
  // Other microservices
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://localhost:5003',
  MESSAGING_SERVICE_URL: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5004',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005',
  
  // API Gateway
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:5000',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'kelmah_internal_api_key_change_this'
};

// ===============================================
// LOGGING CONFIGURATION
// ===============================================

const LOGGING_CONFIG = {
  LOG_LEVEL: process.env.LOG_LEVEL || (SERVER_CONFIG.NODE_ENV === 'production' ? 'warn' : 'debug'),
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  LOG_TO_FILE: parseBoolean(process.env.LOG_TO_FILE, SERVER_CONFIG.NODE_ENV === 'production'),
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/auth-service.log',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '10m',
  LOG_MAX_FILES: parseInteger(process.env.LOG_MAX_FILES, 5)
};

// ===============================================
// CORS CONFIGURATION
// ===============================================

const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [
      'http://localhost:3000',
      'https://kelmah-frontend-cyan.vercel.app',
      'http://localhost:5173',
    ],
  
  CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, true),
  MAX_AGE: parseInteger(process.env.CORS_MAX_AGE, 86400) // 24 hours
};

// ===============================================
// HEALTH CHECK CONFIGURATION
// ===============================================

const HEALTH_CONFIG = {
  HEALTH_CHECK_INTERVAL_MS: parseInteger(process.env.HEALTH_CHECK_INTERVAL_MS, 30000), // 30 seconds
  HEALTH_CHECK_TIMEOUT_MS: parseInteger(process.env.HEALTH_CHECK_TIMEOUT_MS, 5000), // 5 seconds
  ENABLE_HEALTH_CHECKS: parseBoolean(process.env.ENABLE_HEALTH_CHECKS, true)
};

// ===============================================
// CONSOLIDATED CONFIGURATION EXPORT
// ===============================================

const config = {
  ...SERVER_CONFIG,
  ...DATABASE_CONFIG,
  ...JWT_CONFIG,
  ...SECURITY_CONFIG,
  ...EMAIL_CONFIG,
  ...OAUTH_CONFIG,
  ...EXTERNAL_SERVICES_CONFIG,
  ...LOGGING_CONFIG,
  ...CORS_CONFIG,
  ...HEALTH_CONFIG,
  
  // Helper flags
  isDevelopment: SERVER_CONFIG.NODE_ENV === 'development',
  isProduction: SERVER_CONFIG.NODE_ENV === 'production',
  isTesting: SERVER_CONFIG.NODE_ENV === 'test'
};

// ===============================================
// CONFIGURATION VALIDATION
// ===============================================

// Validate email configuration
if (!EMAIL_CONFIG.SMTP_HOST && !EMAIL_CONFIG.SENDGRID_API_KEY) {
  console.warn('⚠️  Warning: No email service configured. Email features will be disabled.');
}

// Validate OAuth configuration
const hasOAuthConfig = OAUTH_CONFIG.GOOGLE_CLIENT_ID || 
                      OAUTH_CONFIG.FACEBOOK_APP_ID || 
                      OAUTH_CONFIG.LINKEDIN_CLIENT_ID;

if (!hasOAuthConfig) {
  console.warn('⚠️  Warning: No OAuth providers configured. Social login will be disabled.');
}

// ===============================================
// DEVELOPMENT LOGGING
// ===============================================

// Always log configuration for debugging
console.log('🔧 Auth Service Configuration:');
console.log(`   Environment: ${config.NODE_ENV}`);
console.log(`   Port: ${config.PORT}`);
console.log(`   Database: ${config.SQL_URL ? 'PostgreSQL' : 'Not configured'}`);
console.log(`   MongoDB: ${config.MONGO_URI ? 'Connected' : 'Not configured'}`);
console.log(`   Frontend URL: ${config.FRONTEND_URL}`);
console.log(`   Direct env FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`   OAuth Providers: ${hasOAuthConfig ? 'Configured' : 'None'}`);
console.log(`   Email Service: ${EMAIL_CONFIG.SMTP_HOST || EMAIL_CONFIG.SENDGRID_API_KEY ? 'Configured' : 'Not configured'}`);

module.exports = config;