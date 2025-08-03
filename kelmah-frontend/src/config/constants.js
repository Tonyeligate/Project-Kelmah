// Environment-based configuration
const ENV = process.env.NODE_ENV || 'development';
const isDevelopment = ENV === 'development';

// API URLs for different environments
const API_URLS = {
  development: '', // Use empty string to leverage Vite proxy configuration
  test: 'http://localhost:5000',
  production: process.env.VITE_API_URL || 'https://api.kelmah.com',
};

// Determine API_BASE_URL: use VITE_API_URL if provided, otherwise fallback to environment-specific defaults
export const API_BASE_URL = process.env.VITE_API_URL || API_URLS[ENV];
export const API_URL = API_BASE_URL;
export const SOCKET_URL = isDevelopment
  ? 'http://localhost:3003'
  : process.env.VITE_MESSAGING_URL || API_BASE_URL;
export const APP_NAME = 'Kelmah';

// Authentication related
export const TOKEN_KEY = 'kelmah_auth_token';
export const REFRESH_TOKEN_KEY = 'kelmah_refresh_token';
export const USER_KEY = 'kelmah_user';
export const TOKEN_EXPIRY_KEY = 'kelmah_token_expiry';
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
