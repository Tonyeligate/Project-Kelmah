import { lazy } from 'react';

/**
 * Lazy load a component with improved error handling
 * @param {Function} importFn - Import function for the component
 * @returns {React.LazyExoticComponent} - Lazy loaded component
 */
export const lazyLoad = (importFn) => {
  const LazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Error loading component:', error);
      // Could return a fallback component here
      throw error;
    }
  });

  return LazyComponent;
};
