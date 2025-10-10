/**
 * Microservices Configuration
 *
 * ✅ UPDATED: All requests route through API Gateway (/api) in both development and production
 *
 * The API Gateway handles:
 * - Intelligent service discovery (localhost OR cloud URLs)
 * - Health checks and automatic fallback
 * - Request routing to appropriate microservices
 *
 * No need for hardcoded service URLs in frontend!
 */

const isDevelopment = import.meta.env.MODE === 'development';

// ✅ ALL ENVIRONMENTS: Use API Gateway routing
// In development: /api → localhost:5000 (API Gateway) → localhost:500X (services)
// In production: /api → Vercel rewrite → LocalTunnel → localhost:5000 (API Gateway) → Render services
const SERVICES = {
  AUTH_SERVICE: '/api/auth',
  USER_SERVICE: '/api/users',
  JOB_SERVICE: '/api/jobs',
  MESSAGING_SERVICE: '/api/messaging',
  PAYMENT_SERVICE: '/api/payments',
  REVIEW_SERVICE: '/api/reviews',
};

// WebSocket URL helper - routes through API Gateway
const getWebSocketUrl = (service) => {
  // All WebSocket connections go through the API gateway
  // Socket.IO will automatically handle protocol upgrade
  return null; // Let Socket.IO use default URL (same origin)
};

// Base API paths for each service
const getServicePath = (service, path) => {
  // ✅ All services route through API Gateway
  switch (service) {
    case 'AUTH_SERVICE':
      return `/api/auth${path}`;
    case 'USER_SERVICE':
      return `/api/users${path}`;
    case 'JOB_SERVICE':
      return `/api/jobs${path}`;
    case 'MESSAGING_SERVICE':
      return `/api/messages${path}`;
    case 'PAYMENT_SERVICE':
      return `/api/payments${path}`;
    case 'REVIEW_SERVICE':
      return `/api/reviews${path}`;
    default:
      return `/api${path}`;
  }
};

// External services (third-party APIs)
export const EXTERNAL_SERVICES = {
  IP_GEOLOCATION: 'https://api.ipify.org',
  // Map services
  OPENSTREETMAP: {
    TILES: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    NOMINATIM_REVERSE: 'https://nominatim.openstreetmap.org/reverse',
    NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
  },
  LEAFLET: {
    MARKER_ICON_RETINA:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    MARKER_ICON:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    MARKER_SHADOW:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  },
  GOOGLE_MAPS: {
    EMBED: 'https://maps.google.com/maps',
    SEARCH: 'https://www.google.com/maps/search/',
  },
  ARCGIS: {
    WORLD_IMAGERY:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  CARTODB: {
    DARK_ALL: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  },
  OPENTOPOMAP: {
    TILES: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  },
  // Image services (for demo/placeholder data)
  UNSPLASH: 'https://images.unsplash.com',
  PEXELS: 'https://images.pexels.com',
};

// API endpoints for each service
export const API_ENDPOINTS = {
  // WebSocket URLs
  WEBSOCKET: {
    MESSAGING: getWebSocketUrl('MESSAGING_SERVICE'),
  },

  // Auth Service
  // Auth Service
  AUTH: {
    BASE: getServicePath('AUTH_SERVICE', ''),
    REGISTER: getServicePath('AUTH_SERVICE', '/auth/register'),
    LOGIN: getServicePath('AUTH_SERVICE', '/auth/login'),
    VERIFY: getServicePath('AUTH_SERVICE', '/auth/verify'),
    REFRESH: getServicePath('AUTH_SERVICE', '/auth/refresh-token'),
    LOGOUT: getServicePath('AUTH_SERVICE', '/auth/logout'),
    FORGOT_PASSWORD: getServicePath('AUTH_SERVICE', '/auth/forgot-password'),
    RESET_PASSWORD: getServicePath('AUTH_SERVICE', '/auth/reset-password'),
  },

  // User Service
  USER: {
    BASE: getServicePath('USER_SERVICE', ''),
    PROFILE: getServicePath('USER_SERVICE', '/profile'),
    UPDATE: getServicePath('USER_SERVICE', '/profile/update'),
    DELETE: getServicePath('USER_SERVICE', '/profile/delete'),
    LIST: getServicePath('USER_SERVICE', '/users'),
  },

  // Job Service
  JOB: {
    BASE: getServicePath('JOB_SERVICE', ''),
    LIST: getServicePath('JOB_SERVICE', '/jobs'),
    CREATE: getServicePath('JOB_SERVICE', '/jobs'),
    UPDATE: getServicePath('JOB_SERVICE', '/jobs'),
    DELETE: getServicePath('JOB_SERVICE', '/jobs'),
    APPLY: getServicePath('JOB_SERVICE', '/jobs/apply'),
    BY_ID: (id) => getServicePath('JOB_SERVICE', `/jobs/${id}`),
  },

  // Messaging Service
  MESSAGING: {
    BASE: getServicePath('MESSAGING_SERVICE', ''),
    CONVERSATIONS: getServicePath('MESSAGING_SERVICE', '/conversations'),
    MESSAGES: getServicePath('MESSAGING_SERVICE', '/messages'),
    SEND: getServicePath('MESSAGING_SERVICE', '/messages/send'),
  },

  // Payment Service
  PAYMENT: {
    BASE: getServicePath('PAYMENT_SERVICE', ''),
    METHODS: getServicePath('PAYMENT_SERVICE', '/payments/methods'),
    PROCESS: getServicePath('PAYMENT_SERVICE', '/payments/process'),
    HISTORY: getServicePath('PAYMENT_SERVICE', '/payments/history'),
    WEBHOOKS: getServicePath('PAYMENT_SERVICE', '/payments/webhooks'),
  },
};

// Debugging helper
if (isDevelopment) {
  console.log('🔧 Development Mode - API Endpoints:', {
    AUTH_REGISTER: API_ENDPOINTS.AUTH.REGISTER,
    JOBS_LIST: API_ENDPOINTS.JOB.LIST,
    MESSAGES_CONVERSATIONS: API_ENDPOINTS.MESSAGING.CONVERSATIONS,
    PAYMENTS_METHODS: API_ENDPOINTS.PAYMENT.METHODS,
  });
}

export default SERVICES;
