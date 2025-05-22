/**
 * Environment Configuration
 * 
 * This file contains environment-specific configuration values.
 * Values can be overridden by environment variables.
 */

// Environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5174';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const env = {
  // API configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5174',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5174',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_MESSAGING: import.meta.env.VITE_ENABLE_MESSAGING === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  
  // Other environment variables
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  VITE_ENV: import.meta.env.VITE_ENV || 'development',
  
  // Custom environment variables
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // App configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Kelmah',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Debug settings
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || false,
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'error',
  
  // Authentication
  AUTH_STORAGE_KEY: import.meta.env.VITE_AUTH_STORAGE_KEY || 'kelmah_auth',
  TOKEN_REFRESH_INTERVAL: Number(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 30 * 60 * 1000, // 30 minutes
  
  // Mock data settings
  USE_MOCK_DATA,
  
  // Export additional variables for direct access
  API_BASE_URL,
  WS_URL
};

export default env;

// Also export individual values for convenient imports
export { API_BASE_URL, WS_URL, USE_MOCK_DATA }; 