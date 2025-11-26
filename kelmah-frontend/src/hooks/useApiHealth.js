import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/environment';

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthUrl = `${API_BASE_URL}/health/aggregate`;
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          signal: AbortSignal.timeout(5000),
        });

        const healthy = response.ok;
        setIsHealthy(healthy);
        setLastCheck(new Date());

        // Cache healthy URL
        if (healthy && typeof window !== 'undefined') {
          localStorage.setItem('kelmah:lastHealthyApiBase', API_BASE_URL);
        }
      } catch (error) {
        console.warn('Health check failed:', error.message);
        setIsHealthy(false);
        setLastCheck(new Date());
      }
    };

    // Check on mount
    checkHealth();

    // Check every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { isHealthy, lastCheck };
};
