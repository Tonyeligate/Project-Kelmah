import { lazy } from 'react';
import { devWarn as lazyRetryWarn } from '../modules/common/utils/devLogger';

const isBrowser = () => typeof window !== 'undefined';

const isChunkLoadError = (error) => {
  if (!error) {
    return false;
  }

  const message = error.message || '';
  const name = error.name || '';

  return (
    /Loading chunk [\d]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(name) ||
    /Failed to fetch dynamically imported module/i.test(message)
  );
};

const RELOAD_GUARD_KEY = 'lazy-retry-reload-at';
const RELOAD_GUARD_WINDOW_MS = 30_000;

const canTriggerReload = () => {
  if (!isBrowser()) {
    return false;
  }

  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (last && Date.now() - last < RELOAD_GUARD_WINDOW_MS) {
      return false;
    }
  } catch {
    // Fall through; if storage is unavailable we still allow one reload attempt.
  }

  return true;
};

const markReloadTriggered = () => {
  if (!isBrowser()) {
    return;
  }

  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore storage write issues in restrictive browser modes.
  }
};

const purgeCachesAndReload = (() => {
  let purgeInFlight = false;

  const purgeCaches = async () => {
    if (!isBrowser()) {
      return;
    }

    const tasks = [];

    if ('caches' in window) {
      tasks.push(
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => /kelmah|vite|workbox|static|assets/i.test(key))
                .map((key) => caches.delete(key).catch(() => false)),
            ),
          ),
      );
    }

    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      try {
        navigator.serviceWorker.controller?.postMessage({
          type: 'KELMAH_CLEAR_RUNTIME_CACHES',
        });
      } catch (error) {
        lazyRetryWarn('lazyWithRetry service worker message failed:', error);
      }

      tasks.push(
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations.map((registration) =>
                registration.unregister().catch(() => false),
              ),
            ),
          ),
      );
    }

    await Promise.allSettled(tasks);
  };

  return () => {
    if (!isBrowser()) {
      return;
    }

    if (!canTriggerReload()) {
      return;
    }

    if (purgeInFlight) {
      return;
    }

    purgeInFlight = true;

    purgeCaches()
      .catch((error) => {
        lazyRetryWarn('lazyWithRetry cache purge failed:', error);
      })
      .finally(() => {
        markReloadTriggered();
        requestAnimationFrame(() => {
          window.location.reload();
        });
      });
  };
})();

const buildStorageKey = (retryKey, factory) => {
  if (retryKey) {
    return `lazy-retry-${retryKey}`;
  }

  return `lazy-retry-${factory.toString().length}`;
};

/**
 * Wraps React.lazy imports so that stale chunks trigger one safe reload
 * instead of leaving the route broken until cache is cleared manually.
 */
export const lazyWithRetry = (factory, options = {}) => {
  const { retryKey, maxRetries = 1 } = options;
  const storageKey = buildStorageKey(retryKey, factory);

  return lazy(async () => {
    try {
      const module = await factory();
      if (isBrowser()) {
        sessionStorage.removeItem(storageKey);
      }
      return module;
    } catch (error) {
      if (!isChunkLoadError(error) || !isBrowser()) {
        throw error;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        window.dispatchEvent(
          new CustomEvent('app:chunkLoadOffline', {
            detail: {
              message: error?.message,
              name: error?.name,
            },
          }),
        );
        throw error;
      }

      let attempts = 0;

      try {
        const stored = sessionStorage.getItem(storageKey);
        attempts = Number(stored) || 0;
      } catch (storageError) {
        lazyRetryWarn('lazyWithRetry storage error:', storageError);
      }

      if (attempts >= maxRetries) {
        sessionStorage.removeItem(storageKey);
        throw error;
      }

      try {
        sessionStorage.setItem(storageKey, String(attempts + 1));
      } catch (storageError) {
        lazyRetryWarn('lazyWithRetry storage write failed:', storageError);
      }

      purgeCachesAndReload();

      throw error;
    }
  });
};
