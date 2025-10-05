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

// Import service URLs from centralized services.js
import SERVICES from './services';

// Re-export SERVICES for backward compatibility
export { SERVICES };

// Load runtime config for dynamic LocalTunnel URL
let runtimeConfig = null;
const loadRuntimeConfig = async () => {
  if (typeof window !== 'undefined' && !runtimeConfig) {
    try {
      const response = await fetch('/runtime-config.json');
      runtimeConfig = await response.json();
      console.log('🔧 Runtime config loaded:', runtimeConfig);
    } catch (error) {
      console.warn('⚠️ Failed to load runtime config:', error.message);
    }
  }
  return runtimeConfig;
};

// Multiple backend URLs to try in order (LocalTunnel first for faster local development)
const BACKEND_OPTIONS = [
  null, // Will be replaced with LocalTunnel URL from runtime config (try first - fastest when available)
  'https://kelmah-api-gateway-si57.onrender.com', // Render production (fallback - always available)
];

// Health check a backend URL
const checkBackendHealth = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Primary API URL selection with intelligent fallback
const computeApiBase = async () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isProduction = import.meta.env.PROD;
  const isBrowser = typeof window !== 'undefined';
  const isHttpsPage = isBrowser && window.location && window.location.protocol === 'https:';
  const isVercel = isBrowser && window.location.hostname.includes('vercel.app');

  // Load runtime config for dynamic LocalTunnel URL (replaces ngrok)
  const config = await loadRuntimeConfig();
  const localtunnelUrl = config?.localtunnelUrl || config?.ngrokUrl; // Support both keys for backward compatibility

  // Add LocalTunnel URL to options if available (FIRST position for priority)
  if (localtunnelUrl) {
    BACKEND_OPTIONS[0] = localtunnelUrl;
  }

  // For Vercel/Production deployments, try backends in order of preference
  if (isVercel || isProduction) {
    console.log('� Intelligent backend selection: Testing available backends...');
    
    // Try each backend option
    for (const backendUrl of BACKEND_OPTIONS) {
      if (!backendUrl) continue;
      
      console.log(`🏥 Testing backend: ${backendUrl}`);
      const isHealthy = await checkBackendHealth(backendUrl);
      
      if (isHealthy) {
        console.log(`✅ Backend available: ${backendUrl}`);
        return backendUrl;
      } else {
        console.warn(`❌ Backend unavailable: ${backendUrl}`);
      }
    }
    
    // If all backends fail, use Render as default (most reliable)
    console.warn('⚠️ All backends unavailable, defaulting to Render');
    return BACKEND_OPTIONS[0];
  }

  // For local development, use environment URL or localhost
  if (envUrl) {
    // On HTTPS pages, avoid absolute http URLs to prevent mixed-content
    if (isHttpsPage && envUrl.startsWith('http:')) {
      console.warn('⚠️ Rejecting http URL on https page, using relative /api');
      return '/api';
    }
    return envUrl;
  }
  
  // No environment URL set - use relative /api
  console.log('🔗 No VITE_API_URL set, using /api');
  return '/api';
};

// Export async function to get API base URL
export const getApiBaseUrl = computeApiBase;

// For backward compatibility, export a promise that resolves to the URL
// Note: This will be a promise, so consumers should await it or use getApiBaseUrl()
export const API_BASE_URL = computeApiBase();

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

// Import dynamic configuration
import { getWebSocketUrlSync } from './dynamicConfig';

export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || import.meta.env.VITE_MESSAGING_SERVICE_URL || getWebSocketUrlSync() || '/socket.io',
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
  // Always route via API gateway unless a direct service URL override is present
  if (serviceUrl && /^https?:\/\//.test(serviceUrl)) {
    return `${serviceUrl}/api${path}`;
  }
  return `/api${path}`;
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
      '/conversations',
    ),
    MESSAGES: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/messages'),
    SEND: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/messages'),
    UPLOAD: buildEndpoint(SERVICES.MESSAGING_SERVICE, '/attachments/upload'),
  },

  // Payment Service Endpoints
  PAYMENT: {
    BASE: buildEndpoint(SERVICES.PAYMENT_SERVICE, ''),
    METHODS: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/methods'),
    PROCESS: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/transactions'),
    HISTORY: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/transactions/history'),
    WALLET: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/wallet'),
    ESCROW: buildEndpoint(SERVICES.PAYMENT_SERVICE, '/payments/escrows'),
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
