/**
 * Service Status Hook
 *
 * Provides real-time service status monitoring with automatic retry
 * and user-friendly error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceManager } from '../services/EnhancedServiceManager';

export const useServiceStatus = (serviceName, options = {}) => {
  const {
    autoRetry = true,
    retryInterval = 30000,
    maxRetries = 3,
    onError,
    onSuccess,
    onRetry,
  } = options;

  const [status, setStatus] = useState({
    isOnline: true,
    loading: false,
    error: null,
    retryCount: 0,
    lastChecked: null,
  });

  const [autoRetryEnabled, setAutoRetryEnabled] = useState(autoRetry);

  // Check service status
  const checkStatus = useCallback(
    async (isAutoRetry = false) => {
      setStatus((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const healthCheck = await serviceManager.healthCheck(serviceName);

        setStatus((prev) => ({
          ...prev,
          isOnline: healthCheck.status === 'healthy',
          loading: false,
          error: null,
          retryCount: 0,
          lastChecked: Date.now(),
        }));

        if (onSuccess) onSuccess(healthCheck);
      } catch (error) {
        const enhancedError = {
          ...error,
          serviceName,
          isAutoRetry,
          timestamp: Date.now(),
        };

        setStatus((prev) => ({
          ...prev,
          isOnline: false,
          loading: false,
          error: enhancedError,
          retryCount: isAutoRetry ? prev.retryCount + 1 : 0,
          lastChecked: Date.now(),
        }));

        if (onError) onError(enhancedError);

        // Disable auto-retry after max attempts
        if (isAutoRetry && status.retryCount >= maxRetries - 1) {
          setAutoRetryEnabled(false);
        }
      }
    },
    [serviceName, onError, onSuccess, status.retryCount, maxRetries],
  );

  // Manual retry function
  const retry = useCallback(async () => {
    if (onRetry) onRetry();
    await checkStatus(false);
    setAutoRetryEnabled(true); // Re-enable auto-retry on manual retry
  }, [checkStatus, onRetry]);

  // Auto-retry effect
  useEffect(() => {
    if (!autoRetryEnabled || status.isOnline || status.loading) return;

    const timer = setTimeout(() => {
      checkStatus(true);
    }, retryInterval);

    return () => clearTimeout(timer);
  }, [
    checkStatus,
    autoRetryEnabled,
    status.isOnline,
    status.loading,
    retryInterval,
  ]);

  // Initial status check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for service status changes from service manager
  useEffect(() => {
    const handleServiceUpdate = () => {
      const serviceStatus = serviceManager.getServiceStatus(serviceName);
      if (serviceStatus) {
        setStatus((prev) => ({
          ...prev,
          isOnline: serviceStatus.isOnline,
          error: serviceStatus.lastError,
        }));
      }
    };

    // Check every 5 seconds for status updates
    const interval = setInterval(handleServiceUpdate, 5000);
    return () => clearInterval(interval);
  }, [serviceName]);

  return {
    ...status,
    retry,
    checkStatus,
    autoRetryEnabled,
    setAutoRetryEnabled,
  };
};

export default useServiceStatus;
