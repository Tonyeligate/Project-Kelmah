/**
 * Security Configuration
 * 
 * Centralized security settings and policies for the Kelmah application.
 */

export const SECURITY_CONFIG = {
  // Authentication settings
  AUTH: {
    TOKEN_EXPIRY: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    AUTO_LOGOUT_AFTER: 30 * 60 * 1000, // 30 minutes of inactivity
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },

  // Storage settings
  STORAGE: {
    ENCRYPTION_ENABLED: true,
    MAX_STORAGE_AGE: 24 * 60 * 60 * 1000, // 24 hours
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    SECURE_KEYS: [
      'auth_token',
      'refresh_token',
      'user_data',
      'sensitive_settings'
    ]
  },

  // API Security
  API: {
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 60,
      BURST_LIMIT: 10
    },
    REQUIRED_HEADERS: [
      'X-Request-ID',
      'X-Client-Version'
    ]
  },

  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': [
      "'self'",
      'https://75747e46b980.ngrok-free.app',
      // Legacy Render URLs (kept for docs/testing; not used in production anymore)
      "https://kelmah-auth-service.onrender.com",
      "https://kelmah-user-service.onrender.com",
      "https://kelmah-job-service.onrender.com",
      "https://kelmah-messaging-service.onrender.com",
      "https://kelmah-payment-service.onrender.com"
    ]
  },

  // Session Management
  SESSION: {
    IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    WARNING_TIME: 5 * 60 * 1000, // 5 minutes before timeout
    EXTEND_ON_ACTIVITY: true,
    SECURE_COOKIE: true,
    SAME_SITE: 'strict'
  },

  // Input Validation
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000,
    ALLOWED_FILE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SANITIZE_HTML: true,
    ESCAPE_OUTPUT: true
  },

  // Error Handling
  ERROR_HANDLING: {
    LOG_ERRORS: true,
    SEND_TO_SERVER: process.env.NODE_ENV === 'production',
    MAX_ERROR_REPORTS: 10,
    SENSITIVE_DATA_PATTERNS: [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i
    ]
  },

  // Network Security
  NETWORK: {
    ENFORCE_HTTPS: process.env.NODE_ENV === 'production',
    HSTS_MAX_AGE: 31536000, // 1 year
    TRUST_PROXY: false,
    IP_WHITELIST: [], // Empty means allow all
    BLOCK_SUSPICIOUS_IPS: true
  },

  // Feature Flags
  FEATURES: {
    ENABLE_2FA: false, // Future feature
    ENABLE_BIOMETRICS: false, // Future feature
    ENABLE_SESSION_RECORDING: false,
    ENABLE_AUDIT_LOGGING: true,
    ENABLE_RATE_LIMITING: true
  },

  // Development/Debug settings
  DEBUG: {
    ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
    SHOW_STACK_TRACES: process.env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_MONITORING: true,
    LOG_API_REQUESTS: process.env.NODE_ENV === 'development'
  }
};

/**
 * Security utility functions
 */
export const SecurityUtils = {
  /**
   * Check if current environment is secure
   */
  isSecureContext: () => {
    return window.isSecureContext || window.location.protocol === 'https:';
  },

  /**
   * Generate secure random string
   */
  generateSecureId: (length = 16) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Sanitize input string
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .trim()
      .substring(0, SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH);
  },

  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData: (data) => {
    const dataString = JSON.stringify(data).toLowerCase();
    return SECURITY_CONFIG.ERROR_HANDLING.SENSITIVE_DATA_PATTERNS.some(
      pattern => pattern.test(dataString)
    );
  },

  /**
   * Validate file type and size
   */
  validateFile: (file) => {
    const errors = [];
    
    if (!SECURITY_CONFIG.VALIDATION.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('File type not allowed');
    }
    
    if (file.size > SECURITY_CONFIG.VALIDATION.MAX_FILE_SIZE) {
      errors.push('File too large');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Create secure headers for API requests
   */
  createSecureHeaders: () => {
    return {
      'X-Request-ID': SecurityUtils.generateSecureId(),
      'X-Client-Version': '1.0.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  }
};

export default SECURITY_CONFIG;
