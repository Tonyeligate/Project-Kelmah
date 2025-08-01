/**
 * Enhanced Service Manager
 * 
 * Provides centralized service management with security, retry logic,
 * offline capabilities, and graceful degradation.
 */

import axios from 'axios';
import { SERVICES } from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

class EnhancedServiceManager {
  constructor() {
    this.services = new Map();
    this.offlineQueue = [];
    this.serviceStatus = new Map();
    this.retryDelays = [1000, 3000, 5000, 10000]; // Progressive delays
    this.maxRetries = 3;
    
    this.initializeServices();
    this.setupNetworkMonitoring();
  }

  /**
   * Initialize all service clients with security and error handling
   */
  initializeServices() {
    Object.entries(SERVICES).forEach(([serviceName, baseURL]) => {
      const client = this.createSecureClient(serviceName, baseURL);
      this.services.set(serviceName, client);
      this.serviceStatus.set(serviceName, { 
        isOnline: true, 
        lastError: null,
        errorCount: 0,
        lastSuccess: Date.now()
      });
    });
  }

  /**
   * Create a secure axios client with comprehensive error handling
   */
  createSecureClient(serviceName, baseURL) {
    const client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Request-ID': () => this.generateRequestId()
      },
      withCredentials: false // Disable credentials for security
    });

    // Request interceptor with security
    client.interceptors.request.use(
      (config) => {
        // Add security headers
        config.headers['X-Request-ID'] = this.generateRequestId();
        config.headers['X-Timestamp'] = Date.now().toString();
        
        // Add authentication token securely
        const token = secureStorage.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request for monitoring
        console.log(`🔄 [${serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
        
        return config;
      },
      (error) => {
        console.error(`❌ [${serviceName}] Request setup failed:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with enhanced error handling
    client.interceptors.response.use(
      (response) => {
        // Update service status on success
        this.updateServiceStatus(serviceName, true);
        
        // Log successful response
        console.log(`✅ [${serviceName}] ${response.status} ${response.config.url}`);
        
        return response;
      },
      async (error) => {
        // Update service status on error
        this.updateServiceStatus(serviceName, false, error);
        
        // Handle different error types
        const enhancedError = this.enhanceError(error, serviceName);
        
        // Attempt token refresh for 401 errors
        if (error.response?.status === 401 && !error.config._retry) {
          const refreshed = await this.attemptTokenRefresh();
          if (refreshed) {
            error.config._retry = true;
            const token = secureStorage.getAuthToken();
            error.config.headers.Authorization = `Bearer ${token}`;
            return client.request(error.config);
          }
        }

        // Queue request for offline retry if network error
        if (this.isNetworkError(error)) {
          this.queueOfflineRequest(error.config, serviceName);
        }

        return Promise.reject(enhancedError);
      }
    );

    return client;
  }

  /**
   * Enhanced error object with context and user-friendly messages
   */
  enhanceError(error, serviceName) {
    const enhanced = {
      ...error,
      serviceName,
      timestamp: Date.now(),
      userMessage: this.getUserFriendlyMessage(error),
      retryable: this.isRetryableError(error),
      severity: this.getErrorSeverity(error),
      category: this.categorizeError(error)
    };

    // Log enhanced error
    console.error(`❌ [${serviceName}] Error:`, {
      status: error.response?.status,
      message: error.message,
      userMessage: enhanced.userMessage,
      retryable: enhanced.retryable
    });

    return enhanced;
  }

  /**
   * Get user-friendly error messages
   */
  getUserFriendlyMessage(error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Service is responding slowly. Please try again.';
    }
    
    if (error.response?.status === 401) {
      return 'Please log in again to continue.';
    }
    
    if (error.response?.status === 403) {
      return 'You don\'t have permission to access this resource.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.response?.status >= 500) {
      return 'Server is temporarily unavailable. We\'re working to fix this.';
    }
    
    if (this.isNetworkError(error)) {
      return 'No internet connection. Your request will be retried automatically.';
    }
    
    return 'Something went wrong. Please try again.';
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];
    
    return (
      retryableStatuses.includes(error.response?.status) ||
      retryableCodes.includes(error.code) ||
      this.isNetworkError(error)
    );
  }

  /**
   * Get error severity level
   */
  getErrorSeverity(error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'high';
    }
    if (error.response?.status >= 500) {
      return 'critical';
    }
    if (this.isNetworkError(error)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Categorize error for monitoring
   */
  categorizeError(error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'authentication';
    }
    if (error.response?.status === 404) {
      return 'not_found';
    }
    if (error.response?.status >= 500) {
      return 'server_error';
    }
    if (this.isNetworkError(error)) {
      return 'network';
    }
    return 'client_error';
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    return !error.response && (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.message.includes('Network Error')
    );
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName, isSuccess, error = null) {
    const status = this.serviceStatus.get(serviceName);
    
    if (isSuccess) {
      status.isOnline = true;
      status.lastSuccess = Date.now();
      status.errorCount = 0;
      status.lastError = null;
    } else {
      status.isOnline = false;
      status.errorCount++;
      status.lastError = error;
    }
    
    this.serviceStatus.set(serviceName, status);
  }

  /**
   * Attempt to refresh authentication token
   */
  async attemptTokenRefresh() {
    try {
      const refreshToken = secureStorage.getRefreshToken();
      if (!refreshToken) return false;

      const authClient = this.services.get('AUTH_SERVICE');
      const response = await authClient.post('/api/auth/refresh', {
        refreshToken
      });

      const { token, user } = response.data;
      secureStorage.setAuthToken(token);
      secureStorage.setUserData(user);

      console.log('🔄 Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Clear invalid tokens
      secureStorage.removeItem('kelmah_auth_token');
      secureStorage.removeItem('kelmah_refresh_token');
      return false;
    }
  }

  /**
   * Queue request for offline retry
   */
  queueOfflineRequest(config, serviceName) {
    this.offlineQueue.push({
      config,
      serviceName,
      timestamp: Date.now(),
      retryCount: 0
    });

    console.log(`📥 Queued offline request for ${serviceName}`);
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    console.log(`🔄 Processing ${queue.length} offline requests`);

    for (const item of queue) {
      try {
        const client = this.services.get(item.serviceName);
        await client.request(item.config);
        console.log(`✅ Offline request successful: ${item.serviceName}`);
      } catch (error) {
        if (item.retryCount < this.maxRetries) {
          item.retryCount++;
          this.offlineQueue.push(item);
        } else {
          console.error(`❌ Offline request failed permanently: ${item.serviceName}`);
        }
      }
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
    });
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service client
   */
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName) {
    return this.serviceStatus.get(serviceName);
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses() {
    const statuses = {};
    this.serviceStatus.forEach((status, serviceName) => {
      statuses[serviceName] = status;
    });
    return statuses;
  }

  /**
   * Perform service health check
   */
  async healthCheck(serviceName) {
    try {
      const client = this.services.get(serviceName);
      const response = await client.get('/health');
      return {
        serviceName,
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'unknown',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        serviceName,
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Retry failed request with exponential backoff
   */
  async retryRequest(serviceName, requestConfig, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      throw new Error(`Max retries exceeded for ${serviceName}`);
    }

    const delay = this.retryDelays[retryCount] || this.retryDelays[this.retryDelays.length - 1];
    
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const client = this.services.get(serviceName);
      return await client.request(requestConfig);
    } catch (error) {
      if (this.isRetryableError(error)) {
        return this.retryRequest(serviceName, requestConfig, retryCount + 1);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const serviceManager = new EnhancedServiceManager();
export default serviceManager;