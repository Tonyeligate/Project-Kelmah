/**
 * Service Warm-Up Utility
 * 
 * Wakes up backend services that may have gone to sleep on Render free tier.
 * Called when the app initializes to reduce cold start delays.
 */

import { getApiBaseUrl } from '../config/environment';

const WARMUP_ENDPOINTS = [
  '/health/aggregate'
];

const WARMUP_TIMEOUT = 30000; // 30 seconds for cold starts
const MAX_WARMUP_RETRIES = 1;
const RETRY_DELAY_MS = 15000;
const WARMUP_COOLDOWN_MS = 15 * 60 * 1000;
const LAST_WARMUP_AT_KEY = 'kelmah:lastServiceWarmupAt';
let warmUpRetryCount = 0;
let warmUpRetryTimer = null;

const clearScheduledWarmUpRetry = () => {
  if (warmUpRetryTimer) {
    clearTimeout(warmUpRetryTimer);
    warmUpRetryTimer = null;
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
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeoutId);
    return {
      endpoint,
      success: response.ok,
      status: response.status,
      isWakingUp: response.status === 503 // Service starting up
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      endpoint,
      success: false,
      error: error.name === 'AbortError' ? 'Timeout (service may be waking up)' : error.message
    };
  }
};

/**
 * Wake up all backend services
 * Call this early in app initialization
 */
export const warmUpServices = async (options = {}) => {
  const { force = false, maxRetries = MAX_WARMUP_RETRIES } = options;

  if (!force) {
    clearScheduledWarmUpRetry();
    warmUpRetryCount = 0;
    const elapsed = Date.now() - getLastWarmupAt();
    if (elapsed > 0 && elapsed < WARMUP_COOLDOWN_MS) {
      return { success: true, skipped: true, reason: 'cooldown' };
    }
  }

  try {
    const baseUrl = await getApiBaseUrl();
    
    if (!baseUrl) {
      if (import.meta.env.DEV) console.warn('⚠️ Service warm-up: No API base URL configured');
      return { success: false, reason: 'no_base_url' };
    }

    if (import.meta.env.DEV) console.log('🔥 Warming up backend services...');
    const startTime = Date.now();
    setLastWarmupAt(startTime);

    // Ping health endpoints in parallel
    const results = await Promise.allSettled(
      WARMUP_ENDPOINTS.map(endpoint => pingEndpoint(baseUrl, endpoint))
    );

    const elapsed = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const wakingUp = results.filter(r => r.status === 'fulfilled' && r.value?.isWakingUp).length;

    if (import.meta.env.DEV) console.log(`🔥 Service warm-up complete: ${successful}/${results.length} healthy, ${wakingUp} waking up (${elapsed}ms)`);

    // If services are waking up, schedule a limited retry.
    if (wakingUp > 0) {
      if (warmUpRetryCount < maxRetries) {
        warmUpRetryCount += 1;
        if (import.meta.env.DEV) console.log(`⏳ Services waking up, retry ${warmUpRetryCount}/${maxRetries} in ${RETRY_DELAY_MS / 1000} seconds...`);
        if (!warmUpRetryTimer) {
          warmUpRetryTimer = setTimeout(() => {
            warmUpRetryTimer = null;
            warmUpServices({ force: true, maxRetries });
          }, RETRY_DELAY_MS);
        }
      } else {
        if (import.meta.env.DEV) console.warn('⚠️ Max warm-up retries reached. Some services may still be waking up.');
        clearScheduledWarmUpRetry();
        warmUpRetryCount = 0;
      }
    } else {
      clearScheduledWarmUpRetry();
      warmUpRetryCount = 0;
    }

    return {
      success: successful > 0,
      healthy: successful,
      total: results.length,
      wakingUp,
      elapsed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
    };
  } catch (error) {
    clearScheduledWarmUpRetry();
    warmUpRetryCount = 0;
    if (import.meta.env.DEV) console.error('🔥 Service warm-up failed:', error);
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
      if (import.meta.env.DEV) console.log('✅ All services are ready');
      return true;
    }
    // Wait 5 seconds before retry
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  if (import.meta.env.DEV) console.warn('⚠️ Services warm-up timeout - some services may still be starting');
  return false;
};

export default warmUpServices;
