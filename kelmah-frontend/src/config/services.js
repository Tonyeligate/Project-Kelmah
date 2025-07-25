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
  AUTH_SERVICE: '/api',           // Proxied to auth service
  USER_SERVICE: '/api/users',     // Proxied to user service  
  JOB_SERVICE: '/api/jobs',       // Proxied to job service
  MESSAGING_SERVICE: '/api/messages', // Proxied to messaging service
  PAYMENT_SERVICE: '/api/payments'    // Proxied to payment service
};

// Select services based on environment
const SERVICES = isDevelopment ? DEVELOPMENT_SERVICES : PRODUCTION_SERVICES;

// API endpoints for each service
export const API_ENDPOINTS = {
  // Auth Service
  AUTH: {
    BASE: SERVICES.AUTH_SERVICE,
    REGISTER: `${SERVICES.AUTH_SERVICE}/api/auth/register`,
    LOGIN: `${SERVICES.AUTH_SERVICE}/api/auth/login`,
    VERIFY: `${SERVICES.AUTH_SERVICE}/api/auth/verify`,
    REFRESH: `${SERVICES.AUTH_SERVICE}/api/auth/refresh-token`,
    LOGOUT: `${SERVICES.AUTH_SERVICE}/api/auth/logout`,
    FORGOT_PASSWORD: `${SERVICES.AUTH_SERVICE}/api/auth/forgot-password`,
    RESET_PASSWORD: `${SERVICES.AUTH_SERVICE}/api/auth/reset-password`
  },
  
  // User Service  
  USER: {
    BASE: SERVICES.USER_SERVICE,
    PROFILE: `${SERVICES.USER_SERVICE}/api/users/profile`,
    UPDATE: `${SERVICES.USER_SERVICE}/api/users/update`,
    DELETE: `${SERVICES.USER_SERVICE}/api/users/delete`
  },
  
  // Job Service
  JOB: {
    BASE: SERVICES.JOB_SERVICE,
    LIST: `${SERVICES.JOB_SERVICE}/api/jobs`,
    CREATE: `${SERVICES.JOB_SERVICE}/api/jobs/create`,
    UPDATE: `${SERVICES.JOB_SERVICE}/api/jobs/update`,
    DELETE: `${SERVICES.JOB_SERVICE}/api/jobs/delete`,
    APPLY: `${SERVICES.JOB_SERVICE}/api/jobs/apply`
  },
  
  // Messaging Service
  MESSAGING: {
    BASE: SERVICES.MESSAGING_SERVICE,
    CONVERSATIONS: `${SERVICES.MESSAGING_SERVICE}/api/conversations`,
    MESSAGES: `${SERVICES.MESSAGING_SERVICE}/api/messages`,
    SEND: `${SERVICES.MESSAGING_SERVICE}/api/messages/send`
  },
  
  // Payment Service
  PAYMENT: {
    BASE: SERVICES.PAYMENT_SERVICE,
    PROCESS: `${SERVICES.PAYMENT_SERVICE}/api/payments/process`,
    HISTORY: `${SERVICES.PAYMENT_SERVICE}/api/payments/history`,
    WEBHOOKS: `${SERVICES.PAYMENT_SERVICE}/api/payments/webhooks`
  }
};

export default SERVICES; 