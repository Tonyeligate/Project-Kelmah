import React, { useEffect, useContext, createContext } from 'react';
import * as Sentry from "@sentry/react";
import { BrowserTracing } from '@sentry/tracing';
import { NODE_ENV, SENTRY_DSN, API_URL, ENABLE_ERROR_MONITORING, IS_PRODUCTION } from '../../config/env';

const PerformanceContext = createContext();

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};

export const PerformanceProvider = ({ children }) => {
  useEffect(() => {
    if (ENABLE_ERROR_MONITORING) {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1.0,
        environment: NODE_ENV,
        tracingOrigins: ['localhost', API_URL],
      });
    }
  }, []);

  const measurePerformance = (label, callback) => {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    const duration = end - start;

    if (IS_PRODUCTION) {
      Sentry.captureMessage(`Performance: ${label} took ${duration}ms`);
    } else {
      console.log(`Performance: ${label} took ${duration}ms`);
    }

    return result;
  };

  const trackResourceTiming = () => {
    const resources = performance.getEntriesByType('resource');
    const metrics = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      startTime: resource.startTime,
      transferSize: resource.transferSize,
    }));

    if (IS_PRODUCTION) {
      Sentry.captureMessage('Resource Timing', {
        extra: { metrics },
      });
    }
  };

  return (
    <PerformanceContext.Provider value={{ measurePerformance, trackResourceTiming }}>
      {children}
    </PerformanceContext.Provider>
  );
}; 