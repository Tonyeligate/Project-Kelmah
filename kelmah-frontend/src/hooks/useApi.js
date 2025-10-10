/**
 * Universal API Hook
 * Handles all API calls with proper error handling, loading states, and no mock fallbacks
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

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

  const executeApi = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        setData(result);
        setRetryCount(0);

        if (onSuccess) {
          onSuccess(result);
        }

        if (showSuccessToast && result) {
          toast.success('Operation completed successfully');
        }

        return result;
      } catch (err) {
        console.error('API Error:', err);
        setError(err);

        // Retry logic
        if (retryCount < retryAttempts) {
          setTimeout(
            () => {
              setRetryCount((prev) => prev + 1);
              executeApi(...args);
            },
            retryDelay * (retryCount + 1),
          ); // Exponential backoff
          return;
        }

        if (onError) {
          onError(err);
        }

        if (showErrorToast) {
          const errorMessage =
            err.response?.data?.message || err.message || 'An error occurred';
          toast.error(`Service Error: ${errorMessage}`);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      apiFunction,
      onSuccess,
      onError,
      showErrorToast,
      showSuccessToast,
      retryCount,
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
    setData(initialData);
    setError(null);
    setLoading(false);
    setRetryCount(0);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      executeApi();
    }
  }, [immediate, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const executeAll = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const promises = Object.entries(apiCalls).map(
      async ([key, apiFunction]) => {
        try {
          const result = await apiFunction();
          return { key, result, error: null };
        } catch (error) {
          console.error(`API Error for ${key}:`, error);
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

      setResults(newResults);
      setErrors(newErrors);
    } catch (error) {
      console.error('Multiple API calls failed:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCalls]);

  const refetchAll = useCallback(() => {
    return executeAll();
  }, [executeAll]);

  useEffect(() => {
    if (immediate) {
      executeAll();
    }
  }, [immediate, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const submit = useCallback(
    async (formData) => {
      try {
        setSubmitting(true);
        setError(null);
        setSuccess(false);

        const result = await submitFunction(formData);

        setSuccess(true);

        if (onSuccess) {
          onSuccess(result);
        }

        if (showSuccessToast) {
          toast.success('Form submitted successfully');
        }

        if (resetOnSuccess) {
          setTimeout(() => setSuccess(false), 3000);
        }

        return result;
      } catch (err) {
        console.error('Submit Error:', err);
        setError(err);

        if (onError) {
          onError(err);
        }

        const errorMessage =
          err.response?.data?.message || err.message || 'Submission failed';
        toast.error(errorMessage);

        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [submitFunction, onSuccess, onError, resetOnSuccess, showSuccessToast],
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  }, []);

  return {
    submit,
    submitting,
    error,
    success,
    reset,
  };
};

export default useApi;
