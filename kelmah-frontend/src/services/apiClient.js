import axios from 'axios';
import { API_BASE_URL } from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

// Lightweight UUID v4 generator (browser-compatible)
const uuidv4 = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET request deduplication — concurrent identical GETs share one in-flight promise
const inflightGets = new Map();
const pendingUnauthorizedRequests = [];
let hasTriggeredAuthRedirect = false;

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient._refreshPromise = null;
apiClient._isRefreshing = false;

// Helper to generate request key for deduplication
const getRequestKey = (method, url, params) => {
    return `${method}:${url}:${JSON.stringify(params || '')}`;
};

const isRefreshRequest = (request) =>
    typeof request?.url === 'string' && request.url.includes('/auth/refresh-token');

const enqueueUnauthorizedRequest = (request) =>
    new Promise((resolve, reject) => {
        pendingUnauthorizedRequests.push({ request, resolve, reject });
    });

const processUnauthorizedQueue = (error, token = null) => {
    while (pendingUnauthorizedRequests.length > 0) {
        const queued = pendingUnauthorizedRequests.shift();
        if (!queued) {
            continue;
        }

        if (error) {
            queued.reject(error);
            continue;
        }

        queued.request.headers = queued.request.headers || {};
        queued.request.headers.Authorization = `Bearer ${token}`;
        queued.resolve(apiClient(queued.request));
    }
};

const redirectToLogin = () => {
    if (hasTriggeredAuthRedirect || typeof window === 'undefined') {
        return;
    }

    hasTriggeredAuthRedirect = true;
    window.location.replace('/login');
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Add Request ID
        config.headers['X-Request-ID'] = uuidv4();

        // Add Auth Token
        const token = secureStorage.getAuthToken();
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
            if (import.meta.env.DEV) console.warn(
                `⏳ Backend returned ${status} — likely waking from sleep`,
            );
            return Promise.reject(error);
        }

        // Handle 401 Token Refresh
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isRefreshRequest(originalRequest)
        ) {
            originalRequest._retry = true;
            const queuedRetry = enqueueUnauthorizedRequest(originalRequest);

            // Lock concurrent refreshes — share a single in-flight promise
            if (!apiClient._refreshPromise) {
                apiClient._isRefreshing = true;
                apiClient._refreshPromise = (async () => {
                    const refreshToken = secureStorage.getItem('refresh_token');
                    if (!refreshToken) throw new Error('No refresh token');
                    // Use a separate instance to avoid infinite loops
                    const response = await axios.post(
                        `${API_BASE_URL}/auth/refresh-token`,
                        { refreshToken },
                    );
                    const token =
                        response.data?.data?.token ||
                        response.data?.token ||
                        response.data?.accessToken ||
                        null;
                    if (!token) throw new Error('Refresh response missing token');
                    secureStorage.setAuthToken(token);

                    // Save rotated refresh token if provided
                    const newRefresh =
                        response.data?.data?.refreshToken ||
                        response.data?.refreshToken ||
                        null;
                    if (newRefresh) {
                        secureStorage.setItem('refresh_token', newRefresh);
                    }

                    processUnauthorizedQueue(null, token);
                    return token;
                })()
                .catch((refreshError) => {
                    processUnauthorizedQueue(refreshError, null);
                    return Promise.reject(refreshError);
                })
                .finally(() => {
                    apiClient._isRefreshing = false;
                    apiClient._refreshPromise = null;
                });
            }

            return queuedRetry.catch((refreshError) => {
                secureStorage.removeItem('auth_token');
                secureStorage.removeItem('refresh_token');
                redirectToLogin();
                throw refreshError;
            });
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
