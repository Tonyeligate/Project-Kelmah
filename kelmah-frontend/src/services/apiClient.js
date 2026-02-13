import axios from 'axios';
import { API_BASE_URL } from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

// Lightweight UUID v4 generator (browser-compatible)
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET request deduplication — concurrent identical GETs share one in-flight promise
const inflightGets = new Map();

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to generate request key for deduplication
const getRequestKey = (method, url, params) => {
    return `${method}:${url}:${JSON.stringify(params || '')}`;
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Add Request ID
        config.headers['X-Request-ID'] = uuidv4();

        // Add Auth Token
        const token = secureStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Clean up dedup entry on success
        if (response.config?.method === 'get') {
            const key = getRequestKey('get', response.config.url, response.config.params);
            inflightGets.delete(key);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Graceful degradation for sleeping Render backend (free tier)
        const status = error.response?.status;
        if (status === 502 || status === 503 || status === 504) {
            // Attach a user-friendly message so consumers can display it
            error.isBackendSleeping = true;
            error.friendlyMessage =
                'The server is waking up — this usually takes 15-30 seconds. Please try again shortly.';
            console.warn(
                `⏳ Backend returned ${status} — likely waking from sleep`,
            );
            return Promise.reject(error);
        }

        // Handle 401 Token Refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = secureStorage.getItem('refresh_token');
                if (refreshToken) {
                    // Use a separate instance to avoid infinite loops
                    const response = await axios.post(
                        `${API_BASE_URL}/auth/refresh-token`,
                        {
                            refreshToken,
                        },
                    );

                    const { token } = response.data;
                    secureStorage.setAuthToken(token);

                    // Update header and retry original request
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                secureStorage.removeItem('auth_token');
                secureStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

// Retry logic for failed requests
const retryRequest = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        // Don't retry 4xx errors (client errors) or sleeping backend (502/503/504)
        if (
            retries === 0 ||
            error.isBackendSleeping ||
            (error.response &&
                error.response.status >= 400 &&
                error.response.status < 500)
        ) {
            throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, delay * 2);
    }
};

// Deduplicated GET — concurrent calls to the same URL share one in-flight promise
const deduplicatedGet = (url, config) => {
    const key = getRequestKey('get', url, config?.params);
    if (inflightGets.has(key)) {
        return inflightGets.get(key);
    }
    const promise = retryRequest(() => apiClient.get(url, config)).finally(() => {
        inflightGets.delete(key);
    });
    inflightGets.set(key, promise);
    return promise;
};

// Export methods — only GET/HEAD use retry logic; mutations are not retried
export const api = {
    get: deduplicatedGet,
    head: (url, config) => retryRequest(() => apiClient.head(url, config)),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),
};

export default apiClient;
