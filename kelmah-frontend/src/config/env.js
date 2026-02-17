/**
 * Environment Configuration
 *
 * This file contains environment-specific configuration values.
 * Values can be overridden by environment variables.
 */

import { getApiBaseUrl, SERVICES, API_BASE_URL, WS_CONFIG, API_ENDPOINTS } from './environment';

// Read Vite environment variables at build time
const {
  VITE_API_URL,
  VITE_WS_URL,
  VITE_SOCKET_URL,
  VITE_USE_MOCK_DATA,
  VITE_ENABLE_ANALYTICS,
  VITE_ENABLE_MESSAGING,
  VITE_ENABLE_NOTIFICATIONS,
  VITE_ENV,
  VITE_DEBUG_MODE,
} = import.meta.env;

// Derive websocket URL from API base
const WS_URL = WS_CONFIG?.url || API_BASE_URL?.replace(/^http/, 'ws') || '/ws';
const USE_MOCK_DATA = VITE_USE_MOCK_DATA === 'true';

// Async function to get API base URL
const getAPIBaseUrl = async () => {
  try {
    return await getApiBaseUrl();
  } catch (error) {
    console.warn('Failed to get API base URL from centralized config:', error);
    return '/api';
  }
};

// Construct API and WebSocket URLs using centralized config
const getEnvConfig = async () => {
  const apiBaseUrl = await getAPIBaseUrl();

  return {
    // API configuration
    API_URL: apiBaseUrl,
    SOCKET_URL: API_ENDPOINTS.WEBSOCKET.MESSAGING || '/socket.io',
  };
};

// For backward compatibility, provide sync fallbacks
const env = {
  // API configuration - use centralized config
  API_URL: '/api', // Use getEnvConfig() for async access
  SOCKET_URL: '/socket.io', // Use getEnvConfig() for async access

  // Feature flags
  ENABLE_ANALYTICS: VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_MESSAGING: VITE_ENABLE_MESSAGING === 'true',
  ENABLE_NOTIFICATIONS: VITE_ENABLE_NOTIFICATIONS === 'true',

  // Other environment variables
  NODE_ENV: import.meta.env.MODE,
  VITE_ENV: VITE_ENV || import.meta.env.MODE,

  // Custom environment variables
  DEBUG_MODE: VITE_DEBUG_MODE === 'true',

  // App configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Kelmah',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Debug settings
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || false,
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'error',

  // Authentication
  AUTH_STORAGE_KEY: import.meta.env.VITE_AUTH_STORAGE_KEY || 'kelmah_auth',
  TOKEN_REFRESH_INTERVAL:
    Number(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 30 * 60 * 1000, // 30 minutes

  // Mock data settings
  USE_MOCK_DATA,

  // Export additional variables for direct access
  API_BASE_URL,
  WS_URL,
};

export default env;

// Also export individual values for convenient imports
export { API_BASE_URL, WS_URL, USE_MOCK_DATA };
