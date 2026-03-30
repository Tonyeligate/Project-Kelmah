/**
 * Service Warm-Up Utility
 *
 * Wakes up backend services that may have gone to sleep on Render free tier.
 * Called when the app initializes to reduce cold start delays.
 */

import { getApiBaseUrl } from '../config/environment';
import {
  createFeatureLogger,
  devError as warmupError,
  devWarn as warmupWarn,
} from '../modules/common/utils/devLogger';

const WARMUP_ENDPOINTS = ['/health/aggregate'];

const WARMUP_TIMEOUT = 30000; // 30 seconds for cold starts
const MAX_WARMUP_RETRIES = 1;
const RETRY_DELAY_MS = 15000;
const WARMUP_COOLDOWN_MS = 15 * 60 * 1000;
const LAST_WARMUP_AT_KEY = 'kelmah:lastServiceWarmupAt';
const DEFAULT_HEALTH_ENDPOINT = '/health';

const isOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

const buildHealthUrl = (baseUrl, endpoint = DEFAULT_HEALTH_ENDPOINT) => {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  if (!baseUrl) {
    return `/api${normalizedEndpoint}`;
  }

  const trimmedBase =
    baseUrl.endsWith('/') && baseUrl !== '/' ? baseUrl.slice(0, -1) : baseUrl;

  if (trimmedBase === '') {
    return `/api${normalizedEndpoint}`;
  }

  if (trimmedBase.endsWith('/api')) {
    return `${trimmedBase}${normalizedEndpoint}`;
  }

  return `${trimmedBase}/api${normalizedEndpoint}`;
};

const warmupLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_SERVICE_HEALTH',
});

let lastWarmupStatus = {
  state: 'idle',
  message: 'Services are idle',
  updatedAt: 0,
};

const createWarmUpRetryState = () => ({
  retryCount: 0,
  retryTimer: null,
});

const setWarmupStatus = (nextStatus) => {
  lastWarmupStatus = {
    ...lastWarmupStatus,
    ...nextStatus,
    updatedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('kelmah:warmup-status', { detail: lastWarmupStatus }),
    );
  }
};

export const getWarmupStatus = () => ({ ...lastWarmupStatus });

const clearScheduledWarmUpRetry = (retryState) => {
  if (retryState.retryTimer) {
    clearTimeout(retryState.retryTimer);
    retryState.retryTimer = null;
  }
};

const getLastWarmupAt = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const stored = Number(localStorage.getItem(LAST_WARMUP_AT_KEY) || 0);
  return Number.isFinite(stored) ? stored : 0;
};

const setLastWarmupAt = (timestamp) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(LAST_WARMUP_AT_KEY, String(timestamp));
};

/**
 * Ping a single endpoint with timeout
 */
const pingEndpoint = async (baseUrl, endpoint) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return {
      endpoint,
      success: response.ok,
      status: response.status,
      isWakingUp: response.status === 503, // Service starting up
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      endpoint,
      success: false,
      error:
        error.name === 'AbortError'
          ? 'Timeout (service may be waking up)'
          : error.message,
    };
  }
};

/**
 * Wake up all backend services
 * Call this early in app initialization
 */
export const warmUpService = async (serviceUrl) => {
  if (isOffline()) {
    return false;
  }

  warmupLog(`🔥 Warming up service: ${serviceUrl || 'gateway'}`);

  try {
    const base = await Promise.resolve(getApiBaseUrl()).catch(() => '/api');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const warmupUrl = buildHealthUrl(base, '/health');

    const response = await fetch(warmupUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    warmupLog(
      `🔥 Service warmed up - ${serviceUrl || 'gateway'}: ${response.status}`,
    );
    return response.ok;
  } catch (error) {
    warmupWarn(
      `🔥 Service warmup failed - ${serviceUrl || 'gateway'}:`,
      error.message,
    );
    return false;
  }
};

/**
 * Wake up all backend services
 * Call this early in app initialization
 */
export const warmUpServices = async (options = {}) => {
  const { force = false, maxRetries = MAX_WARMUP_RETRIES } = options;
  const retryState = options.retryState || createWarmUpRetryState();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setWarmupStatus({
      state: 'offline',
      message:
        'You are offline. Service warm-up will run when connection returns.',
    });
    clearScheduledWarmUpRetry(retryState);
    retryState.retryCount = 0;
    return { success: false, skipped: true, reason: 'offline' };
  }

  if (!force) {
    clearScheduledWarmUpRetry(retryState);
    retryState.retryCount = 0;
    const elapsed = Date.now() - getLastWarmupAt();
    if (elapsed > 0 && elapsed < WARMUP_COOLDOWN_MS) {
      setWarmupStatus({
        state: 'cooldown',
        message: 'Services were checked recently. Reusing latest health state.',
      });
      return { success: true, skipped: true, reason: 'cooldown' };
    }
  }

  try {
    const baseUrl = await getApiBaseUrl();

    if (!baseUrl) {
      warmupWarn('⚠️ Service warm-up: No API base URL configured');
      setWarmupStatus({
        state: 'error',
        message: 'Could not determine API endpoint for warm-up.',
      });
      return { success: false, reason: 'no_base_url' };
    }

    warmupLog('🔥 Warming up backend services...');
    setWarmupStatus({
      state: 'starting',
      message:
        'Checking backend availability. This can take up to a minute after idle time.',
    });
    const startTime = Date.now();
    setLastWarmupAt(startTime);

    // Ping health endpoints in parallel
    const results = await Promise.allSettled(
      WARMUP_ENDPOINTS.map((endpoint) => pingEndpoint(baseUrl, endpoint)),
    );

    const elapsed = Date.now() - startTime;
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value?.success,
    ).length;
    const wakingUp = results.filter(
      (r) => r.status === 'fulfilled' && r.value?.isWakingUp,
    ).length;

    warmupLog(
      `🔥 Service warm-up complete: ${successful}/${results.length} healthy, ${wakingUp} waking up (${elapsed}ms)`,
    );

    // If services are waking up, schedule a limited retry.
    if (wakingUp > 0) {
      if (retryState.retryCount < maxRetries) {
        retryState.retryCount += 1;
        warmupLog(
          `⏳ Services waking up, retry ${retryState.retryCount}/${maxRetries} in ${RETRY_DELAY_MS / 1000} seconds...`,
        );
        if (!retryState.retryTimer) {
          retryState.retryTimer = setTimeout(() => {
            retryState.retryTimer = null;
            warmUpServices({ force: true, maxRetries, retryState });
          }, RETRY_DELAY_MS);
        }
      } else {
        warmupWarn(
          '⚠️ Max warm-up retries reached. Some services may still be waking up.',
        );
        clearScheduledWarmUpRetry(retryState);
        retryState.retryCount = 0;
      }
    } else {
      setWarmupStatus({
        state: successful > 0 ? 'ready' : 'degraded',
        message:
          successful > 0
            ? 'Backend services are ready.'
            : 'Backend services are slow to respond. You can retry shortly.',
      });
      clearScheduledWarmUpRetry(retryState);
      retryState.retryCount = 0;
    }

    return {
      success: successful > 0,
      healthy: successful,
      total: results.length,
      wakingUp,
      elapsed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { error: r.reason },
      ),
    };
  } catch (error) {
    setWarmupStatus({
      state: 'error',
      message: 'Service warm-up failed. Retry in a few moments.',
    });
    clearScheduledWarmUpRetry(retryState);
    retryState.retryCount = 0;
    warmupError('🔥 Service warm-up failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if services are awake and ready
 */
export const checkServicesReady = async () => {
  const result = await warmUpServices();
  return result.success && result.wakingUp === 0;
};

/**
 * Wait for services to be ready (with max wait time)
 */
export const waitForServices = async (maxWaitMs = 60000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const ready = await checkServicesReady();
    if (ready) {
      warmupLog('✅ All services are ready');
      return true;
    }
    // Wait 5 seconds before retry
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  warmupWarn(
    '⚠️ Services warm-up timeout - some services may still be starting',
  );
  return false;
};

export default warmUpServices;
