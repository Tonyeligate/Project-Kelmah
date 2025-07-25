/**
 * Microservices Configuration
 * 
 * This file contains the URLs for all backend microservices.
 * In development, these go through Vite proxy.
 * In production, these point directly to Render services.
 */

const isDevelopment = import.meta.env.MODE === 'development';

// Production URLs (Render services)
const PRODUCTION_SERVICES = {
  AUTH_SERVICE: 'https://kelmah-auth-service.onrender.com',
  USER_SERVICE: 'https://kelmah-user-service.onrender.com', 
  JOB_SERVICE: 'https://kelmah-job-service.onrender.com',
  MESSAGING_SERVICE: 'https://kelmah-messaging-service.onrender.com',
  PAYMENT_SERVICE: 'https://kelmah-payment-service.onrender.com'
};

// Development URLs (through Vite proxy)
const DEVELOPMENT_SERVICES = {
  AUTH_SERVICE: '',                   // Uses main /api proxy to auth service
  USER_SERVICE: '',                   // Uses /api/users proxy to user service  
  JOB_SERVICE: '',                    // Uses /api/jobs proxy to job service
  MESSAGING_SERVICE: '',              // Uses /api/messages proxy to messaging service
  PAYMENT_SERVICE: ''                 // Uses /api/payments proxy to payment service
};

// Select services based on environment
const SERVICES = isDevelopment ? DEVELOPMENT_SERVICES : PRODUCTION_SERVICES;

// Base API paths for each service
const getServicePath = (service, path) => {
  if (isDevelopment) {
    // Development: use proxy paths
    switch (service) {
      case 'AUTH_SERVICE': return `/api${path}`;
      case 'USER_SERVICE': return `/api/users${path}`;
      case 'JOB_SERVICE': return `/api/jobs${path}`;
      case 'MESSAGING_SERVICE': return `/api/messages${path}`;
      case 'PAYMENT_SERVICE': return `/api/payments${path}`;
      default: return `/api${path}`;
    }
  } else {
    // Production: direct service URLs
    return `${SERVICES[service]}/api${path}`;
  }
};

// API endpoints for each service
export const API_ENDPOINTS = {
  // Auth Service
  AUTH: {
    BASE: getServicePath('AUTH_SERVICE', ''),
    REGISTER: getServicePath('AUTH_SERVICE', '/auth/register'),
    LOGIN: getServicePath('AUTH_SERVICE', '/auth/login'),
    VERIFY: getServicePath('AUTH_SERVICE', '/auth/verify'),
    REFRESH: getServicePath('AUTH_SERVICE', '/auth/refresh-token'),
    LOGOUT: getServicePath('AUTH_SERVICE', '/auth/logout'),
    FORGOT_PASSWORD: getServicePath('AUTH_SERVICE', '/auth/forgot-password'),
    RESET_PASSWORD: getServicePath('AUTH_SERVICE', '/auth/reset-password')
  },
  
  // User Service  
  USER: {
    BASE: getServicePath('USER_SERVICE', ''),
    PROFILE: getServicePath('USER_SERVICE', '/profile'),
    UPDATE: getServicePath('USER_SERVICE', '/profile/update'),
    DELETE: getServicePath('USER_SERVICE', '/profile/delete'),
    LIST: getServicePath('USER_SERVICE', '/users')
  },
  
  // Job Service
  JOB: {
    BASE: getServicePath('JOB_SERVICE', ''),
    LIST: getServicePath('JOB_SERVICE', '/jobs'),
    CREATE: getServicePath('JOB_SERVICE', '/jobs'),
    UPDATE: getServicePath('JOB_SERVICE', '/jobs'),
    DELETE: getServicePath('JOB_SERVICE', '/jobs'),
    APPLY: getServicePath('JOB_SERVICE', '/jobs/apply'),
    BY_ID: (id) => getServicePath('JOB_SERVICE', `/jobs/${id}`)
  },
  
  // Messaging Service
  MESSAGING: {
    BASE: getServicePath('MESSAGING_SERVICE', ''),
    CONVERSATIONS: getServicePath('MESSAGING_SERVICE', '/conversations'),
    MESSAGES: getServicePath('MESSAGING_SERVICE', '/messages'),
    SEND: getServicePath('MESSAGING_SERVICE', '/messages/send')
  },
  
  // Payment Service
  PAYMENT: {
    BASE: getServicePath('PAYMENT_SERVICE', ''),
    METHODS: getServicePath('PAYMENT_SERVICE', '/payments/methods'),
    PROCESS: getServicePath('PAYMENT_SERVICE', '/payments/process'),
    HISTORY: getServicePath('PAYMENT_SERVICE', '/payments/history'),
    WEBHOOKS: getServicePath('PAYMENT_SERVICE', '/payments/webhooks')
  }
};

// Debugging helper
if (isDevelopment) {
  console.log('🔧 Development Mode - API Endpoints:', {
    AUTH_REGISTER: API_ENDPOINTS.AUTH.REGISTER,
    JOBS_LIST: API_ENDPOINTS.JOB.LIST,
    MESSAGES_CONVERSATIONS: API_ENDPOINTS.MESSAGING.CONVERSATIONS,
    PAYMENTS_METHODS: API_ENDPOINTS.PAYMENT.METHODS
  });
}

export default SERVICES; 