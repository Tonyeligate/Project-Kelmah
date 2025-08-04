/**
 * API Configuration
 * Centralizes all API endpoints and configurations
 */

// Base API configuration
const API_CONFIG = {
  // Base URL - always use API Gateway
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  
  // Timeout settings
  TIMEOUT: 30000, // 30 seconds
  
  // Retry settings
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Development settings
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // WebSocket configuration
  WEBSOCKET_URL: process.env.REACT_APP_WS_URL || 'http://localhost:3000',
  
  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// API Endpoints - All routes through API Gateway
const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    MFA_SETUP: '/api/auth/mfa/setup',
    MFA_VERIFY: '/api/auth/mfa/verify',
    PROFILE: '/api/auth/profile'
  },

  // Users
  USERS: {
    BASE: '/api/users',
    PROFILE: (userId) => `/api/users/${userId}/profile`,
    UPDATE: (userId) => `/api/users/${userId}`,
    DELETE: (userId) => `/api/users/${userId}`,
    AVATAR: (userId) => `/api/users/${userId}/avatar`,
    PREFERENCES: (userId) => `/api/users/${userId}/preferences`
  },

  // Workers
  WORKERS: {
    BASE: '/api/workers',
    PROFILE: (workerId) => `/api/workers/${workerId}`,
    SEARCH: '/api/workers/search',
    FEATURED: '/api/workers/featured',
    SKILLS: (workerId) => `/api/workers/${workerId}/skills`,
    PORTFOLIO: (workerId) => `/api/workers/${workerId}/portfolio`,
    REVIEWS: (workerId) => `/api/workers/${workerId}/reviews`,
    AVAILABILITY: (workerId) => `/api/workers/${workerId}/availability`,
    RATINGS: (workerId) => `/api/workers/${workerId}/ratings`
  },

  // Jobs
  JOBS: {
    BASE: '/api/jobs',
    SEARCH: '/api/jobs/search',
    FEATURED: '/api/jobs/featured',
    BY_ID: (jobId) => `/api/jobs/${jobId}`,
    APPLICATIONS: (jobId) => `/api/jobs/${jobId}/applications`,
    APPLY: (jobId) => `/api/jobs/${jobId}/apply`,
    CATEGORIES: '/api/jobs/categories',
    LOCATIONS: '/api/jobs/locations'
  },

  // Job Applications
  APPLICATIONS: {
    BASE: '/api/jobs/applications',
    BY_ID: (applicationId) => `/api/jobs/applications/${applicationId}`,
    UPDATE_STATUS: (applicationId) => `/api/jobs/applications/${applicationId}/status`,
    MY_APPLICATIONS: '/api/jobs/applications/my-applications'
  },

  // Payments
  PAYMENTS: {
    BASE: '/api/payments',
    INITIALIZE: '/api/payments/initialize',
    VERIFY: (paymentId) => `/api/payments/${paymentId}/verify`,
    STATUS: (paymentId) => `/api/payments/${paymentId}/status`,
    HISTORY: '/api/payments/history',
    METHODS: '/api/payments/methods',
    PAYOUT: '/api/payments/payout',
    WALLET: '/api/payments/wallet',
    TRANSACTIONS: '/api/payments/transactions'
  },

  // Messaging
  MESSAGES: {
    BASE: '/api/messages',
    CONVERSATIONS: '/api/conversations',
    CONVERSATION: (conversationId) => `/api/conversations/${conversationId}`,
    SEND: '/api/messages/send',
    MARK_READ: (messageId) => `/api/messages/${messageId}/read`,
    SEARCH: '/api/messages/search',
    FILES: '/api/messages/files'
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (notificationId) => `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    PREFERENCES: '/api/notifications/preferences',
    SUBSCRIBE: '/api/notifications/subscribe',
    UNSUBSCRIBE: '/api/notifications/unsubscribe'
  },

  // Search
  SEARCH: {
    WORKERS: '/api/search/workers',
    JOBS: '/api/search/jobs',
    LOCATION: '/api/search/location',
    SUGGESTIONS: '/api/search/suggestions',
    FILTERS: '/api/search/filters'
  },

  // File Uploads
  UPLOADS: {
    AVATAR: '/api/upload/avatar',
    PORTFOLIO: '/api/upload/portfolio',
    DOCUMENTS: '/api/upload/documents',
    CHAT_FILES: '/api/upload/chat-files'
  },

  // Admin (when user is admin)
  ADMIN: {
    BASE: '/api/admin',
    USERS: '/api/admin/users',
    JOBS: '/api/admin/jobs',
    PAYMENTS: '/api/admin/payments',
    REPORTS: '/api/admin/reports',
    SETTINGS: '/api/admin/settings'
  },

  // Health & Status
  HEALTH: '/health',
  DOCS: '/api/docs'
};

// Service status endpoints (for debugging)
const SERVICE_ENDPOINTS = {
  AUTH_SERVICE: 'http://localhost:3001/health',
  USER_SERVICE: 'http://localhost:3002/health',
  JOB_SERVICE: 'http://localhost:3003/health',
  PAYMENT_SERVICE: 'http://localhost:3004/health',
  MESSAGING_SERVICE: 'http://localhost:3005/health',
  API_GATEWAY: 'http://localhost:3000/health'
};

// Error messages
const API_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid file.'
};

// Request headers
const getDefaultHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

// Build full URL
const buildUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Add query parameters
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};

// Pagination helper
const buildPaginationParams = (page = 1, limit = API_CONFIG.DEFAULT_PAGE_SIZE, additionalParams = {}) => {
  return {
    page: Math.max(1, parseInt(page)),
    limit: Math.min(API_CONFIG.MAX_PAGE_SIZE, Math.max(1, parseInt(limit))),
    ...additionalParams
  };
};

// Environment-specific configurations
const ENV_CONFIG = {
  development: {
    enableDebugLogs: true,
    enableMockData: false,
    showServiceStatus: true
  },
  production: {
    enableDebugLogs: false,
    enableMockData: false,
    showServiceStatus: false
  },
  test: {
    enableDebugLogs: false,
    enableMockData: true,
    showServiceStatus: false
  }
};

const currentEnvConfig = ENV_CONFIG[process.env.NODE_ENV] || ENV_CONFIG.development;

export {
  API_CONFIG,
  API_ENDPOINTS,
  SERVICE_ENDPOINTS,
  API_ERRORS,
  getDefaultHeaders,
  buildUrl,
  buildPaginationParams,
  currentEnvConfig
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  SERVICE_ENDPOINTS,
  API_ERRORS,
  getDefaultHeaders,
  buildUrl,
  buildPaginationParams,
  currentEnvConfig
};