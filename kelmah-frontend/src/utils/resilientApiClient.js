/**
 * Resilient API Client
 * 
 * Enhanced API client with intelligent retry, circuit breaker,
 * service health awareness, and graceful degradation for production services.
 */

import axios from 'axios';
import { SERVICES, PERFORMANCE_CONFIG, LOG_CONFIG } from '../config/environment';
import { secureStorage } from './secureStorage';
import { 
  checkServiceHealth, 
  isServiceRecentlyHealthy, 
  getServiceStatusMessage,
  handleServiceError 
} from './serviceHealthCheck';

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',     // Normal operation
  OPEN: 'OPEN',         // Failing, block requests
  HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

// Circuit breaker tracking
const circuitBreakers = new Map();

// Request queue for failed requests
const retryQueue = new Map();

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  constructor(serviceUrl, options = {}) {
    this.serviceUrl = serviceUrl;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 120000; // 2 minutes
    
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  canExecute() {
    if (this.state === CIRCUIT_STATES.CLOSED) {
      return true;
    }

    if (this.state === CIRCUIT_STATES.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        console.log(`🔄 Circuit breaker HALF_OPEN for ${this.serviceUrl}`);
        return true;
      }
      return false;
    }

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      return true;
    }

    return false;
  }

  onSuccess() {
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.state = CIRCUIT_STATES.CLOSED;
      this.failureCount = 0;
      console.log(`✅ Circuit breaker CLOSED for ${this.serviceUrl} - service recovered`);
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CIRCUIT_STATES.OPEN;
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      console.warn(`🚨 Circuit breaker OPEN for ${this.serviceUrl} - blocking requests for ${this.recoveryTimeout}ms`);
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      canExecute: this.canExecute(),
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

/**
 * Get or create circuit breaker for service
 */
const getCircuitBreaker = (serviceUrl) => {
  if (!circuitBreakers.has(serviceUrl)) {
    circuitBreakers.set(serviceUrl, new CircuitBreaker(serviceUrl));
  }
  return circuitBreakers.get(serviceUrl);
};

/**
 * Enhanced retry configuration based on error type and service health
 */
const getRetryConfig = (error, serviceUrl) => {
  const health = getServiceStatusMessage(serviceUrl);
  
  // Don't retry client errors (4xx) except 401, 408, 429
  if (error.response?.status >= 400 && error.response?.status < 500) {
    const retryableClientErrors = [401, 408, 429];
    if (!retryableClientErrors.includes(error.response.status)) {
      return { shouldRetry: false, delay: 0, maxRetries: 0 };
    }
  }

  // Cold start detection - longer delays and more retries
  if (health.status === 'cold' || error.code === 'ECONNABORTED' || !error.response) {
    return {
      shouldRetry: true,
      delay: 5000, // 5 seconds for cold starts
      maxRetries: 6, // Up to 30 seconds total
      backoffMultiplier: 1.5,
    };
  }

  // Network errors or 5xx errors
  if (error.response?.status >= 500 || !error.response) {
    return {
      shouldRetry: true,
      delay: 2000, // 2 seconds
      maxRetries: 3,
      backoffMultiplier: 2,
    };
  }

  // Rate limiting
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    return {
      shouldRetry: true,
      delay: retryAfter ? parseInt(retryAfter) * 1000 : 5000,
      maxRetries: 2,
      backoffMultiplier: 1,
    };
  }

  return { shouldRetry: false, delay: 0, maxRetries: 0 };
};

/**
 * Enhanced axios client with intelligent retry and circuit breaker
 */
const createResilientClient = (baseURL, options = {}) => {
  const client = axios.create({
    baseURL,
    timeout: PERFORMANCE_CONFIG.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config) => {
      // Check circuit breaker
      const circuitBreaker = getCircuitBreaker(baseURL);
      if (!circuitBreaker.canExecute()) {
        const error = new Error(`Service temporarily unavailable (Circuit Breaker OPEN)`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        error.serviceUrl = baseURL;
        throw error;
      }

      // Add auth token
      const token = secureStorage.getAuthToken();
      if (token && !config.url?.includes('/login') && !config.url?.includes('/register')) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request metadata
      config.metadata = { 
        startTime: Date.now(),
        retryCount: config.retryCount || 0,
        serviceUrl: baseURL,
      };

      if (LOG_CONFIG.enableConsole) {
        console.log(`🔄 API Request [${config.metadata.retryCount ? `Retry ${config.metadata.retryCount}` : 'Initial'}]:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor with intelligent retry
  client.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      const circuitBreaker = getCircuitBreaker(baseURL);
      
      // Mark circuit breaker success
      circuitBreaker.onSuccess();

      if (LOG_CONFIG.enableConsole) {
        console.log(`✅ API Success (${duration}ms):`, {
          status: response.status,
          url: response.config.url,
          retryCount: response.config.metadata.retryCount,
        });
      }

      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      const circuitBreaker = getCircuitBreaker(baseURL);
      
      if (!originalRequest || originalRequest._isRetrying) {
        return Promise.reject(error);
      }

      const retryConfig = getRetryConfig(error, baseURL);
      const currentRetryCount = originalRequest.retryCount || 0;

      // Mark circuit breaker failure for actual service errors
      if (error.response?.status >= 500 || !error.response) {
        circuitBreaker.onFailure();
      }

      // Check if we should retry
      if (retryConfig.shouldRetry && currentRetryCount < retryConfig.maxRetries) {
        originalRequest._isRetrying = true;
        originalRequest.retryCount = currentRetryCount + 1;

        const delay = retryConfig.delay * Math.pow(retryConfig.backoffMultiplier, currentRetryCount);
        
        console.warn(`🔄 Retrying request (${originalRequest.retryCount}/${retryConfig.maxRetries}) after ${delay}ms:`, {
          url: originalRequest.url,
          error: error.message,
          status: error.response?.status,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Remove retry flag before making request
        delete originalRequest._isRetrying;

        return client.request(originalRequest);
      }

      // All retries exhausted or non-retryable error
      const enhancedError = handleServiceError(error, baseURL);
      
      if (LOG_CONFIG.enableConsole) {
        console.error(`❌ API Error (after ${currentRetryCount} retries):`, {
          url: originalRequest?.url,
          status: error.response?.status,
          message: error.message,
          userMessage: enhancedError.userMessage,
        });
      }

      return Promise.reject(enhancedError);
    }
  );

  return client;
};

/**
 * Create service-specific resilient clients
 */
export const createServiceClients = () => {
  const clients = {};
  
  Object.entries(SERVICES).forEach(([serviceName, serviceUrl]) => {
    const clientKey = serviceName.replace('_SERVICE', '').toLowerCase();
    clients[clientKey] = createResilientClient(serviceUrl, {
      // Service-specific timeouts
      timeout: serviceName === 'MESSAGING_SERVICE' ? 60000 : PERFORMANCE_CONFIG.apiTimeout,
    });
  });

  return clients;
};

/**
 * Pre-configured service clients
 */
export const serviceClients = createServiceClients();

/**
 * Generic API call with automatic service selection and resilient retry
 */
export const resilientApiCall = async (serviceName, endpoint, options = {}) => {
  const client = serviceClients[serviceName.toLowerCase()];
  
  if (!client) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  try {
    const response = await client.request({
      url: endpoint,
      method: 'GET',
      ...options,
    });
    
    return response.data;
  } catch (error) {
    // If circuit breaker is open, try to provide cached data or fallback
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      console.warn(`🚨 Circuit breaker open for ${serviceName}, attempting fallback...`);
      
      // Here you could implement cache retrieval or fallback data
      throw new Error(`${serviceName} service is temporarily unavailable. Please try again in a few minutes.`);
    }

    throw error;
  }
};

/**
 * Health check before critical operations
 */
export const ensureServiceHealth = async (serviceUrl, timeout = 5000) => {
  const isHealthy = isServiceRecentlyHealthy(serviceUrl);
  
  if (isHealthy) {
    return true;
  }

  console.log(`🏥 Checking health for ${serviceUrl}...`);
  return await checkServiceHealth(serviceUrl, timeout);
};

/**
 * Batch requests with automatic retry and service health awareness
 */
export const batchApiCalls = async (requests) => {
  const results = await Promise.allSettled(
    requests.map(async ({ serviceName, endpoint, options }) => {
      const serviceUrl = SERVICES[`${serviceName.toUpperCase()}_SERVICE`];
      
      // Check service health before making request
      await ensureServiceHealth(serviceUrl);
      
      return resilientApiCall(serviceName, endpoint, options);
    })
  );

  return results.map((result, index) => ({
    ...requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
};

/**
 * Debug utilities
 */
export const debugCircuitBreakers = () => {
  const status = Array.from(circuitBreakers.entries()).map(([url, breaker]) => ({
    Service: url.split('//')[1]?.split('.')[0] || url,
    State: breaker.state,
    'Failure Count': breaker.failureCount,
    'Can Execute': breaker.canExecute(),
    'Next Attempt': breaker.nextAttemptTime ? new Date(breaker.nextAttemptTime).toLocaleTimeString() : 'N/A',
  }));

  console.table(status);
  return status;
};

// Export individual service clients for direct use
export const {
  auth: authClient,
  user: userClient,
  job: jobClient,
  messaging: messagingClient,
  payment: paymentClient,
} = serviceClients;

export default {
  serviceClients,
  resilientApiCall,
  ensureServiceHealth,
  batchApiCalls,
  debugCircuitBreakers,
  createResilientClient,
};









