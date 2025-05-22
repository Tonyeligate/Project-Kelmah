import React, { createContext, useContext, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useLocation } from 'react-router-dom';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children, measurementId }) => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.initialize(measurementId);
  }, [measurementId]);

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);

  const trackEvent = (category, action, label) => {
    ReactGA.event({
      category,
      action,
      label,
    });
  };

  const trackTiming = (category, variable, value) => {
    ReactGA.timing({
      category,
      variable,
      value,
    });
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackTiming }}>
      {children}
    </AnalyticsContext.Provider>
  );
}; 