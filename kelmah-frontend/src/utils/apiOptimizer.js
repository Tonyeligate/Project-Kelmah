import CacheService from '../services/CacheService';
import PerformanceService from '../services/PerformanceService';

export const optimizedRequest = async (endpoint, options = {}) => {
    const {
        method = 'GET',
        body = null,
        headers = {},
        cache = true,
        cacheTTL = 3600,
        retry = 3,
        retryDelay = 1000
    } = options;

    // Check cache for GET requests
    if (method === 'GET' && cache) {
        const cachedData = CacheService.get(endpoint);
        if (cachedData) {
            return cachedData;
        }
    }

    const startTime = performance.now();

    const makeRequest = async (retryCount = 0) => {
        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: body ? JSON.stringify(body) : null
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (method === 'GET' && cache) {
                CacheService.set(endpoint, data, cacheTTL);
            }

            // Track API performance
            PerformanceService.trackApiCall(endpoint, startTime);

            return data;

        } catch (error) {
            if (retryCount < retry) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return makeRequest(retryCount + 1);
            }
            throw error;
        }
    };

    return makeRequest();
}; 