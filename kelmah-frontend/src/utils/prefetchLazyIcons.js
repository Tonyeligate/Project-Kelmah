const getIdleCallback = () => {
  if (typeof window === 'undefined') {
    return (cb) =>
      setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 0);
  }

  return (
    window.requestIdleCallback ||
    function fallback(cb) {
      return setTimeout(
        () => cb({ didTimeout: false, timeRemaining: () => 0 }),
        150,
      );
    }
  );
};

const getCancelIdleCallback = () => {
  if (typeof window === 'undefined') {
    return (id) => clearTimeout(id);
  }
  return window.cancelIdleCallback || clearTimeout;
};

/**
 * Warm up React.lazy icon factories once the browser is idle
 * @param {Record<string, React.LazyExoticComponent<any>>} lazyIconMap
 */
export const prefetchLazyIcons = (lazyIconMap) => {
  if (!lazyIconMap || typeof lazyIconMap !== 'object') {
    return;
  }

  const idle = getIdleCallback();
  const cancel = getCancelIdleCallback();
  const scheduled = idle(async () => {
    try {
      await Promise.all(
        Object.values(lazyIconMap).map(async (component) => {
          if (!component) return null;
          try {
            // H21 fix: Avoid relying on React internals (_payload, _init).
            // Instead, call the lazy factory if it's a callable or has a
            // _payload with a function status. Wrapped in its own try/catch
            // so one failure doesn't block others.
            if (typeof component === 'function' && component.$$typeof) {
              // React.lazy component — try triggering the import via _payload
              const payload = component._payload;
              if (payload && typeof payload._result === 'function') {
                await payload._result();
              } else if (payload && typeof payload === 'object' && payload._init) {
                payload._init(payload);
              }
            } else if (typeof component === 'function') {
              await component();
            }
          } catch {
            // Individual icon prefetch failure is non-critical
          }
          return null;
        }),
      );
    } catch (error) {
      console.warn('[prefetchLazyIcons] Failed to warm icons:', error);
    }
  });

  return () => cancel(scheduled);
};

export default prefetchLazyIcons;
