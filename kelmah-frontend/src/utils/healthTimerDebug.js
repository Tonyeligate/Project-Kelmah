const DEBUG_STORAGE_KEY = 'kelmah:debugHealthTimers';
const DEBUG_EVENT_NAME = 'kelmah:health-timer-fired';
const DEBUG_MARKER_KEY = '__KELMAH_HEALTH_TIMER_MARKER__';
const DEBUG_LOG_KEY = '__KELMAH_HEALTH_TIMER_LOG__';

const readDebugFlag = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.__KELMAH_DEBUG_HEALTH_TIMERS__ === true) {
    return true;
  }

  try {
    if (localStorage.getItem(DEBUG_STORAGE_KEY) === 'true') {
      return true;
    }
  } catch {
    // Ignore storage access failures.
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debugHealthTimers') === '1';
  } catch {
    return false;
  }
};

export const isHealthTimerDebugEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  return readDebugFlag();
};

export const markHealthTimer = (source, detail = {}) => {
  if (!isHealthTimerDebugEnabled() || typeof window === 'undefined') {
    return null;
  }

  const payload = {
    source,
    at: new Date().toISOString(),
    page: window.location.pathname,
    visibilityState:
      typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    ...detail,
  };

  window[DEBUG_MARKER_KEY] = payload;

  const history = Array.isArray(window[DEBUG_LOG_KEY])
    ? window[DEBUG_LOG_KEY]
    : [];
  window[DEBUG_LOG_KEY] = [...history, payload].slice(-25);

  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent(DEBUG_EVENT_NAME, { detail: payload }),
    );
  }

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info('[kelmah-health-timer]', payload);
  }

  return payload;
};