/**
 * Service Health Check Utility
 * 
 * Proactively checks service health and warms up cold services
 * to improve user experience with Render free tier services.
 */

import { SERVICES, getApiBaseUrl } from '../config/environment';

// Service health status cache
const serviceHealthCache = new Map();
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Health check endpoints - Standardize to /api/health for consistency
const HEALTH_ENDPOINTS = {
  [SERVICES.AUTH_SERVICE]: '/api/health',
  [SERVICES.USER_SERVICE]: '/api/health', 
  [SERVICES.JOB_SERVICE]: '/api/health',
  [SERVICES.MESSAGING_SERVICE]: '/api/health',
  [SERVICES.PAYMENT_SERVICE]: '/api/health',
};

/**
 * Check if a service is healthy
 */
export const checkServiceHealth = async (serviceUrl, timeout = 10000) => {
  const healthEndpoint = HEALTH_ENDPOINTS[serviceUrl] || '/api/health'; // Default to /api/health
  
  let base;
  
  // Special handling for aggregate health check - should go to API Gateway
  const isAggregateCheck = serviceUrl === 'aggregate';
  if (isAggregateCheck) {
    try {
      base = await getApiBaseUrl(); // This should point to API Gateway
    } catch (error) {
      console.warn('Failed to get API base URL for aggregate check, using fallback:', error);
      base = '/api';
    }
  } else {
    // For other services, prefer gateway-relative health checks to avoid mixed-content on HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      base = '/api';
    } else if (serviceUrl) {
      base = serviceUrl;
    } else {
      try {
        base = await getApiBaseUrl();
      } catch (error) {
        console.warn('Failed to get API base URL, using fallback:', error);
        base = '/api';
      }
    }
  }

  // For aggregate health check, use the correct endpoint
  const fullUrl = isAggregateCheck ? `${base}/health/aggregate` : `${base}${healthEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(fullUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    const responseTime = Date.now();

    // Cache the result
    serviceHealthCache.set(serviceUrl, {
      isHealthy,
      lastChecked: responseTime,
      responseTime: response.headers.get('x-response-time') || 'unknown',
      status: response.status,
    });

    console.log(`🏥 Service Health Check - ${serviceUrl}:`, {
      healthy: isHealthy,
      status: response.status,
      responseTime: `${Date.now() - responseTime}ms`,
      url: fullUrl
    });

    return isHealthy;
  } catch (error) {
    console.warn(`🏥 Service Health Check Failed - ${serviceUrl}:`, error.message, {
      url: fullUrl,
      timeout: timeout
    });

    // Cache the failed result
    serviceHealthCache.set(serviceUrl, {
      isHealthy: false,
      lastChecked: Date.now(),
      error: error.message,
      status: 'timeout',
    });

    return false;
  }
};

/**
 * Warm up a service by making a simple health check request
 */
export const warmUpService = async (serviceUrl) => {
  console.log(`🔥 Warming up service: ${serviceUrl || 'gateway'}`);
  
  try {
    // Warm up via gateway health to avoid mixed content and ensure path exists
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log(`🔥 Service warmed up - ${serviceUrl || 'gateway'}: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn(`🔥 Service warmup failed - ${serviceUrl || 'gateway'}:`, error.message);
    return false;
  }
};

/**
 * Warm up all services proactively
 */
export const warmUpAllServices = async () => {
  console.log('🔥 Starting service warmup...');

  const services = Object.values(SERVICES);
  const warmupPromises = services.map(service => {
    // Don't wait for each service, warm them up in parallel
    return warmUpService(service).catch(error => {
      console.warn(`Warmup failed for ${service}:`, error);
      return false;
    });
  });

  try {
    // Also warm up aggregate health once via gateway
    warmupPromises.push(
      checkServiceHealth('aggregate', 15000).catch(error => {
        console.warn('Aggregate health check failed:', error);
        return false;
      })
    );

    const results = await Promise.allSettled(warmupPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    console.log(`🔥 Service warmup complete: ${successCount}/${services.length + 1} services responding`);
    return results;
  } catch (error) {
    console.error('Service warmup error:', error);
    return [];
  }
};

/**
 * Get cached service health status
 */
export const getServiceHealth = (serviceUrl) => {
  return serviceHealthCache.get(serviceUrl);
};

/**
 * Check if a service was recently checked and is healthy
 */
export const isServiceRecentlyHealthy = (serviceUrl, maxAgeMs = HEALTH_CHECK_INTERVAL) => {
  const health = getServiceHealth(serviceUrl);
  if (!health) return false;
  
  const age = Date.now() - health.lastChecked;
  return health.isHealthy && age < maxAgeMs;
};

/**
 * Get user-friendly status message for service health
 */
export const getServiceStatusMessage = (serviceUrl) => {
  const health = getServiceHealth(serviceUrl);
  
  if (!health) {
    return {
      status: 'unknown',
      message: 'Service status unknown',
      action: 'Checking service availability...',
    };
  }
  
  if (health.isHealthy) {
    return {
      status: 'healthy',
      message: 'Service is responding normally',
      action: 'Loading data...',
    };
  }
  
  if (health.error?.includes('timeout')) {
    return {
      status: 'cold',
      message: 'Service is starting up (cold start)',
      action: 'Please wait 30-60 seconds while the service wakes up...',
    };
  }
  
  return {
    status: 'error', 
    message: 'Service is currently unavailable',
    action: 'Using cached data. Please try again in a few minutes.',
  };
};

/**
 * Initialize service health monitoring
 */
export const initializeServiceHealth = () => {
  console.log('🏥 Initializing service health monitoring...');
  
  // Warm up services immediately
  warmUpAllServices();
  
  // Set up periodic health checks
  setInterval(() => {
    console.log('🏥 Running periodic service health checks...');
    Object.values(SERVICES).forEach(service => {
      checkServiceHealth(service);
    });
  }, HEALTH_CHECK_INTERVAL);
  
  // Warm up services on page focus (user returns)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('🏥 Page focused - warming up services...');
      warmUpAllServices();
    }
  });
};

/**
 * Enhanced error handler that provides context about service health
 */
export const handleServiceError = (error, serviceUrl) => {
  const health = getServiceHealth(serviceUrl);
  const statusMsg = getServiceStatusMessage(serviceUrl);
  
  console.error(`🚨 Service Error - ${serviceUrl}:`, {
    error: error.message,
    health,
    statusMessage: statusMsg,
  });
  
  // If it's a timeout error and service might be cold starting, provide helpful context
  if (error.message?.includes('timeout') && statusMsg.status === 'cold') {
    return {
      ...error,
      userMessage: 'Service is starting up. This may take up to 60 seconds on first load.',
      suggestedAction: 'Please wait and try again in a moment.',
      isRecoverable: true,
    };
  }
  
  return {
    ...error,
    userMessage: statusMsg.message,
    suggestedAction: statusMsg.action,
    isRecoverable: statusMsg.status !== 'error',
  };
};

// Export service health cache for debugging
export const debugServiceHealth = () => {
  console.table(Array.from(serviceHealthCache.entries()).map(([url, health]) => ({
    Service: url.split('.')[0].split('//')[1], // Extract service name
    Status: health.isHealthy ? '✅ Healthy' : '❌ Down',
    'Last Checked': new Date(health.lastChecked).toLocaleTimeString(),
    'Response Time': health.responseTime || 'N/A',
  })));
};

// Initialize on module load in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  initializeServiceHealth();
}
