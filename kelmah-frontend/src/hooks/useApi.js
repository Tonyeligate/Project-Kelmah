/**
 * Universal API Hook
 * Handles all API calls with proper error handling, loading states, and no mock fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { devError as useApiError } from '../modules/common/utils/devLogger';

const parseRetryAfterMs = (error) => {
  const headerValue =
    error?.response?.headers?.['retry-after'] ||
    error?.response?.headers?.RetryAfter ||
    error?.response?.headers?.['Retry-After'];

  if (!headerValue) {
    return null;
  }

  const value = String(headerValue).trim();
  if (/^\d+$/.test(value)) {
    return Math.max(Number(value) * 1000, 0);
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(dateMs - Date.now(), 0);
  }

  return null;
};

const shouldRetryError = (error) => {
  const status = error?.response?.status;

  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }

  if (error?.name === 'AbortError') {
    return false;
  }

  return true;
};

const randomIntInclusive = (maxInclusive) => {
  const cappedMax = Math.max(0, Math.floor(maxInclusive));
  if (cappedMax === 0) {
    return 0;
  }

  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0] % (cappedMax + 1);
  }

  const entropySource = `${Date.now()}:${Math.floor((typeof performance !== 'undefined' ? performance.now() : 0) * 1000)}`;
  let hash = 0;

  for (let index = 0; index < entropySource.length; index += 1) {
    hash = (hash * 31 + entropySource.charCodeAt(index)) >>> 0;
  }

  return hash % (cappedMax + 1);
};

const computeRetryDelay = (error, attempt, baseDelay) => {
  const retryAfterMs = parseRetryAfterMs(error);
  const backoffBase = Number.isFinite(retryAfterMs)
    ? retryAfterMs
    : baseDelay * 2 ** attempt;
  const boundedBackoff = Math.max(250, Math.min(backoffBase, 10000));
  const jitterCap = Math.max(100, Math.floor(boundedBackoff * 0.2));
  const jitter = randomIntInclusive(jitterCap);
  return boundedBackoff + jitter;
};

const getRecoveryGuidance = (error) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      userMessage: 'No internet connection detected.',
      suggestedAction: 'Reconnect to the internet, then retry.',
      isRecoverable: true,
    };
  }

  const status = error?.response?.status;
  const message =
    error?.response?.data?.message || error?.message || 'Request failed';

  if (status === 429) {
    return {
      userMessage: message,
      suggestedAction: 'Too many requests. Wait a moment, then try again.',
      isRecoverable: true,
    };
  }

  if (status === 503 || status === 504) {
    return {
      userMessage: message,
      suggestedAction: 'Service may be waking up. Retry in 30-60 seconds.',
      isRecoverable: true,
    };
  }

  if (status === 401 || status === 403) {
    return {
      userMessage: message,
      suggestedAction: 'Sign in again to refresh your access.',
      isRecoverable: true,
    };
  }

  if (status === 404) {
    return {
      userMessage: message,
      suggestedAction: 'The requested item may have moved or been removed.',
      isRecoverable: false,
    };
  }

  if (String(message).toLowerCase().includes('timeout')) {
    return {
      userMessage: message,
      suggestedAction: 'The request took too long. Retry in a few seconds.',
      isRecoverable: true,
    };
  }

  return {
    userMessage: message,
    suggestedAction: 'Try again. If this keeps happening, contact support.',
    isRecoverable: true,
  };
};

/**
 * Universal hook for handling API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch, mutate }
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    initialData = null,
    retryAttempts = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const executeApi = useCallback(
    async (...args) => {
      clearRetryTimeout();
      const requestId = ++activeRequestIdRef.current;
      const canUpdateState = () =>
        isMountedRef.current && requestId === activeRequestIdRef.current;

      try {
        if (canUpdateState()) {
          setLoading(true);
          setError(null);
        }

        const executeWithRetry = async (attempt = 0) => {
          try {
            const result = await apiFunction(...args);

            if (canUpdateState()) {
              setData(result);
              setRetryCount(0);

              if (onSuccess) {
                onSuccess(result);
              }

              if (showSuccessToast && result) {
                toast.success('Operation completed successfully');
              }
            }

            return result;
          } catch (err) {
            useApiError('API Error:', err);

            if (attempt < retryAttempts && shouldRetryError(err)) {
              if (
                typeof navigator !== 'undefined' &&
                navigator.onLine === false
              ) {
                throw err;
              }

              if (canUpdateState()) {
                setRetryCount(attempt + 1);
              }

              const retryDelayMs = computeRetryDelay(err, attempt, retryDelay);

              await new Promise((resolve) => {
                retryTimeoutRef.current = setTimeout(resolve, retryDelayMs);
              });

              if (!canUpdateState()) {
                return null;
              }

              return executeWithRetry(attempt + 1);
            }

            if (canUpdateState()) {
              const guidance = getRecoveryGuidance(err);
              if (err && typeof err === 'object') {
                err.userMessage = guidance.userMessage;
                err.suggestedAction = guidance.suggestedAction;
                err.isRecoverable = guidance.isRecoverable;
              }
              setError(err);

              if (onError) {
                onError(err);
              }

              if (showErrorToast) {
                toast.error(
                  `Service Error: ${guidance.userMessage} ${guidance.suggestedAction}`,
                );
              }
            }

            throw err;
          }
        };

        return await executeWithRetry(0);
      } finally {
        clearRetryTimeout();
        if (canUpdateState()) {
          setLoading(false);
        }
      }
    },
    [
      clearRetryTimeout,
      apiFunction,
      onSuccess,
      onError,
      showErrorToast,
      showSuccessToast,
      retryAttempts,
      retryDelay,
    ],
  );

  const refetch = useCallback(() => {
    return executeApi();
  }, [executeApi]);

  const mutate = useCallback(
    async (...args) => {
      return executeApi(...args);
    },
    [executeApi],
  );

  const reset = useCallback(() => {
    clearRetryTimeout();
    activeRequestIdRef.current += 1;
    setData(initialData);
    setError(null);
    setLoading(false);
    setRetryCount(0);
  }, [clearRetryTimeout, initialData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeRequestIdRef.current += 1;
      clearRetryTimeout();
    };
  }, [clearRetryTimeout]);

  useEffect(() => {
    if (immediate) {
      executeApi();
    }
  }, [immediate, executeApi, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    reset,
    retryCount,
  };
};

/**
 * Hook for handling paginated API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - Enhanced with pagination controls
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const { initialPage = 1, initialLimit = 10, ...restOptions } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const { data, loading, error, refetch, reset } = useApi(
    (...args) => apiFunction({ page, limit, ...args[0] }),
    {
      ...restOptions,
      dependencies: [page, limit, ...(restOptions.dependencies || [])],
      onSuccess: (result) => {
        if (result?.pagination) {
          setTotalPages(result.pagination.totalPages || 0);
          setTotalItems(result.pagination.totalItems || 0);
        }
        if (restOptions.onSuccess) {
          restOptions.onSuccess(result);
        }
      },
    },
  );

  const goToPage = useCallback(
    (newPage) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    reset,
    // Pagination specific
    page,
    limit,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Hook for handling multiple API calls simultaneously
 * @param {Object} apiCalls - Object with keys as names and values as API functions
 * @param {Object} options - Configuration options
 * @returns {Object} - Combined results from all API calls
 */
export const useMultipleApi = (apiCalls, options = {}) => {
  const { immediate = true, dependencies = [] } = options;

  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(immediate);
  const [errors, setErrors] = useState({});
  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);

  const executeAll = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    const canUpdateState = () =>
      isMountedRef.current && requestId === activeRequestIdRef.current;

    if (canUpdateState()) {
      setLoading(true);
      setErrors({});
    }

    const promises = Object.entries(apiCalls).map(
      async ([key, apiFunction]) => {
        try {
          const result = await apiFunction();
          return { key, result, error: null };
        } catch (error) {
          useApiError(`API Error for ${key}:`, error);
          return { key, result: null, error };
        }
      },
    );

    try {
      const resolvedPromises = await Promise.allSettled(promises);
      const newResults = {};
      const newErrors = {};

      resolvedPromises.forEach((promise) => {
        if (promise.status === 'fulfilled') {
          const { key, result, error } = promise.value;
          newResults[key] = result;
          if (error) {
            newErrors[key] = error;
          }
        }
      });

      if (canUpdateState()) {
        setResults(newResults);
        setErrors(newErrors);
      }
    } catch (error) {
      useApiError('Multiple API calls failed:', error);
    } finally {
      if (canUpdateState()) {
        setLoading(false);
      }
    }
  }, [apiCalls]);

  const refetchAll = useCallback(() => {
    return executeAll();
  }, [executeAll]);

  useEffect(() => {
    isMountedRef.current = true;

    if (immediate) {
      executeAll();
    }

    return () => {
      isMountedRef.current = false;
      activeRequestIdRef.current += 1;
    };
  }, [immediate, executeAll, ...dependencies]);

  return {
    results,
    loading,
    errors,
    refetchAll,
    hasErrors: Object.keys(errors).length > 0,
    allSuccessful:
      Object.keys(errors).length === 0 && Object.keys(results).length > 0,
  };
};

/**
 * Hook for handling form submissions with API calls
 * @param {Function} submitFunction - The API function to call on submit
 * @param {Object} options - Configuration options
 * @returns {Object} - Form submission utilities
 */
export const useApiSubmit = (submitFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    showSuccessToast = true,
  } = options;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const isMountedRef = useRef(true);
  const activeSubmitIdRef = useRef(0);
  const successResetTimerRef = useRef(null);

  const clearSuccessResetTimer = useCallback(() => {
    if (successResetTimerRef.current) {
      clearTimeout(successResetTimerRef.current);
      successResetTimerRef.current = null;
    }
  }, []);

  const submit = useCallback(
    async (formData) => {
      const submitId = ++activeSubmitIdRef.current;
      const canUpdateState = () =>
        isMountedRef.current && submitId === activeSubmitIdRef.current;

      try {
        clearSuccessResetTimer();
        if (canUpdateState()) {
          setSubmitting(true);
          setError(null);
          setSuccess(false);
        }

        const result = await submitFunction(formData);

        if (canUpdateState()) {
          setSuccess(true);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        if (showSuccessToast) {
          toast.success('Form submitted successfully');
        }

        if (resetOnSuccess) {
          successResetTimerRef.current = setTimeout(() => {
            if (canUpdateState()) {
              setSuccess(false);
            }
            successResetTimerRef.current = null;
          }, 3000);
        }

        return result;
      } catch (err) {
        useApiError('Submit Error:', err);
        const guidance = getRecoveryGuidance(err);
        if (err && typeof err === 'object') {
          err.userMessage = guidance.userMessage;
          err.suggestedAction = guidance.suggestedAction;
          err.isRecoverable = guidance.isRecoverable;
        }
        if (canUpdateState()) {
          setError(err);
        }

        if (onError) {
          onError(err);
        }

        toast.error(`${guidance.userMessage} ${guidance.suggestedAction}`);

        throw err;
      } finally {
        if (canUpdateState()) {
          setSubmitting(false);
        }
      }
    },
    [
      clearSuccessResetTimer,
      submitFunction,
      onSuccess,
      onError,
      resetOnSuccess,
      showSuccessToast,
    ],
  );

  const reset = useCallback(() => {
    clearSuccessResetTimer();
    activeSubmitIdRef.current += 1;
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  }, [clearSuccessResetTimer]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeSubmitIdRef.current += 1;
      clearSuccessResetTimer();
    };
  }, [clearSuccessResetTimer]);

  return {
    submit,
    submitting,
    error,
    success,
    reset,
  };
};

export default useApi;
