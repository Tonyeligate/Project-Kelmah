/**
 * Configuration Validation Utility
 * Validates environment variables and configuration across all services
 */

const joi = require('joi');
const fs = require('fs');
const path = require('path');

// Base configuration schema that all services should have
const baseConfigSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().integer().min(1000).max(65535).default(3000),
  JWT_SECRET: joi.string().min(32).required().description('JWT signing secret'),
  CORS_ORIGIN: joi.string().uri().optional().description('CORS allowed origin'),
  LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  API_VERSION: joi.string().default('v1'),
  RATE_LIMIT_WINDOW: joi.number().integer().min(1000).default(900000), // 15 minutes
  RATE_LIMIT_MAX: joi.number().integer().min(1).default(100)
});

// Database configuration schemas
const mongoConfigSchema = joi.object({
  MONGODB_URI: joi.string().uri().required().description('MongoDB connection string'),
  DB_NAME: joi.string().min(1).required().description('Database name'),
  DB_CONNECTION_TIMEOUT: joi.number().integer().min(1000).default(30000),
  DB_MAX_POOL_SIZE: joi.number().integer().min(1).default(10)
});

const sqlConfigSchema = joi.object({
  DB_HOST: joi.string().hostname().required(),
  DB_PORT: joi.number().integer().min(1).max(65535).default(5432),
  DB_NAME: joi.string().min(1).required(),
  DB_USER: joi.string().min(1).required(),
  DB_PASSWORD: joi.string().min(1).required(),
  DB_DIALECT: joi.string().valid('postgres', 'mysql', 'sqlite').default('postgres')
});

// Service-specific schemas
const serviceSchemas = {
  'auth-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    EMAIL_SERVICE: joi.string().valid('gmail', 'sendgrid', 'mailgun').default('gmail'),
    EMAIL_FROM: joi.string().email().required(),
    EMAIL_PASSWORD: joi.string().min(1).when('EMAIL_SERVICE', {
      is: 'gmail',
      then: joi.required(),
      otherwise: joi.optional()
    }),
    SENDGRID_API_KEY: joi.string().when('EMAIL_SERVICE', {
      is: 'sendgrid',
      then: joi.required(),
      otherwise: joi.optional()
    }),
    PASSWORD_RESET_EXPIRY: joi.number().integer().min(300).default(3600), // 1 hour
    JWT_REFRESH_SECRET: joi.string().min(32).required(),
    JWT_ACCESS_EXPIRY: joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: joi.string().default('7d'),
    MFA_SECRET: joi.string().min(16).optional(),
    OAUTH_GOOGLE_CLIENT_ID: joi.string().optional(),
    OAUTH_GOOGLE_CLIENT_SECRET: joi.string().optional(),
    OAUTH_FACEBOOK_APP_ID: joi.string().optional(),
    OAUTH_FACEBOOK_APP_SECRET: joi.string().optional()
  })),

  'user-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    UPLOAD_MAX_SIZE: joi.number().integer().min(1024).default(5242880), // 5MB
    UPLOAD_ALLOWED_TYPES: joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),
    CLOUDINARY_CLOUD_NAME: joi.string().optional(),
    CLOUDINARY_API_KEY: joi.string().optional(),
    CLOUDINARY_API_SECRET: joi.string().optional(),
    AWS_S3_BUCKET: joi.string().optional(),
    AWS_ACCESS_KEY_ID: joi.string().optional(),
    AWS_SECRET_ACCESS_KEY: joi.string().optional(),
    AWS_REGION: joi.string().default('us-east-1'),
    PROFILE_IMAGE_MAX_SIZE: joi.number().integer().default(2097152), // 2MB
    SKILLS_MAX_COUNT: joi.number().integer().min(1).default(20)
  })),

  'job-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    JOB_EXPIRY_DAYS: joi.number().integer().min(1).default(30),
    MAX_APPLICATIONS_PER_JOB: joi.number().integer().min(1).default(100),
    SEARCH_RADIUS_KM: joi.number().min(1).max(1000).default(50),
    ELASTICSEARCH_URL: joi.string().uri().optional(),
    ELASTICSEARCH_INDEX: joi.string().default('jobs'),
    JOB_APPROVAL_REQUIRED: joi.boolean().default(false),
    FEATURED_JOB_PRICE: joi.number().min(0).default(10)
  })),

  'messaging-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    SOCKET_IO_CORS_ORIGIN: joi.string().default('*'),
    MESSAGE_RETENTION_DAYS: joi.number().integer().min(1).default(365),
    MAX_MESSAGE_LENGTH: joi.number().integer().min(1).default(2000),
    MAX_ATTACHMENT_SIZE: joi.number().integer().min(1024).default(10485760), // 10MB
    ALLOWED_ATTACHMENT_TYPES: joi.string().default('image/*,application/pdf,application/msword'),
    TYPING_TIMEOUT_MS: joi.number().integer().min(1000).default(5000),
    ONLINE_STATUS_TIMEOUT_MS: joi.number().integer().min(5000).default(300000), // 5 minutes
    PUSH_NOTIFICATION_SERVICE: joi.string().valid('firebase', 'apn', 'none').default('none'),
    FIREBASE_SERVER_KEY: joi.string().optional(),
    APN_KEY_ID: joi.string().optional(),
    APN_TEAM_ID: joi.string().optional()
  })),

  'payment-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    STRIPE_SECRET_KEY: joi.string().min(1).required(),
    STRIPE_PUBLISHABLE_KEY: joi.string().min(1).required(),
    STRIPE_WEBHOOK_SECRET: joi.string().min(1).required(),
    PAYPAL_CLIENT_ID: joi.string().optional(),
    PAYPAL_CLIENT_SECRET: joi.string().optional(),
    PAYPAL_MODE: joi.string().valid('sandbox', 'live').default('sandbox'),
    PLATFORM_FEE_PERCENTAGE: joi.number().min(0).max(50).default(5),
    MINIMUM_PAYOUT: joi.number().min(1).default(10),
    ESCROW_RELEASE_DELAY_HOURS: joi.number().integer().min(0).default(72),
    CURRENCY_DEFAULT: joi.string().length(3).default('USD'),
    SUPPORTED_CURRENCIES: joi.string().default('USD,EUR,GBP,CAD'),
    BANK_VERIFICATION_REQUIRED: joi.boolean().default(true),
    KYC_REQUIRED_AMOUNT: joi.number().min(0).default(1000)
  })),

  'review-service': baseConfigSchema.concat(mongoConfigSchema).concat(joi.object({
    MIN_RATING: joi.number().min(1).max(5).default(1),
    MAX_RATING: joi.number().min(1).max(5).default(5),
    REVIEW_EDIT_WINDOW_HOURS: joi.number().integer().min(0).default(24),
    REVIEW_MODERATION_ENABLED: joi.boolean().default(false),
    PROFANITY_FILTER_ENABLED: joi.boolean().default(true),
    MAX_REVIEW_LENGTH: joi.number().integer().min(10).default(2000),
    ALLOW_ANONYMOUS_REVIEWS: joi.boolean().default(false)
  })),

  'api-gateway': baseConfigSchema.concat(joi.object({
    AUTH_SERVICE_URL: joi.string().uri().required(),
    USER_SERVICE_URL: joi.string().uri().required(),
    JOB_SERVICE_URL: joi.string().uri().required(),
    MESSAGING_SERVICE_URL: joi.string().uri().required(),
    PAYMENT_SERVICE_URL: joi.string().uri().required(),
    REVIEW_SERVICE_URL: joi.string().uri().required(),
    MONOLITH_SERVICE_URL: joi.string().uri().optional(),
    INTERNAL_API_KEY: joi.string().min(16).required(),
    REQUEST_TIMEOUT_MS: joi.number().integer().min(1000).default(30000),
    MAX_RETRIES: joi.number().integer().min(0).default(3),
    HEALTH_CHECK_INTERVAL_MS: joi.number().integer().min(5000).default(30000),
    CIRCUIT_BREAKER_THRESHOLD: joi.number().integer().min(1).default(5),
    CIRCUIT_BREAKER_TIMEOUT_MS: joi.number().integer().min(5000).default(60000)
  }))
};

/**
 * Validate configuration for a specific service
 * @param {string} serviceName - Name of the service
 * @param {object} config - Configuration object to validate
 * @returns {object} Validation result
 */
function validateServiceConfig(serviceName, config = process.env) {
  const schema = serviceSchemas[serviceName];
  
  if (!schema) {
    throw new Error(`No validation schema found for service: ${serviceName}`);
  }
  
  const { error, value, warning } = schema.validate(config, {
    allowUnknown: true,
    stripUnknown: true,
    abortEarly: false
  });
  
  return {
    isValid: !error,
    config: value,
    errors: error ? error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    })) : [],
    warnings: warning ? warning.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) : []
  };
}

/**
 * Create environment template for a service
 * @param {string} serviceName - Name of the service
 * @returns {string} Environment template content
 */
function createEnvTemplate(serviceName) {
  const schema = serviceSchemas[serviceName];
  if (!schema) {
    throw new Error(`No schema found for service: ${serviceName}`);
  }
  
  const template = [];
  template.push(`# ${serviceName.toUpperCase()} Environment Configuration`);
  template.push(`# Generated on ${new Date().toISOString()}`);
  template.push('');
  
  // Generate template from schema
  const describe = schema.describe();
  generateEnvFromSchema(describe, template);
  
  return template.join('\n');
}

function generateEnvFromSchema(schema, template, prefix = '') {
  if (schema.type === 'object' && schema.keys) {
    for (const [key, value] of Object.entries(schema.keys)) {
      const envKey = prefix ? `${prefix}_${key}` : key;
      const description = value.flags?.description || '';
      const defaultValue = value.flags?.default;
      const required = value.flags?.presence === 'required';
      
      if (description) {
        template.push(`# ${description}`);
      }
      
      if (value.allow && value.allow.length > 0) {
        template.push(`# Allowed values: ${value.allow.join(', ')}`);
      }
      
      const line = required ? 
        `${envKey}=` : 
        `# ${envKey}=${defaultValue || ''}`;
      
      template.push(line);
      template.push('');
    }
  }
}

/**
 * Validate all services in a directory
 * @param {string} servicesDir - Path to services directory
 * @returns {object} Validation results for all services
 */
function validateAllServices(servicesDir) {
  const results = {};
  
  for (const serviceName of Object.keys(serviceSchemas)) {
    const servicePath = path.join(servicesDir, serviceName);
    const envPath = path.join(servicePath, '.env');
    
    try {
      let config = process.env;
      
      // Load service-specific .env if it exists
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
          const [key, ...values] = line.split('=');
          if (key && !key.startsWith('#')) {
            envVars[key.trim()] = values.join('=').trim();
          }
        });
        
        config = { ...process.env, ...envVars };
      }
      
      results[serviceName] = validateServiceConfig(serviceName, config);
      results[serviceName].envFileExists = fs.existsSync(envPath);
      
    } catch (error) {
      results[serviceName] = {
        isValid: false,
        errors: [{ message: error.message }],
        envFileExists: false
      };
    }
  }
  
  return results;
}

module.exports = {
  validateServiceConfig,
  createEnvTemplate,
  validateAllServices,
  serviceSchemas
};