/**
 * Configuration Index
 * 
 * This file exports all configuration variables from the config directory.
 * It serves as a single entry point for importing configuration values.
 */

// Import required modules
import env, { API_BASE_URL as envApiBaseUrl, WS_URL as envWsUrl, USE_MOCK_DATA as envUseMockData } from './env';
import * as constants from './constants';

// Export renamed imports to avoid conflicts
export const API_BASE_URL = envApiBaseUrl;
export const WS_URL = envWsUrl;
export const USE_MOCK_DATA = envUseMockData;

// Export other commonly used environment variables
export const API_URL = env.API_URL;
export const SOCKET_URL = env.SOCKET_URL;
export const NODE_ENV = env.NODE_ENV;
export const APP_NAME = env.APP_NAME;
export const APP_VERSION = env.APP_VERSION;
export const DEBUG = env.DEBUG;
export const LOG_LEVEL = env.LOG_LEVEL;
export const AUTH_STORAGE_KEY = env.AUTH_STORAGE_KEY;
export const TOKEN_REFRESH_INTERVAL = env.TOKEN_REFRESH_INTERVAL;
export const ENABLE_ANALYTICS = env.ENABLE_ANALYTICS;
export const ENABLE_MESSAGING = env.ENABLE_MESSAGING;
export const ENABLE_NOTIFICATIONS = env.ENABLE_NOTIFICATIONS;
export const DEBUG_MODE = env.DEBUG_MODE;

// Re-export constants
export const {
  STORAGE_KEYS,
  ROUTES,
  VALIDATION,
  USER_ROLES,
  JOB_TYPES,
  WORKER_STRENGTHS,
  MESSAGE_TYPES,
  PAGINATION,
  TIMEOUTS,
  COLORS,
  ITEMS_PER_PAGE,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  MAX_ATTACHMENTS,
  WORKER_CATEGORIES,
  JOB_STATUS,       
  REVIEW_STRENGTHS
} = constants;

// Export everything as a default export that combines all values
const config = {
  ...env,
  ...constants,
  API_BASE_URL,
  WS_URL,
  USE_MOCK_DATA
};

export default config;