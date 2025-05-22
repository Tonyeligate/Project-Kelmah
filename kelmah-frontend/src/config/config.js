/**
 * Configuration values for the application
 */

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

// Authentication configuration
export const JWT_LOCAL_STORAGE_KEY = 'kelmah_auth_token';
export const JWT_REFRESH_KEY = 'kelmah_refresh_token';
export const AUTH_USER_KEY = 'kelmah_user';

// File upload configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
export const DEFAULT_PAGE_SIZE = 10;
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