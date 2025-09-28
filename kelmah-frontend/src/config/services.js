/**
 * Microservices Configuration
 *
 * This file contains the URLs for all backend microservices.
 * In development, these go through Vite proxy.
 * In production, these point directly to Render services.
 */

const isDevelopment = import.meta.env.MODE === 'development';

// Production URLs: by default route via API Gateway (relative '/api').
// These can be overridden via VITE_*_URL if you need to target a specific service directly.
const PRODUCTION_SERVICES = {
  AUTH_SERVICE: '',
  USER_SERVICE: '',
  JOB_SERVICE: '',
  MESSAGING_SERVICE: '',
  PAYMENT_SERVICE: '',
  REVIEW_SERVICE: '',
};

// Development URLs (localhost services)
const DEVELOPMENT_SERVICES = {
  AUTH_SERVICE: 'http://localhost:5001',
  USER_SERVICE: 'http://localhost:5002',
  JOB_SERVICE: 'http://localhost:5003',
  MESSAGING_SERVICE: 'http://localhost:5004',
  PAYMENT_SERVICE: 'http://localhost:5005',
  REVIEW_SERVICE: 'http://localhost:5006',
};

// Select services based on environment
const SERVICES = isDevelopment ? DEVELOPMENT_SERVICES : PRODUCTION_SERVICES;

// WebSocket URL helper
const getWebSocketUrl = (service) => {
  if (isDevelopment) {
    // Development: convert HTTP URLs to WebSocket URLs
    const httpUrl = SERVICES[service];
    if (httpUrl) {
      return httpUrl.replace(/^http/, 'ws');
    }
    return null;
  } else {
    // Production: WebSocket connections go through the API gateway
    return null; // Will use relative WebSocket URL or Socket.IO default
  }
};

// Base API paths for each service
const getServicePath = (service, path) => {
  if (isDevelopment) {
    // Development: use proxy paths
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
      default:
        return `/api${path}`;
    }
  } else {
    // Production: if a direct service URL is provided via env override, use it; otherwise go through gateway
    const direct = SERVICES[service];
    if (direct && /^https?:\/\//.test(direct)) {
      return `${direct}${path}`;
    }
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
    MARKER_ICON_RETINA: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    MARKER_ICON: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    MARKER_SHADOW: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  },
  GOOGLE_MAPS: {
    EMBED: 'https://maps.google.com/maps',
    SEARCH: 'https://www.google.com/maps/search/',
  },
  ARCGIS: {
    WORLD_IMAGERY: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
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
