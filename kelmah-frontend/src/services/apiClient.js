import axios from 'axios';
import { API_BASE_URL, AUTH_CONFIG } from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

let uuidFallbackCounter = 0;

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

    uuidFallbackCounter = (uuidFallbackCounter + 1) & 0xffff;
    const nowHex = Date.now().toString(16).padStart(12, '0');
    const perfHex = Math.floor((typeof performance !== 'undefined' ? performance.now() : 0) * 1000)
        .toString(16)
        .padStart(8, '0');
    const counterHex = uuidFallbackCounter.toString(16).padStart(4, '0');
    const raw = `${nowHex}${perfHex}${counterHex}`.padEnd(32, '0').slice(0, 32);
    const variantNibble = ['8', '9', 'a', 'b'][uuidFallbackCounter % 4];

    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-${variantNibble}${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
};

// GET request deduplication — concurrent identical GETs share one in-flight promise
const inflightGets = new Map();
const pendingUnauthorizedRequests = [];
let hasTriggeredAuthRedirect = false;
let refreshBlockedUntil = 0;

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient._refreshPromise = null;
apiClient._isRefreshing = false;

// Helper to generate request key for deduplication
const getRequestKey = (method, url, params) => {
    const stableSerialize = (value) => {
        if (Array.isArray(value)) {
            return value.map((entry) => stableSerialize(entry));
        }

        if (value && typeof value === 'object') {
            return Object.keys(value)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = stableSerialize(value[key]);
                    return acc;
                }, {});
        }

        return value;
    };

    return `${method}:${url}:${JSON.stringify(stableSerialize(params || ''))}`;
};

const isRefreshRequest = (request) =>
    typeof request?.url === 'string' && /\/auth\/(refresh|refresh-token)/.test(request.url);

const isAuthVerifyRequest = (request) =>
    typeof request?.url === 'string' && /\/auth\/(verify|me)$/.test(request.url);

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
        if (token) {
            queued.request.headers.Authorization = `Bearer ${token}`;
        } else {
            delete queued.request.headers.Authorization;
        }
        queued.resolve(apiClient(queued.request));
    }
};

const buildLoginRedirectUrl = () => {
    if (typeof window === 'undefined') {
        return '/login';
    }

    const { pathname = '/', search = '', hash = '' } = window.location;
    if (pathname === '/login') {
        return '/login';
    }

    const intendedPath = `${pathname}${search}${hash}`;
    return `/login?from=${encodeURIComponent(intendedPath)}`;
};

const navigateInApp = (targetPath) => {
    if (typeof window === 'undefined' || !targetPath) {
        return false;
    }

    try {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (currentPath === targetPath) {
            return true;
        }

        if (window.history && typeof window.history.pushState === 'function') {
            window.history.pushState({}, '', targetPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
            return true;
        }
    } catch {
        return false;
    }

    return false;
};

const redirectToLogin = () => {
    if (hasTriggeredAuthRedirect || typeof window === 'undefined') {
        return;
    }

    if (window.location.pathname === '/login') {
        hasTriggeredAuthRedirect = true;
        return;
    }

    hasTriggeredAuthRedirect = true;
    const loginUrl = buildLoginRedirectUrl();
    if (!navigateInApp(loginUrl)) {
        window.location.assign(loginUrl);
    }
};

const forceLogoutAndRedirect = (error) => {
    secureStorage.removeItem('auth_token');
    secureStorage.removeItem('refresh_token');
    secureStorage.removeItem('user_data');
    processUnauthorizedQueue(error || new Error('Unauthorized'), null);
    redirectToLogin();
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Add Request ID
        config.headers['X-Request-ID'] = uuidv4();

        // Add Auth Token
        const token = AUTH_CONFIG.sendAuthHeader
            ? secureStorage.getAuthToken()
            : null;
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
            const now = Date.now();
            if (now < refreshBlockedUntil) {
                return Promise.reject(error);
            }

            const hasStoredSessionHint = Boolean(
                secureStorage.getAuthToken() ||
                secureStorage.getRefreshToken() ||
                (AUTH_CONFIG.httpOnlyCookieAuth && secureStorage.getUserData()),
            );

            if (
                !hasStoredSessionHint &&
                isAuthVerifyRequest(originalRequest) &&
                !AUTH_CONFIG.httpOnlyCookieAuth
            ) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            const queuedRetry = enqueueUnauthorizedRequest(originalRequest);

            // Lock concurrent refreshes — share a single in-flight promise
            if (!apiClient._refreshPromise) {
                apiClient._isRefreshing = true;
                apiClient._refreshPromise = (async () => {
                    const refreshToken = secureStorage.getRefreshToken();
                    const refreshPayload = refreshToken ? { refreshToken } : {};
                    // Use a separate instance to avoid infinite loops
                    const response = await axios.post(
                        `${API_BASE_URL}/auth/refresh-token`,
                        refreshPayload,
                        {
                            withCredentials: true,
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        },
                    );
                    const token =
                        response.data?.data?.token ||
                        response.data?.token ||
                        response.data?.accessToken ||
                        null;
                    if (token && AUTH_CONFIG.storeTokensClientSide) {
                        secureStorage.setAuthToken(token);
                    } else if (!AUTH_CONFIG.storeTokensClientSide) {
                        secureStorage.removeItem('auth_token');
                    } else {
                        secureStorage.removeItem('auth_token');
                    }

                    // Save rotated refresh token if provided
                    const newRefresh =
                        response.data?.data?.refreshToken ||
                        response.data?.refreshToken ||
                        null;
                    if (newRefresh && AUTH_CONFIG.storeTokensClientSide) {
                        secureStorage.setRefreshToken(newRefresh);
                    } else if (!AUTH_CONFIG.storeTokensClientSide) {
                        secureStorage.removeItem('refresh_token');
                    }

                    processUnauthorizedQueue(null, token);
                    return token;
                })()
                .catch((refreshError) => {
                    const refreshStatus = refreshError?.response?.status;
                    if (refreshStatus === 429 || refreshStatus >= 500) {
                        refreshBlockedUntil = Date.now() + 60_000;
                    }
                    processUnauthorizedQueue(refreshError, null);
                    return Promise.reject(refreshError);
                })
                .finally(() => {
                    apiClient._isRefreshing = false;
                    apiClient._refreshPromise = null;
                });
            }

            return queuedRetry.catch((refreshError) => {
                const refreshStatus = refreshError?.response?.status;
                const shouldForceLogout = [400, 401, 403].includes(refreshStatus);

                if (shouldForceLogout) {
                    forceLogoutAndRedirect(refreshError);
                }
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
        // Don't retry most 4xx client errors; allow 429 throttling to back off and retry.
        const status = error?.response?.status;
        const shouldRetryClientError = status === 429;
        if (
            retries === 0 ||
            error.isBackendSleeping ||
            (status >= 400 && status < 500 && !shouldRetryClientError)
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
