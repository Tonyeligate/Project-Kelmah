/**
 * Auth Service Configuration
 * Contains all configuration settings for the authentication service
 */

require('dotenv').config();

const rateLimits = require('./rate-limits');

module.exports = {
  // Application settings
  app: {
    name: process.env.APP_NAME || 'kelmah-auth-service',
    version: process.env.APP_VERSION || '1.0.0',
    port: process.env.AUTH_PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1/auth'
  },

  // Database configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'kelmah',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },

  // JWT configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-token-secret-for-development-only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-token-secret-for-development-only',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'kelmah-auth-service',
    audience: process.env.JWT_AUDIENCE || 'kelmah-platform'
  },

  // Password hashing configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },

  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@kelmah.com',
    smtp: {
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT) || 2525,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    },
    templates: {
      verification: process.env.EMAIL_VERIFICATION_TEMPLATE || 'verification',
      passwordReset: process.env.EMAIL_PASSWORD_RESET_TEMPLATE || 'password-reset',
      passwordChanged: process.env.EMAIL_PASSWORD_CHANGED_TEMPLATE || 'password-changed'
    }
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'kelmah:auth:',
    ttl: parseInt(process.env.REDIS_TTL) || 86400, // 24 hours in seconds
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    connectRetries: parseInt(process.env.REDIS_CONNECT_RETRIES) || 3
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization',
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS || 'Content-Range,X-Content-Range',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-for-development-only',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
    },
    name: process.env.SESSION_COOKIE_NAME || 'kelmah.sid',
    rolling: true
  },

  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['profile', 'email']
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/facebook/callback',
      scope: ['email', 'public_profile']
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackUrl: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile']
    }
  },

  // Verification settings
  verification: {
    tokenExpiry: process.env.VERIFICATION_TOKEN_EXPIRY || '24h',
    passwordResetExpiry: process.env.PASSWORD_RESET_EXPIRY || '1h',
    maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS) || 3,
    cooldownPeriod: parseInt(process.env.VERIFICATION_COOLDOWN_PERIOD) || 30 * 60 * 1000 // 30 minutes
  },

  // Security settings
  security: {
    rateLimits,
    loginAttempts: {
      max: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION) || 30 * 60 * 1000 // 30 minutes
    },
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
    }
  },

  // Frontend URL for redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    transports: process.env.LOG_TRANSPORTS ? process.env.LOG_TRANSPORTS.split(',') : ['console'],
    filename: process.env.LOG_FILE || 'logs/auth-service.log',
    logDir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || 5242880, // 5MB
    maxFiles: process.env.LOG_MAX_FILES || 5
  }
}; 