// Environment-based configuration
const ENV = import.meta.env.MODE || 'development';
const isDevelopment = ENV === 'development';

// Import centralized services
import { getApiBaseUrl } from './environment';

// API URLs - use centralized configuration instead of hardcoded URLs
const getAPIUrls = async () => {
  try {
    const baseUrl = await getApiBaseUrl();
    return {
      development: baseUrl,
      test: baseUrl,
      production: baseUrl,
    };
  } catch (error) {
    console.warn('Failed to get centralized API URLs:', error);
    return {
      development: '/api',
      test: '/api',
      production: '/api',
    };
  }
};

// Async function to get API base URL
const getAPIBaseUrl = async () => {
  const urls = await getAPIUrls();
  return process.env.VITE_API_URL || import.meta.env.VITE_API_URL || urls[ENV];
};

// Determine API_BASE_URL: use centralized config
export const getAPI_BASE_URL = getAPIBaseUrl;
// Keep API_URL aligned with API_BASE_URL for backward compatibility
export const getAPI_URL = getAPIBaseUrl;

// For backward compatibility (deprecated - use async getters)
export const API_BASE_URL = '/api';
export const API_URL = '/api';

// Socket URL - use centralized messaging service
import { API_ENDPOINTS } from './environment';
export const getSOCKET_URL = async () => {
  try {
    return API_ENDPOINTS.WEBSOCKET.MESSAGING || '/socket.io';
  } catch (error) {
    console.warn('Failed to get socket URL:', error);
    return '/socket.io';
  }
};

// For backward compatibility (deprecated - use async getter)
export const SOCKET_URL = '/socket.io';
export const APP_NAME = 'Kelmah';

// Authentication related
export const TOKEN_KEY = 'kelmah_auth_token';
export const REFRESH_TOKEN_KEY = 'kelmah_refresh_token';
export const USER_KEY = 'kelmah_user';
export const TOKEN_EXPIRY_KEY = 'kelmah_token_expiry';
// Aliases for backward compatibility
export const JWT_LOCAL_STORAGE_KEY = TOKEN_KEY;
export const AUTH_USER_KEY = USER_KEY;
export const AUTH_ROLES = {
  WORKER: 'worker',
  HIRER: 'hirer',
  ADMIN: 'admin',
};

// Local storage keys
export const THEME_KEY = 'kelmah_theme';
export const LANGUAGE_KEY = 'kelmah_language';
export const LAST_ROUTE_KEY = 'kelmah_last_route';

// Job related constants
export const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

// Payment related constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Application related
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under-review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

// Messaging related constants
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  ATTACHMENT: 'attachment',
  SYSTEM: 'system',
};

// File upload and attachment limits
export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
