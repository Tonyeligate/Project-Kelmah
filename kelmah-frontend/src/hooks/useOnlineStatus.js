import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useOnlineStatus — tracks browser online / offline state and provides
 * a failed-request queue for offline-first resilience.
 *
 * Features:
 * - Listens to `online` / `offline` window events.
 * - Exposes `isOnline`, `wasOffline` (went offline at least once this session).
 * - Provides `enqueue(fn)` to queue async actions that will be retried when
 *   connectivity resumes.
 */
export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const queue = useRef([]);

  const flush = useCallback(async () => {
    const pending = [...queue.current];
    queue.current = [];
    for (const fn of pending) {
      try {
        await fn();
      } catch {
        // If retry also fails, re-queue for next reconnection
        queue.current.push(fn);
      }
    }
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      flush();
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [flush]);

  const enqueue = useCallback((fn) => {
    queue.current.push(fn);
  }, []);

  return { isOnline, wasOffline, enqueue };
}
