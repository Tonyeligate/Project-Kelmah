/**
 * Service Warm-Up Utility
 * 
 * Wakes up backend services that may have gone to sleep on Render free tier.
 * Called when the app initializes to reduce cold start delays.
 */

import { getApiBaseUrl } from '../config/environment';

const WARMUP_ENDPOINTS = [
  '/health',
  '/health/aggregate'
];

const WARMUP_TIMEOUT = 30000; // 30 seconds for cold starts

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
export const warmUpServices = async () => {
  try {
    const baseUrl = await getApiBaseUrl();
    
    if (!baseUrl) {
      console.warn('⚠️ Service warm-up: No API base URL configured');
      return { success: false, reason: 'no_base_url' };
    }

    console.log('🔥 Warming up backend services...');
    const startTime = Date.now();

    // Ping health endpoints in parallel
    const results = await Promise.allSettled(
      WARMUP_ENDPOINTS.map(endpoint => pingEndpoint(baseUrl, endpoint))
    );

    const elapsed = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const wakingUp = results.filter(r => r.status === 'fulfilled' && r.value?.isWakingUp).length;

    console.log(`🔥 Service warm-up complete: ${successful}/${results.length} healthy, ${wakingUp} waking up (${elapsed}ms)`);

    // If services are waking up, schedule a retry
    if (wakingUp > 0) {
      console.log('⏳ Services are waking up, will retry in 10 seconds...');
      setTimeout(() => warmUpServices(), 10000);
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
    console.error('🔥 Service warm-up failed:', error);
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
      console.log('✅ All services are ready');
      return true;
    }
    // Wait 5 seconds before retry
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.warn('⚠️ Services warm-up timeout - some services may still be starting');
  return false;
};

export default warmUpServices;
