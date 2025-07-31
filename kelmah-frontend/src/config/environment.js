/**
 * Centralized Environment Configuration
 *
 * This file manages all environment variables and provides a single source of truth
 * for configuration across the entire frontend application.
 */

// Get current environment
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';
const isTesting = import.meta.env.MODE === 'test';

// ===============================================
// API CONFIGURATION
// ===============================================

// Default service URLs for different environments
const DEFAULT_SERVICES = {
  development: {
    AUTH_SERVICE: 'http://localhost:5001',
    USER_SERVICE: 'http://localhost:5002',
    JOB_SERVICE: 'http://localhost:5003',
    MESSAGING_SERVICE: 'http://localhost:5004',
    PAYMENT_SERVICE: 'http://localhost:5005',
  },
  production: {
    AUTH_SERVICE: 'https://kelmah-auth-service.onrender.com',
    USER_SERVICE: 'https://kelmah-user-service.onrender.com',
    JOB_SERVICE: 'https://kelmah-job-service.onrender.com',
    MESSAGING_SERVICE: 'https://kelmah-messaging-service.onrender.com',
    PAYMENT_SERVICE: 'https://kelmah-payment-service.onrender.com',
  },
};

// Get service URLs (environment variables override defaults)
const getServiceUrl = (serviceName) => {
  const envVar = `VITE_${serviceName}_URL`;
  const envValue = import.meta.env[envVar];

  if (envValue) {
    return envValue;
  }

  // Always use production services for real data (no localhost dependencies)
  // Use development services only if explicitly configured via environment variables
  return DEFAULT_SERVICES.production[serviceName];
};

// Service URLs
export const SERVICES = {
  AUTH_SERVICE: getServiceUrl('AUTH_SERVICE'),
  USER_SERVICE: getServiceUrl('USER_SERVICE'),
  JOB_SERVICE: getServiceUrl('JOB_SERVICE'),
  MESSAGING_SERVICE: getServiceUrl('MESSAGING_SERVICE'),
  PAYMENT_SERVICE: getServiceUrl('PAYMENT_SERVICE'),
};

// Primary API URL (defaults to Auth Service)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || SERVICES.AUTH_SERVICE;

// ===============================================
// APPLICATION CONFIGURATION
// ===============================================

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Kelmah',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description:
    import.meta.env.VITE_APP_DESCRIPTION ||
    'Connect Vocational Workers with Hirers',
  environment: import.meta.env.MODE || 'development',
};

// ===============================================
// FEATURE FLAGS
// ===============================================

export const FEATURES = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  messaging: import.meta.env.VITE_ENABLE_MESSAGING !== 'false', // enabled by default
  notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  payments: import.meta.env.VITE_ENABLE_PAYMENTS !== 'false',
  reviews: import.meta.env.VITE_ENABLE_REVIEWS !== 'false',

  // Development features
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  useMocks: false, // Force disable mocks to use real API data
  mockDelay: parseInt(import.meta.env.VITE_MOCK_DELAY || '1000'),
};

// ===============================================
// SECURITY CONFIGURATION
// ===============================================

export const AUTH_CONFIG = {
  // Storage keys
  tokenKey: import.meta.env.VITE_AUTH_STORAGE_KEY || 'kelmah_auth_token',
  refreshTokenKey:
    import.meta.env.VITE_REFRESH_TOKEN_KEY || 'kelmah_refresh_token',
  userKey: import.meta.env.VITE_USER_STORAGE_KEY || 'kelmah_user',

  // Token management
  tokenRefreshInterval: parseInt(
    import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || '1800000',
  ), // 30 min
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour

  // OAuth
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID,
  linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
};

// ===============================================
// UI/UX CONFIGURATION
// ===============================================

export const UI_CONFIG = {
  theme: {
    primary: import.meta.env.VITE_PRIMARY_COLOR || '#1a1a1a', // Black
    secondary: import.meta.env.VITE_SECONDARY_COLOR || '#D4AF37', // Gold
    accent: import.meta.env.VITE_ACCENT_COLOR || '#ffffff', // White
  },

  animations: {
    duration: parseInt(import.meta.env.VITE_ANIMATION_DURATION || '300'),
    toastDuration: parseInt(import.meta.env.VITE_TOAST_DURATION || '5000'),
  },

  pagination: {
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '10'),
    maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100'),
  },
};

// ===============================================
// WEBSOCKET CONFIGURATION
// ===============================================

export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || SERVICES.MESSAGING_SERVICE,
  reconnectionAttempts: parseInt(
    import.meta.env.VITE_WS_RECONNECTION_ATTEMPTS || '5',
  ),
  reconnectionDelay: parseInt(
    import.meta.env.VITE_WS_RECONNECTION_DELAY || '5000',
  ),
};

// ===============================================
// PERFORMANCE CONFIGURATION
// ===============================================

export const PERFORMANCE_CONFIG = {
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'), // 30 seconds
  socketTimeout: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT || '60000'), // 60 seconds

  fileUpload: {
    maxSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (
      import.meta.env.VITE_ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx'
    ).split(','),
  },
};

// ===============================================
// LOGGING CONFIGURATION
// ===============================================

export const LOG_CONFIG = {
  level: import.meta.env.VITE_LOG_LEVEL || 'error',
  enableConsole:
    import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || isDevelopment,
};

// ===============================================
// API ENDPOINTS CONFIGURATION
// ===============================================

// Helper function to build API endpoints
const buildEndpoint = (serviceUrl, path) => {
  return isDevelopment
    ? `/api${path}` // Use proxy in development
    : `${serviceUrl}/api${path}`; // Direct service URL in production
};

export const API_ENDPOINTS = {
  // Auth Service Endpoints
  AUTH: {
    BASE: buildEndpoint(SERVICES.AUTH_SERVICE, ''),
    REGISTER: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/register'),
    LOGIN: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/login'),
    LOGOUT: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/logout'),
    VERIFY: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/verify'),
    REFRESH: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/refresh-token'),
    FORGOT_PASSWORD: buildEndpoint(
      SERVICES.AUTH_SERVICE,
      '/auth/forgot-password',
    ),
    RESET_PASSWORD: buildEndpoint(
      SERVICES.AUTH_SERVICE,
      '/auth/reset-password',
    ),
    ME: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/me'),
    MFA_SETUP: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/mfa/setup'),
    MFA_VERIFY: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/mfa/verify'),
    MFA_DISABLE: buildEndpoint(SERVICES.AUTH_SERVICE, '/auth/mfa/disable'),
  },

  // User Service Endpoints
  USER: {
    BASE: buildEndpoint(SERVICES.USER_SERVICE, ''),
    PROFILE: buildEndpoint(SERVICES.USER_SERVICE, '/users/profile'),
    UPDATE: buildEndpoint(SERVICES.USER_SERVICE, '/users/profile'),
    LIST: buildEndpoint(SERVICES.USER_SERVICE, '/users'),
    WORKERS: buildEndpoint(SERVICES.USER_SERVICE, '/users/workers'),
    HIRERS: buildEndpoint(SERVICES.USER_SERVICE, '/users/hirers'),
  },

  // Job Service Endpoints
  JOB: {
    BASE: buildEndpoint(SERVICES.JOB_SERVICE, ''),
    LIST: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs'),
    CREATE: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs'),
    UPDATE: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs'),
    DELETE: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs'),
    APPLY: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs/apply'),
    MY_JOBS: buildEndpoint(SERVICES.JOB_SERVICE, '/jobs/my-jobs'),
    BY_ID: (id) => buildEndpoint(SERVICES.JOB_SERVICE, `/jobs/${id}`),
  },

  // Messaging Service Endpoints
  MESSAGING: {
    BASE: buildEndpoint(SERVICES.MESSAGING_SERVICE, ''),
    CONVERSATIONS: buildEndpoint(
      SERVICES.MESSAGING_SERVICE,
      '/messages/conversations',
    ),
    MESSAGES: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/messages'),
    SEND: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/messages/send'),
    UPLOAD: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/messages/upload'),
  },

  // Payment Service Endpoints
  PAYMENT: {
    BASE: buildEndpoint(SERVICES.PAYMENT_SERVICE, ''),
    METHODS: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/methods'),
    PROCESS: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/process'),
    HISTORY: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/history'),
    WALLET: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/wallet'),
    ESCROW: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/escrow'),
  },
};

// ===============================================
// VALIDATION HELPERS
// ===============================================

export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
};

// ===============================================
// ENVIRONMENT INFO FOR DEBUGGING
// ===============================================

export const ENV_INFO = {
  isDevelopment,
  isProduction,
  isTesting,
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL,
  services: SERVICES,
  apiEndpoints: API_ENDPOINTS,
};

// Development logging
if (isDevelopment && LOG_CONFIG.enableConsole) {
  console.group('🔧 Kelmah Environment Configuration');
  console.log('Environment:', ENV_INFO.mode);
  console.log('Services:', SERVICES);
  console.log('Features:', FEATURES);
  console.log('API Base URL:', API_BASE_URL);
  console.groupEnd();
}

// Default export with all configuration
export default {
  APP_CONFIG,
  FEATURES,
  AUTH_CONFIG,
  UI_CONFIG,
  WS_CONFIG,
  PERFORMANCE_CONFIG,
  LOG_CONFIG,
  API_ENDPOINTS,
  SERVICES,
  API_BASE_URL,
  VALIDATION,
  ENV_INFO,
};
