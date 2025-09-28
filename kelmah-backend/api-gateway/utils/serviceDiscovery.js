/**
 * Intelligent Service Discovery System
 * Automatically resolves service URLs based on environment (local vs cloud)
 * Supports both localhost ports and Render/cloud URLs
 */

const axios = require('axios');

/**
 * Environment Detection
 * Determines if we're running locally or in production/cloud
 */
const detectEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV;
  const hostname = require('os').hostname();
  const isLocalhost = hostname.includes('localhost') || hostname.includes('DESKTOP') || hostname.includes('LAPTOP');
  const hasRenderEnv = process.env.RENDER || process.env.RENDER_SERVICE_ID;
  const hasRailwayEnv = process.env.RAILWAY_ENVIRONMENT;
  const hasVercelEnv = process.env.VERCEL;

  // Production indicators
  if (nodeEnv === 'production' || hasRenderEnv || hasRailwayEnv || hasVercelEnv) {
    return 'production';
  }

  // Local development indicators
  if (nodeEnv === 'development' || isLocalhost || !process.env.CLOUD_SERVICE_URLS) {
    return 'development';
  }

  return 'development'; // Default to development
};

/**
 * Service Configuration
 * Defines both local and cloud URLs for each service
 */
const SERVICE_CONFIG = {
  auth: {
    local: 'http://localhost:5001',
    cloud: process.env.AUTH_SERVICE_CLOUD_URL,
    name: 'Auth Service'
  },
  user: {
    local: 'http://localhost:5002',
    cloud: process.env.USER_SERVICE_CLOUD_URL,
    name: 'User Service'
  },
  job: {
    local: 'http://localhost:5003',
    cloud: process.env.JOB_SERVICE_CLOUD_URL,
    name: 'Job Service'
  },
  payment: {
    local: 'http://localhost:5004',
    cloud: process.env.PAYMENT_SERVICE_CLOUD_URL,
    name: 'Payment Service'
  },
  messaging: {
    local: 'http://localhost:5005',
    cloud: process.env.MESSAGING_SERVICE_CLOUD_URL,
    name: 'Messaging Service'
  },
  review: {
    local: 'http://localhost:5006',
    cloud: process.env.REVIEW_SERVICE_CLOUD_URL,
    name: 'Review Service'
  }
};

/**
 * Health Check Function
 * Tests if a service URL is reachable
 */
const checkServiceHealth = async (url, timeout = 3000) => {
  try {
    const response = await axios.get(`${url}/health`, {
      timeout,
      headers: {
        'User-Agent': 'API-Gateway-Service-Discovery/1.0'
      }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Resolve Service URL
 * Intelligently chooses between local and cloud URLs
 */
const resolveServiceUrl = async (serviceName) => {
  const config = SERVICE_CONFIG[serviceName];
  if (!config) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const environment = detectEnvironment();
  console.log(`🔍 Service Discovery: ${config.name} - Environment: ${environment}`);

  // Environment-specific URL selection
  let primaryUrl, fallbackUrl;

  if (environment === 'production') {
    // In production, prefer cloud URLs, fallback to local
    primaryUrl = config.cloud || config.local;
    fallbackUrl = config.local;
  } else {
    // In development, prefer local URLs, fallback to cloud
    primaryUrl = config.local;
    fallbackUrl = config.cloud;
  }

  // Manual override via environment variables (highest priority)
  const manualUrl = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
  if (manualUrl) {
    console.log(`🔧 Manual override for ${config.name}: ${manualUrl}`);
    return manualUrl;
  }

  // Test primary URL
  console.log(`🩺 Testing ${config.name} primary URL: ${primaryUrl}`);
  const primaryHealthy = await checkServiceHealth(primaryUrl);

  if (primaryHealthy) {
    console.log(`✅ ${config.name} using primary URL: ${primaryUrl}`);
    return primaryUrl;
  }

  // If primary fails and we have a fallback, test it
  if (fallbackUrl) {
    console.log(`🩺 Testing ${config.name} fallback URL: ${fallbackUrl}`);
    const fallbackHealthy = await checkServiceHealth(fallbackUrl);

    if (fallbackHealthy) {
      console.log(`⚠️ ${config.name} using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  // If both fail, return primary URL anyway (let it fail at runtime)
  console.log(`❌ ${config.name} no healthy URLs found, using primary: ${primaryUrl}`);
  return primaryUrl;
};

/**
 * Initialize Service Registry
 * Resolves all service URLs on startup
 */
const initializeServiceRegistry = async () => {
  console.log('🚀 Initializing Intelligent Service Discovery...');

  const services = {};
  const serviceNames = Object.keys(SERVICE_CONFIG);

  // Resolve all service URLs concurrently
  const resolutionPromises = serviceNames.map(async (serviceName) => {
    try {
      const url = await resolveServiceUrl(serviceName);
      services[serviceName] = url;
      return { serviceName, url, success: true };
    } catch (error) {
      console.error(`❌ Failed to resolve ${serviceName}:`, error.message);
      // Use local fallback
      services[serviceName] = SERVICE_CONFIG[serviceName].local;
      return { serviceName, url: services[serviceName], success: false, error: error.message };
    }
  });

  const results = await Promise.all(resolutionPromises);

  // Log results
  console.log('📋 Service Discovery Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${SERVICE_CONFIG[result.serviceName].name}: ${result.url}`);
  });

  return services;
};

/**
 * Get Service URLs for Express App
 * Returns the resolved URLs in the format expected by the app
 */
const getServiceUrlsForApp = (services) => ({
  AUTH_SERVICE: services.auth,
  USER_SERVICE: services.user,
  JOB_SERVICE: services.job,
  PAYMENT_SERVICE: services.payment,
  MESSAGING_SERVICE: services.messaging,
  REVIEW_SERVICE: services.review,
});

/**
 * Dynamic Service URL Resolver
 * For runtime URL resolution (useful for load balancing, etc.)
 */
const getServiceUrl = (serviceName) => {
  const config = SERVICE_CONFIG[serviceName];
  if (!config) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  // Check for manual override first
  const manualUrl = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
  if (manualUrl) {
    return manualUrl;
  }

  const environment = detectEnvironment();
  return environment === 'production' ? (config.cloud || config.local) : config.local;
};

module.exports = {
  detectEnvironment,
  initializeServiceRegistry,
  getServiceUrlsForApp,
  getServiceUrl,
  checkServiceHealth,
  SERVICE_CONFIG
};