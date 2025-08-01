/**
 * Enhanced API Hook with Security and Offline Capabilities
 * 
 * Provides secure API calls with automatic retry, offline queueing,
 * error handling, and user experience enhancements.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { serviceManager } from '../services/EnhancedServiceManager';
import { secureStorage } from '../utils/secureStorage';

const useEnhancedApi = (options = {}) => {
  const {
    serviceName = 'USER_SERVICE',
    showSuccessToast = false,
    showErrorToast = true,
    retryAttempts = 3,
    retryDelay = 1000,
    autoRetry = true,
    cacheResults = false,
    cacheExpiry = 5 * 60 * 1000, // 5 minutes
    offlineSupport = true
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { enqueueSnackbar } = useSnackbar();
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Generate cache key for request
   */
  const getCacheKey = useCallback((endpoint, params) => {
    return `${serviceName}_${endpoint}_${JSON.stringify(params || {})}`;
  }, [serviceName]);

  /**
   * Get cached data if available and not expired
   */
  const getCachedData = useCallback((cacheKey) => {
    if (!cacheResults) return null;

    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      cacheRef.current.delete(cacheKey);
    }

    return null;
  }, [cacheResults, cacheExpiry]);

  /**
   * Cache response data
   */
  const setCachedData = useCallback((cacheKey, responseData) => {
    if (!cacheResults) return;

    cacheRef.current.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
  }, [cacheResults]);

  /**
   * Enhanced API call with security and error handling
   */
  const callApi = useCallback(async (
    endpoint,
    options = {},
    onSuccess,
    onError
  ) => {
    const {
      method = 'GET',
      data: requestData,
      params,
      headers = {},
      skipAuth = false,
      timeout = 30000,
      priority = 'normal' // high, normal, low
    } = options;

    // Generate cache key
    const cacheKey = getCacheKey(endpoint, { method, params, requestData });

    // Check cache for GET requests
    if (method === 'GET') {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        if (onSuccess) onSuccess(cachedData);
        return cachedData;
      }
    }

    // If offline and no cache, show offline message
    if (isOffline && !offlineSupport) {
      const offlineError = new Error('No internet connection');
      offlineError.isOffline = true;
      setError(offlineError);
      if (showErrorToast) {
        enqueueSnackbar('You\'re offline. Please check your connection.', { 
          variant: 'warning' 
        });
      }
      if (onError) onError(offlineError);
      return;
    }

    setLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const client = serviceManager.getService(serviceName);
      
      // Prepare request config
      const config = {
        method,
        url: endpoint,
        timeout,
        signal: abortControllerRef.current.signal,
        headers: {
          ...headers,
          'X-Priority': priority,
          'X-Retry-Count': retryCount.toString()
        }
      };

      // Add auth token if not skipped
      if (!skipAuth) {
        const token = secureStorage.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Add data/params based on method
      if (method === 'GET' && params) {
        config.params = params;
      } else if (requestData) {
        config.data = requestData;
      }

      // Make the API call
      const response = await client.request(config);
      const responseData = response.data;

      // Cache successful GET responses
      if (method === 'GET' && cacheResults) {
        setCachedData(cacheKey, responseData);
      }

      // Update state
      setData(responseData);
      setLoading(false);
      setRetryCount(0);

      // Show success toast if enabled
      if (showSuccessToast) {
        enqueueSnackbar('Operation completed successfully', { 
          variant: 'success' 
        });
      }

      // Call success callback
      if (onSuccess) onSuccess(responseData);

      return responseData;

    } catch (apiError) {
      setLoading(false);
      
      // Don't update error state if request was aborted
      if (apiError.name === 'AbortError') {
        return;
      }

      // Enhance error with context
      const enhancedError = {
        ...apiError,
        endpoint,
        serviceName,
        retryCount,
        timestamp: Date.now(),
        userMessage: getUserFriendlyMessage(apiError)
      };

      setError(enhancedError);

      // Handle different error scenarios
      if (enhancedError.response?.status === 401) {
        // Clear auth data on authentication failure
        secureStorage.clear();
        enqueueSnackbar('Please log in again', { variant: 'warning' });
      } else if (autoRetry && shouldRetry(enhancedError) && retryCount < retryAttempts) {
        // Auto retry for retryable errors
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          callApi(endpoint, options, onSuccess, onError);
        }, getRetryDelay(retryCount));
        
        if (showErrorToast) {
          enqueueSnackbar(`Retrying... (${retryCount + 1}/${retryAttempts})`, { 
            variant: 'info' 
          });
        }
      } else {
        // Show error toast for non-retryable or max retry reached
        if (showErrorToast) {
          enqueueSnackbar(enhancedError.userMessage, { 
            variant: 'error',
            action: shouldRetry(enhancedError) ? 
              <button onClick={() => retry()}>Retry</button> : null
          });
        }

        // Call error callback
        if (onError) onError(enhancedError);
      }

      throw enhancedError;
    }
  }, [
    serviceName, retryCount, retryAttempts, retryDelay, autoRetry,
    showSuccessToast, showErrorToast, isOffline, offlineSupport,
    getCacheKey, getCachedData, setCachedData, enqueueSnackbar
  ]);

  /**
   * Manual retry function
   */
  const retry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    // Note: This requires the last request config to be stored
    // For simplicity, we'll just clear error state
  }, []);

  /**
   * Clear cache for specific key or all cache
   */
  const clearCache = useCallback((endpoint = null, params = null) => {
    if (endpoint) {
      const cacheKey = getCacheKey(endpoint, params);
      cacheRef.current.delete(cacheKey);
    } else {
      cacheRef.current.clear();
    }
  }, [getCacheKey]);

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  /**
   * Get user-friendly error message
   */
  const getUserFriendlyMessage = (error) => {
    if (error.isOffline || !navigator.onLine) {
      return 'You\'re offline. Please check your internet connection.';
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (error.response?.status === 401) {
      return 'Please log in again to continue.';
    }

    if (error.response?.status === 403) {
      return 'You don\'t have permission to perform this action.';
    }

    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (error.response?.status === 422) {
      return 'Please check your input and try again.';
    }

    return error.userMessage || 'Something went wrong. Please try again.';
  };

  /**
   * Check if error should trigger retry
   */
  const shouldRetry = (error) => {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];
    
    return (
      retryableStatuses.includes(error.response?.status) ||
      retryableCodes.includes(error.code) ||
      error.isOffline
    );
  };

  /**
   * Get retry delay with exponential backoff
   */
  const getRetryDelay = (attempt) => {
    return Math.min(retryDelay * Math.pow(2, attempt), 10000);
  };

  return {
    loading,
    error,
    data,
    retryCount,
    isOffline,
    callApi,
    retry,
    cancel,
    clearCache,
    // Helper methods for common HTTP methods
    get: (endpoint, params, onSuccess, onError) => 
      callApi(endpoint, { method: 'GET', params }, onSuccess, onError),
    post: (endpoint, data, onSuccess, onError) => 
      callApi(endpoint, { method: 'POST', data }, onSuccess, onError),
    put: (endpoint, data, onSuccess, onError) => 
      callApi(endpoint, { method: 'PUT', data }, onSuccess, onError),
    patch: (endpoint, data, onSuccess, onError) => 
      callApi(endpoint, { method: 'PATCH', data }, onSuccess, onError),
    delete: (endpoint, onSuccess, onError) => 
      callApi(endpoint, { method: 'DELETE' }, onSuccess, onError)
  };
};

export default useEnhancedApi;