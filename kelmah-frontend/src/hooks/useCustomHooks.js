import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for handling API requests with loading and error states
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
};

// Hook for handling infinite scroll
export const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 100 } = options;
  const [isFetching, setIsFetching] = useState(false);
  
  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop <= clientHeight + threshold && !isFetching) {
      setIsFetching(true);
    }
  }, [threshold, isFetching]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!isFetching) return;
    callback().then(() => setIsFetching(false));
  }, [isFetching, callback]);

  return [isFetching, setIsFetching];
};

// Hook for handling local storage with expiration
export const useLocalStorage = (key, initialValue, expirationInMinutes = 0) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const { value, timestamp } = JSON.parse(item);
        if (expirationInMinutes > 0) {
          const now = new Date().getTime();
          if (now - timestamp > expirationInMinutes * 60 * 1000) {
            window.localStorage.removeItem(key);
            return initialValue;
          }
        }
        return value;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = {
        value,
        timestamp: new Date().getTime(),
      };
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Hook for handling keyboard shortcuts
export const useKeyboardShortcut = (targetKey, callback, options = {}) => {
  const { ctrlKey = false, altKey = false, shiftKey = false } = options;

  useEffect(() => {
    const handler = (event) => {
      if (
        event.key === targetKey &&
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey
      ) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [targetKey, callback, ctrlKey, altKey, shiftKey]);
}; 