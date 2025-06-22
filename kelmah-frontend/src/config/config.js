/**
 * Configuration Constants
 * 
 * Core application configuration constants that are not sensitive to environment changes.
 * These values provide default fallbacks for important configuration settings.
 */

// Authentication keys for local storage - used across the application 
export const JWT_LOCAL_STORAGE_KEY = 'kelmah_auth_token';
export const REFRESH_TOKEN_KEY = 'kelmah_refresh_token';
export const AUTH_USER_KEY = 'kelmah_user';

// API configuration
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const API_BASE_URL = `${baseUrl}/api`;
export const WS_URL = baseUrl;

// Application-level constants
export const APP_NAME = 'Kelmah';
export const APP_VERSION = '1.0.0';

// System-wide constants
export const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_FORMATS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
export const MAX_DESCRIPTION_LENGTH = 1000;

// Default timeout values
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const SOCKET_TIMEOUT = 60000; // 60 seconds

// UI constants
export const ANIMATION_DURATION = 300; // ms
export const TOAST_DURATION = 5000; // 5 seconds
export const DEFAULT_THEME = 'light';

// Navigation constants
export const HOME_ROUTE = '/';
export const DASHBOARD_ROUTE = '/dashboard';
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';

// File upload configuration
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Feature flags
export const FEATURES = {
  MESSAGING: true,
  NOTIFICATIONS: true,
  CONTRACTS: true,
  PAYMENTS: true,
  REVIEWS: true,
  VIDEO_CALLS: false
};

// Default pagination
export const DEFAULT_PAGE = 1;

// Date format options
export const DATE_FORMAT = 'MMM dd, yyyy';
export const TIME_FORMAT = 'hh:mm a';
export const DATETIME_FORMAT = 'MMM dd, yyyy hh:mm a';

// Timeout durations
export const API_TIMEOUT = 30000; // 30 seconds
export const WEBSOCKET_RECONNECT_INTERVAL = 5000; // 5 seconds
export const WEBSOCKET_MAX_RECONNECT_ATTEMPTS = 5;

// Contract service configuration
export const CONTRACT_API_URL = `${API_BASE_URL}/contracts`;

// Notification service configuration 
export const NOTIFICATION_API_URL = `${API_BASE_URL}/notifications`;

// Messaging service configuration
export const MESSAGING_API_URL = `${API_BASE_URL}/messaging`;
export const MESSAGING_WS_NAMESPACE = 'messaging';

// User service configuration
export const USER_API_URL = `${API_BASE_URL}/users`;

// Job service configuration
export const JOB_API_URL = `${API_BASE_URL}/jobs`;

// Payment service configuration
export const PAYMENT_API_URL = `${API_BASE_URL}/payments`; 