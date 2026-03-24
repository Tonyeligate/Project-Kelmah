import axios from 'axios';
import { API_BASE_URL, AUTH_CONFIG } from '../config/environment';
import { secureStorage } from '../utils/secureStorage';
import {
    createApiEnvelopeError,
    isEnvelopeFailure,
    normalizeApiError,
    isTimeoutError,
    isRetryableError,
    toUserMessage,
} from './responseNormalizer';
import { captureContractMismatch, captureRecoverableApiError } from './errorTelemetry';
import { normalizeRequestedPath } from '../utils/authRedirect';
import { createFeatureLogger } from '../modules/common/utils/devLogger';

const apiClientWarn = createFeatureLogger({ flagName: 'VITE_DEBUG_API_CLIENT', level: 'warn' });

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
let isForceLogoutInProgress = false;
const AUTH_SYNC_STORAGE_KEY = 'kelmah_auth_sync';
let authSyncListenersInitialized = false;

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

const isPublicAuthRequest = (request) =>
    typeof request?.url === 'string' &&
    /\/auth\/(login|register|forgot-password|reset-password|resend-verification-email|verify-email|oauth\/exchange)/.test(request.url);

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

    const intendedPath = normalizeRequestedPath(`${pathname}${search}${hash}`);
    if (!intendedPath) {
        return '/login';
    }

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
    navigateInApp(loginUrl);
};

const forceLogoutAndRedirect = (error) => {
    if (isForceLogoutInProgress) {
        return;
    }

    isForceLogoutInProgress = true;
    secureStorage.clearAuthData();
    processUnauthorizedQueue(error || new Error('Unauthorized'), null);
    redirectToLogin();
};

const initializeCrossTabAuthSync = () => {
    if (
        authSyncListenersInitialized ||
        typeof window === 'undefined'
    ) {
        return;
    }

    authSyncListenersInitialized = true;

    const handleLogoutSignal = () => {
        forceLogoutAndRedirect(new Error('Session ended in another tab'));
    };

    try {
        const channel = new BroadcastChannel('kelmah_auth');
        channel.onmessage = (event) => {
            const payload = event?.data;
            if (payload?.type === 'LOGOUT') {
                handleLogoutSignal();
            }
        };
    } catch (_) {
        // BroadcastChannel may be unavailable; storage-event fallback below covers this.
    }

    window.addEventListener('storage', (event) => {
        if (event.key !== AUTH_SYNC_STORAGE_KEY || !event.newValue) {
            return;
        }

        try {
            const payload = JSON.parse(event.newValue);
            if (payload?.type === 'LOGOUT') {
                handleLogoutSignal();
            }
        } catch {
            // Ignore malformed payloads.
        }
    });
};

initializeCrossTabAuthSync();

const parseRetryAfterMs = (error) => {
    const headerValue =
        error?.response?.headers?.['retry-after'] ||
        error?.response?.headers?.RetryAfter ||
        error?.response?.headers?.['Retry-After'];

    if (!headerValue) {
        return null;
    }

    const value = String(headerValue).trim();
    if (/^\d+$/.test(value)) {
        return Math.max(Number(value) * 1000, 0);
    }

    const dateMs = Date.parse(value);
    if (!Number.isNaN(dateMs)) {
        return Math.max(dateMs - Date.now(), 0);
    }

    return null;
};

const applyBackoffJitter = (baseDelayMs) => {
    const safeDelay = Math.max(250, Math.min(baseDelayMs, 10_000));
    const jitterCap = Math.max(100, Math.floor(safeDelay * 0.2));
    const jitter = Math.floor(Math.random() * (jitterCap + 1));
    return safeDelay + jitter;
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
        if (isEnvelopeFailure(response?.data)) {
            const envelopeError = createApiEnvelopeError(response, {
                defaultMessage: 'Server returned an unsuccessful response envelope',
            });
            captureRecoverableApiError(envelopeError, {
                phase: 'response-envelope',
                endpoint: response?.config?.url,
                method: response?.config?.method,
            });
            throw envelopeError;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (isTimeoutError(error)) {
            const normalized = normalizeApiError(error, {
                phase: 'timeout',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            error.isTimeout = true;
            error.retryable = normalized.retryable;
            error.retryAfterMs = normalized.retryAfterMs;
            error.friendlyMessage = normalized.userMessage;
            captureRecoverableApiError(error, {
                phase: 'timeout',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            return Promise.reject(error);
        }

        if (status === 404 || status === 405 || status === 501) {
            captureContractMismatch(error, {
                phase: 'http-error',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
        }

        // Graceful degradation for sleeping Render backend (free tier)
        if (status === 502 || status === 503 || status === 504) {
            const normalized = normalizeApiError(error, {
                phase: 'backend-sleep',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            // Attach a user-friendly message so consumers can display it
            error.isBackendSleeping = true;
            error.retryable = normalized.retryable;
            error.retryAfterMs = normalized.retryAfterMs;
            error.friendlyMessage =
                'The server is waking up — this usually takes 15-30 seconds. Please try again shortly.';
            captureRecoverableApiError(error, {
                phase: 'backend-sleep',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            apiClientWarn(`⏳ Backend returned ${status} — likely waking from sleep`);
            return Promise.reject(error);
        }

        // Handle 401 Token Refresh
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isRefreshRequest(originalRequest) &&
            !isPublicAuthRequest(originalRequest) &&
            !originalRequest._skipAuthRefresh
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

            const hasRefreshCapability =
                AUTH_CONFIG.httpOnlyCookieAuth || Boolean(secureStorage.getRefreshToken());
            if (!hasRefreshCapability) {
                forceLogoutAndRedirect(error);
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

        if (isRetryableError(error)) {
            const normalized = normalizeApiError(error, {
                phase: 'retryable',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            error.retryable = normalized.retryable;
            error.retryAfterMs = normalized.retryAfterMs;
            error.friendlyMessage = normalized.userMessage || toUserMessage(error);
            captureRecoverableApiError(error, {
                phase: 'retryable',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
        }

        if (!error.normalizedError) {
            error.normalizedError = normalizeApiError(error, {
                phase: 'interceptor-reject',
                endpoint: originalRequest?.url,
                method: originalRequest?.method,
            });
            error.friendlyMessage = error.friendlyMessage || error.normalizedError.userMessage;
            error.retryable =
                typeof error.retryable === 'boolean'
                    ? error.retryable
                    : error.normalizedError.retryable;
            if (!Number.isFinite(error.retryAfterMs) && Number.isFinite(error.normalizedError.retryAfterMs)) {
                error.retryAfterMs = error.normalizedError.retryAfterMs;
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
        // Don't retry most 4xx client errors; allow 429 throttling to back off and retry.
        const status = error?.response?.status;
        const shouldRetryClientError = status === 429;
        const isRecoverable = isRetryableError(error) || shouldRetryClientError;
        const retryAfterMs = parseRetryAfterMs(error);
        const computedDelay = Number.isFinite(error?.retryAfterMs)
            ? error.retryAfterMs
            : Number.isFinite(retryAfterMs)
                ? retryAfterMs
            : delay;
        if (
            retries === 0 ||
            error.isBackendSleeping ||
            !isRecoverable ||
            (status >= 400 && status < 500 && !shouldRetryClientError)
        ) {
            throw error;
        }

        const waitMs = applyBackoffJitter(computedDelay);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return retryRequest(fn, retries - 1, delay);
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
