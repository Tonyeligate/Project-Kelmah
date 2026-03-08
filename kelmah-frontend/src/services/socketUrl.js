/**
 * Shared WebSocket URL resolution utility.
 * All socket consumers should use this instead of inline URL fetching.
 * Prefers env-driven backend origins, derives from the centralized API base when possible,
 * and only falls back to same-origin as a last resort.
 */

import { getApiBaseUrl, WS_CONFIG } from '../config/environment';

let cachedUrl = null;
let fetchPromise = null;

const sanitizeConfiguredUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  const clean = raw
    .trim()
    .replace(/^(https?:\/\/){2,}/i, 'https://')
    .replace(/^(wss?:\/\/)(https?:\/\/)+/i, '$1')
    .replace(/\/+$/, '');

  return clean || null;
};

const toHttpOrigin = (raw) => {
  const clean = sanitizeConfiguredUrl(raw);
  if (!clean) return null;

  if (clean.startsWith('/')) {
    return null;
  }

  return clean
    .replace(/^ws:/i, 'http:')
    .replace(/^wss:/i, 'https:')
    .replace(/\/socket\.io\/?$/i, '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/+$/, '');
};

const getSameOriginFallback = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

const extractRuntimeSocketValue = (config) => {
  if (!config || typeof config !== 'object') return null;

  return (
    config.websocketUrl ||
    config.localtunnelUrl ||
    config.ngrokUrl ||
    config.WS_URL ||
    config.API_URL ||
    config.apiGatewayUrl ||
    null
  );
};

/**
 * Resolve the backend WebSocket origin.
 * Caches the result so repeated calls don't re-fetch.
 * @returns {Promise<string>} The resolved backend origin for Socket.IO
 */
export async function getWebSocketUrl() {
  if (cachedUrl) return cachedUrl;

  // Prevent parallel fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const envSocketOrigin = toHttpOrigin(WS_CONFIG.url);
    if (envSocketOrigin) {
      cachedUrl = envSocketOrigin;
      return envSocketOrigin;
    }

    const apiDerivedOrigin = toHttpOrigin(getApiBaseUrl());

    try {
      const response = await fetch('/runtime-config.json');
      if (response.ok) {
        const config = await response.json();
        const runtimeValue = extractRuntimeSocketValue(config);
        const runtimeSocketOrigin = toHttpOrigin(runtimeValue);

        if (runtimeSocketOrigin) {
          cachedUrl = runtimeSocketOrigin;
          return runtimeSocketOrigin;
        }

        if (runtimeValue?.startsWith('/') && apiDerivedOrigin) {
          cachedUrl = apiDerivedOrigin;
          return apiDerivedOrigin;
        }
      }
    } catch {
      // Config unavailable; fall through to dynamic default
    }

    if (apiDerivedOrigin) {
      cachedUrl = apiDerivedOrigin;
      return apiDerivedOrigin;
    }

    // Last resort fallback for same-origin proxy setups
    const fallback = getSameOriginFallback();

    cachedUrl = fallback;
    return fallback;
  })();

  const result = await fetchPromise;
  fetchPromise = null;
  return result;
}

/**
 * Invalidate the cached URL (e.g. after tunnel restart).
 */
export function clearSocketUrlCache() {
  cachedUrl = null;
  fetchPromise = null;
}
