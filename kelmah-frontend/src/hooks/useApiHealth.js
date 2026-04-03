import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../config/environment';
import {
  createFeatureLogger,
  devWarn as apiHealthWarn,
} from '../modules/common/utils/devLogger';
import { markHealthTimer } from '../utils/healthTimerDebug';

const apiHealthDebug = createFeatureLogger({
  flagName: 'VITE_DEBUG_SERVICE_HEALTH',
  level: 'debug',
});

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(true); // Optimistic default
  const [lastCheck, setLastCheck] = useState(null);
  const isMountedRef = useRef(true);

  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    retryCountRef.current = 0;

    const checkHealth = async (isRetry = false) => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      try {
        const apiBaseUrl = getApiBaseUrl() || '/api';

        // Try multiple health endpoints for resilience
        // Note: apiBaseUrl includes /api suffix, and /api/health/aggregate is
        // a registered gateway route.
        const healthEndpoints = [`${apiBaseUrl}/health/aggregate`];

        for (const healthUrl of healthEndpoints) {
          try {
            const response = await fetch(healthUrl, {
              method: 'GET',
              signal: AbortSignal.timeout(8000), // Increased timeout for cold starts
            });

            if (response.ok && isMountedRef.current) {
              setIsHealthy(true);
              setLastCheck(new Date());
              retryCountRef.current = 0;
              // Cache healthy URL
              if (typeof window !== 'undefined') {
                localStorage.setItem('kelmah:lastHealthyApiBase', apiBaseUrl);
              }
              return; // Success - exit
            }
          } catch (endpointError) {
            // Try next endpoint
            apiHealthDebug(
              `Health check failed for ${healthUrl}:`,
              endpointError.message,
            );
          }
        }

        // All endpoints failed
        throw new Error('All health endpoints failed');
      } catch (error) {
        apiHealthWarn('Health check failed:', error.message);
        if (!isMountedRef.current) return;

        // Retry logic - single retry with backoff to reduce request churn
        if (!isRetry && retryCountRef.current < 1) {
          retryCountRef.current += 1;
          const backoffMs = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            5000,
          );
          retryTimeoutRef.current = setTimeout(
            () => {
              markHealthTimer('useApiHealth.retry', {
                trigger: 'timeout',
                delayMs: backoffMs,
                retryCount: retryCountRef.current,
              });
              checkHealth(true);
            },
            backoffMs,
          );
          return;
        }

        setIsHealthy(false);
        setLastCheck(new Date());
      }
    };

    // Initial check with delay to allow backend cold start
    const initialDelay = setTimeout(() => {
      markHealthTimer('useApiHealth.initialDelay', {
        trigger: 'timeout',
        delayMs: 1500,
      });
      checkHealth();
    }, 1500);

    // Check every 10 minutes while visible
    const interval = setInterval(() => {
      markHealthTimer('useApiHealth.interval', {
        trigger: 'interval',
        delayMs: 10 * 60 * 1000,
      });
      checkHealth();
    }, 10 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialDelay);
      clearTimeout(retryTimeoutRef.current);
      clearInterval(interval);
    };
    // LOW-22 FIX: getApiBaseUrl() is invoked inside checkHealth to avoid stale
    // module-level API base values when runtime config changes.
    // The empty dependency array is intentional — this effect runs once on mount.
  }, []);

  return { isHealthy, lastCheck };
};
