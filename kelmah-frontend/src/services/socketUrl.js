/**
 * Shared WebSocket URL resolution utility.
 * All socket consumers should use this instead of inline URL fetching.
 * Reads from runtime-config.json; falls back to window.location.origin (no hardcoded URLs).
 */

let cachedUrl = null;
let fetchPromise = null;

/**
 * Resolve the backend WebSocket URL from runtime-config.json.
 * Caches the result so repeated calls don't re-fetch.
 * @returns {Promise<string>} The resolved WebSocket URL
 */
export async function getWebSocketUrl() {
  if (cachedUrl) return cachedUrl;

  // Prevent parallel fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch('/runtime-config.json');
      if (response.ok) {
        const config = await response.json();
        const url =
          config.websocketUrl ||
          config.localtunnelUrl ||
          config.ngrokUrl ||
          config.WS_URL ||
          config.API_URL;
        if (url) {
          cachedUrl = url;
          return url;
        }
      }
    } catch {
      // Config unavailable; fall through to dynamic default
    }

    // Dynamic fallback: same origin (works for both localhost dev and Vercel prod)
    const fallback =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost:5000';

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
