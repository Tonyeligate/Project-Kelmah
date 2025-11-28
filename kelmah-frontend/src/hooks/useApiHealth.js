import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/environment';

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(true); // Optimistic default
  const [lastCheck, setLastCheck] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const checkHealth = async (isRetry = false) => {
      try {
        // Try multiple health endpoints for resilience
        const healthEndpoints = [
          `${API_BASE_URL}/health/aggregate`,
          `${API_BASE_URL}/health`,
        ];

        for (const healthUrl of healthEndpoints) {
          try {
            const response = await fetch(healthUrl, {
              method: 'GET',
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
              signal: AbortSignal.timeout(8000), // Increased timeout for cold starts
            });

            if (response.ok && isMountedRef.current) {
              setIsHealthy(true);
              setLastCheck(new Date());
              setRetryCount(0);
              // Cache healthy URL
              if (typeof window !== 'undefined') {
                localStorage.setItem('kelmah:lastHealthyApiBase', API_BASE_URL);
              }
              return; // Success - exit
            }
          } catch (endpointError) {
            // Try next endpoint
            console.debug(`Health check failed for ${healthUrl}:`, endpointError.message);
          }
        }

        // All endpoints failed
        throw new Error('All health endpoints failed');
      } catch (error) {
        console.warn('Health check failed:', error.message);
        if (!isMountedRef.current) return;

        // Retry logic - up to 3 retries with backoff
        if (!isRetry && retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
          setTimeout(() => checkHealth(true), backoffMs);
          return;
        }

        setIsHealthy(false);
        setLastCheck(new Date());
      }
    };

    // Initial check with delay to allow backend cold start
    const initialDelay = setTimeout(() => checkHealth(), 1000);

    // Check every 5 minutes
    const interval = setInterval(() => checkHealth(), 5 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [retryCount]);

  return { isHealthy, lastCheck };
};
