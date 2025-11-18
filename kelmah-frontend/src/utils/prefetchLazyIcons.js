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
          const payload = component._payload;
          const initializer = component._init || payload?._init;

          if (typeof initializer === 'function') {
            return initializer(payload);
          }

          if (typeof component === 'function') {
            return component();
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
