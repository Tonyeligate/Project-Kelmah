/**
 * Enhanced Service Manager
 * 
 * Manages service connectivity, automatic retries, circuit breaker pattern,
 * and graceful degradation for all backend services.
 */

import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import { getServiceUrl } from '../config/environment';

class EnhancedServiceManager {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.retryQueues = new Map();
    this.healthChecks = new Map();
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      healthCheckInterval: 60000,
      requestTimeout: 30000
    };

    this.initializeServices();
    this.setupNetworkMonitoring();
    this.startHealthChecks();
  }

  /**
   * Initialize all service clients
   */
  initializeServices() {
    const serviceNames = [
      'AUTH_SERVICE',
      'USER_SERVICE', 
      'JOB_SERVICE',
      'MESSAGING_SERVICE',
      'PAYMENT_SERVICE'
    ];

    serviceNames.forEach(serviceName => {
      this.createServiceClient(serviceName);
    });
  }

  /**
   * Create service client with enhanced configuration
   */
  createServiceClient(serviceName) {
    const baseURL = getServiceUrl(serviceName);
    
    const client = axios.create({
      baseURL,
      timeout: this.config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Client': 'kelmah-frontend',
        'X-Client-Version': '1.0.0'
      }
    });

    // Add request interceptor
    client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = secureStorage.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add service name for routing
        config.headers['X-Target-Service'] = serviceName;
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    client.interceptors.response.use(
      (response) => {
        // Mark service as healthy
        this.markServiceHealthy(serviceName);
        return response;
      },
      async (error) => {
        // Handle service errors
        await this.handleServiceError(serviceName, error);
        return Promise.reject(error);
      }
    );

    this.services.set(serviceName, client);
    this.circuitBreakers.set(serviceName, {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null,
      lastSuccessTime: Date.now()
    });

    return client;
  }

  /**
   * Get service client with circuit breaker protection
   */
  getService(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker?.state === 'OPEN') {
      const now = Date.now();
      if (now - circuitBreaker.lastFailureTime > this.config.circuitBreakerTimeout) {
        // Try to half-open the circuit
        circuitBreaker.state = 'HALF_OPEN';
        console.log(`Circuit breaker for ${serviceName} is now HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${serviceName}. Service temporarily unavailable.`);
      }
    }

    return this.services.get(serviceName);
  }

  /**
   * Make resilient API call with automatic retries
   */
  async makeResilientCall(serviceName, requestConfig) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const service = this.getService(serviceName);
        const response = await service.request(requestConfig);
        
        // Mark success and return
        this.markServiceHealthy(serviceName);
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.maxRetries && this.shouldRetry(error)) {
          await this.delay(this.getRetryDelay(attempt));
          continue;
        }
        
        // Mark failure
        await this.handleServiceError(serviceName, error);
        break;
      }
    }
    
    throw lastError;
  }

  /**
   * Handle service errors and update circuit breaker
   */
  async handleServiceError(serviceName, error) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Open circuit breaker if threshold reached
      if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'OPEN';
        console.warn(`Circuit breaker OPENED for ${serviceName} after ${circuitBreaker.failures} failures`);
        
        // Emit event for UI updates
        this.emitServiceStatusEvent(serviceName, 'UNAVAILABLE');
      }
    }

    // Queue for offline retry if network error
    if (this.isNetworkError(error) && !this.isOnline) {
      // Don't queue the same request multiple times
      // This would need more sophisticated deduplication in a real implementation
    }
  }

  /**
   * Mark service as healthy
   */
  markServiceHealthy(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.lastSuccessTime = Date.now();
      
      if (circuitBreaker.state !== 'CLOSED') {
        circuitBreaker.state = 'CLOSED';
        console.log(`Circuit breaker CLOSED for ${serviceName} - service recovered`);
        this.emitServiceStatusEvent(serviceName, 'AVAILABLE');
      }
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
      this.processOfflineQueue();
      this.emitServiceStatusEvent('NETWORK', 'ONLINE');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
      this.emitServiceStatusEvent('NETWORK', 'OFFLINE');
    });
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks() {
    const healthPromises = Array.from(this.services.keys()).map(serviceName => 
      this.checkServiceHealth(serviceName)
    );

    try {
      await Promise.allSettled(healthPromises);
    } catch (error) {
      console.error('Health check batch failed:', error);
    }
  }

  /**
   * Check individual service health
   */
  async checkServiceHealth(serviceName) {
    try {
      const service = this.services.get(serviceName);
      const response = await service.get('/health', { 
        timeout: 5000,
        headers: { 'X-Health-Check': 'true' }
      });
      
      this.healthChecks.set(serviceName, {
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: response.headers['x-response-time'] || 'unknown'
      });
      
      this.markServiceHealthy(serviceName);
      
    } catch (error) {
      this.healthChecks.set(serviceName, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message
      });
      
      // Don't trigger circuit breaker for health checks
    }
  }

  /**
   * Process offline queue when network returns
   */
  async processOfflineQueue() {
    while (this.offlineQueue.length > 0) {
      const request = this.offlineQueue.shift();
      try {
        await this.makeResilientCall(request.serviceName, request.config);
        console.log('Processed offline request:', request.config.url);
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  }

  /**
   * Emit service status events for UI components
   */
  emitServiceStatusEvent(serviceName, status) {
    const event = new CustomEvent('serviceStatusChange', {
      detail: { serviceName, status, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Utility methods
   */
  shouldRetry(error) {
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    const retryableNetworkErrors = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];
    
    return (
      retryableCodes.includes(error.response?.status) ||
      retryableNetworkErrors.includes(error.code) ||
      this.isNetworkError(error)
    );
  }

  isNetworkError(error) {
    return (
      !error.response ||
      error.code === 'NETWORK_ERROR' ||
      error.message.includes('Network Error')
    );
  }

  getRetryDelay(attempt) {
    return Math.min(this.config.retryDelay * Math.pow(2, attempt), 10000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service status information
   */
  getServiceStatus(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    const healthCheck = this.healthChecks.get(serviceName);
    
    return {
      serviceName,
      circuitBreakerState: circuitBreaker?.state || 'UNKNOWN',
      failures: circuitBreaker?.failures || 0,
      lastSuccess: circuitBreaker?.lastSuccessTime,
      lastFailure: circuitBreaker?.lastFailureTime,
      health: healthCheck || { status: 'unknown' },
      isOnline: this.isOnline
    };
  }

  /**
   * Get all services status
   */
  getAllServicesStatus() {
    const statuses = {};
    this.services.forEach((_, serviceName) => {
      statuses[serviceName] = this.getServiceStatus(serviceName);
    });
    return statuses;
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
      circuitBreaker.lastFailureTime = null;
      console.log(`Circuit breaker reset for ${serviceName}`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    this.circuitBreakers.forEach((_, serviceName) => {
      this.resetCircuitBreaker(serviceName);
    });
  }
}

// Create singleton instance
const serviceManager = new EnhancedServiceManager();

export { serviceManager };
export default serviceManager;