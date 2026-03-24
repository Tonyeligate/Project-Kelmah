import { api } from '../../../services/apiClient';
import workerService from '../../worker/services/workerService';
import { unwrapApiData } from '../../../services/responseNormalizer';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';
import {
  createFeatureLogger,
  devError,
} from '../../common/utils/devLogger';

const SUGGESTION_DEBOUNCE_MS = 250;
const STATIC_LOOKUP_TTL_MS = 5 * 60 * 1000;
const SEARCH_ENDPOINTS = ['/search', '/jobs/search'];
const SUGGESTION_ENDPOINTS = ['/search/suggestions', '/jobs/suggestions'];
const POPULAR_ENDPOINTS = ['/search/popular', '/jobs/popular-searches'];

let scheduledSuggestionTimer = null;
let scheduledSuggestionQuery = null;
let scheduledSuggestionPromise = null;
let scheduledSuggestionResolve = null;
let activeSuggestionController = null;
let activeSuggestionRequest = null;
const staticLookupCache = {
  categories: { data: null, expiresAt: 0, promise: null },
  skills: { data: null, expiresAt: 0, promise: null },
};

const devWarn = createFeatureLogger({
  flagName: 'VITE_DEBUG_FRONTEND',
  level: 'warn',
});

const isSuggestionAbort = (error) =>
  error?.name === 'AbortError' ||
  error?.name === 'CanceledError' ||
  error?.code === 'ERR_CANCELED';

const resolveScheduledSuggestion = (value) => {
  if (scheduledSuggestionResolve) {
    scheduledSuggestionResolve(value);
  }
  scheduledSuggestionTimer = null;
  scheduledSuggestionQuery = null;
  scheduledSuggestionPromise = null;
  scheduledSuggestionResolve = null;
};

const cancelScheduledSuggestion = () => {
  if (scheduledSuggestionTimer) {
    clearTimeout(scheduledSuggestionTimer);
  }
  resolveScheduledSuggestion([]);
};

const bindExternalAbort = (signal, controller) => {
  if (!signal) {
    return () => {};
  }

  if (signal.aborted) {
    controller.abort();
    return () => {};
  }

  const handleAbort = () => controller.abort();
  signal.addEventListener('abort', handleAbort, { once: true });
  return () => signal.removeEventListener('abort', handleAbort);
};

const shouldTryFallback = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501 || status === 503;
};

const requestWithFallback = async (endpoints, requestFactory) => {
  let lastError;

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    try {
      return await requestFactory(endpoint);
    } catch (error) {
      lastError = error;
      const canRetryWithFallback = index < endpoints.length - 1 && shouldTryFallback(error);
      if (!canRetryWithFallback) {
        break;
      }
    }
  }

  throw lastError;
};

const normalizeArrayPayload = (payload, keys = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
};

const getCachedLookup = async (cacheKey, requestFactory, responseKeys = []) => {
  const cacheEntry = staticLookupCache[cacheKey];
  const now = Date.now();

  if (cacheEntry?.data && cacheEntry.expiresAt > now) {
    return cacheEntry.data;
  }

  if (cacheEntry?.promise) {
    return cacheEntry.promise;
  }

  cacheEntry.promise = requestFactory()
    .then((response) => {
      const payload = unwrapApiData(response);
      const normalized = normalizeArrayPayload(payload, responseKeys);
      cacheEntry.data = normalized;
      cacheEntry.expiresAt = Date.now() + STATIC_LOOKUP_TTL_MS;
      return normalized;
    })
    .catch((error) => {
      if (cacheEntry?.data) {
        return cacheEntry.data;
      }
      throw error;
    })
    .finally(() => {
      cacheEntry.promise = null;
    });

  return cacheEntry.promise;
};

/**
 * Service for handling search functionality
 */
const searchService = {
  /**
   * Search for items based on query and filters
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} - Search results
   */
  search: async (query, filters = {}) => {
    try {
      const response = await requestWithFallback(SEARCH_ENDPOINTS, (endpoint) =>
        api.get(endpoint, {
          params: {
            q: query,
            ...filters,
          },
        }),
      );
      const payload = unwrapApiData(response);
      return normalizeArrayPayload(payload, ['results', 'items']);
    } catch (error) {
      devError('Search error:', error);
      throw error;
    }
  },

  /**
   * Search for workers
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Worker search results
   */
  searchWorkers: async (params = {}) => {
    try {
      return await workerService.searchWorkers(params);
    } catch (error) {
      devError('Worker search error:', error);
      throw error;
    }
  },

  /**
   * Search for jobs
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Job search results
   */
  searchJobs: async (params) => {
    try {
      const response = await requestWithFallback(SEARCH_ENDPOINTS, (endpoint) =>
        api.get(endpoint, { params }),
      );
      return unwrapApiData(response, { defaultValue: [] }) || [];
    } catch (error) {
      devError('Job search error:', error);
      throw error;
    }
  },

  /**
   * Get search suggestions based on partial query
   * @param {string} partialQuery - Partial search query
   * @returns {Promise<Array>} - Search suggestions
   */
  getSuggestions: (partialQuery, options = {}) => {
    const normalizedQuery = partialQuery?.trim();

    if (!normalizedQuery) {
      cancelScheduledSuggestion();
      activeSuggestionController?.abort();
      return Promise.resolve([]);
    }

    if (scheduledSuggestionQuery === normalizedQuery && scheduledSuggestionPromise) {
      return scheduledSuggestionPromise;
    }

    if (activeSuggestionRequest?.query === normalizedQuery) {
      return activeSuggestionRequest.promise;
    }

    cancelScheduledSuggestion();

    if (activeSuggestionRequest?.query !== normalizedQuery) {
      activeSuggestionController?.abort();
    }

    const debounceMs = Number.isFinite(options.debounceMs)
      ? options.debounceMs
      : SUGGESTION_DEBOUNCE_MS;

    scheduledSuggestionQuery = normalizedQuery;
    scheduledSuggestionPromise = new Promise((resolve) => {
      scheduledSuggestionResolve = resolve;
      scheduledSuggestionTimer = setTimeout(() => {
        const controller = new AbortController();
        const unbindAbort = bindExternalAbort(options.signal, controller);

        const requestPromise = api
          .get('/search/suggestions', {
            params: {
              q: normalizedQuery,
            },
            signal: controller.signal,
          })
          .catch((error) => {
            if (!shouldTryFallback(error)) {
              throw error;
            }

            return requestWithFallback(
              SUGGESTION_ENDPOINTS.slice(1),
              (endpoint) =>
                api.get(endpoint, {
                  params: {
                    q: normalizedQuery,
                    keyword: normalizedQuery,
                  },
                  signal: controller.signal,
                }),
            );
          })
          .then((response) => {
            const payload = unwrapApiData(response);
            return normalizeArrayPayload(payload, ['suggestions']);
          })
          .catch((error) => {
            if (!isSuggestionAbort(error)) {
              devError('Suggestions error:', error);
            }
            if (!isSuggestionAbort(error)) {
              captureRecoverableApiError(error, {
                operation: 'search.getSuggestions',
                fallbackUsed: true,
              });
            }
            return [];
          })
          .finally(() => {
            unbindAbort();
            if (activeSuggestionController === controller) {
              activeSuggestionController = null;
            }
            if (activeSuggestionRequest?.query === normalizedQuery) {
              activeSuggestionRequest = null;
            }
          });

        activeSuggestionController = controller;
        activeSuggestionRequest = {
          query: normalizedQuery,
          promise: requestPromise,
        };

        resolveScheduledSuggestion(requestPromise);
      }, debounceMs);
    });

    return scheduledSuggestionPromise;
  },

  /**
   * Get popular search terms
   * @param {number} limit - Number of terms to retrieve
   * @returns {Promise<Array>} - Popular search terms
   */
  getPopularTerms: async (limit = 5) => {
    try {
      const response = await requestWithFallback(POPULAR_ENDPOINTS, (endpoint) =>
        api.get(endpoint, {
          params: { limit },
        }),
      );
      const payload = unwrapApiData(response);
      return normalizeArrayPayload(payload, ['terms']);
    } catch (error) {
      devError('Popular terms error:', error);
      captureRecoverableApiError(error, {
        operation: 'search.getPopularTerms',
        fallbackUsed: true,
      });
      // FIX M6: Return [] consistently on error instead of { error: true } object
      return [];
    }
  },

  // Get job categories
  getCategories: async () => {
    try {
      return await getCachedLookup(
        'categories',
        () => api.get('/jobs/categories'),
        ['categories', 'items'],
      );
    } catch (error) {
      devError('Categories fetch error:', error);
      throw error;
    }
  },

  // Get job skills
  getSkills: async () => {
    try {
      return await getCachedLookup(
        'skills',
        () => api.get('/jobs/skills'),
        ['skills', 'items'],
      );
    } catch (error) {
      devError('Skills fetch error:', error);
      throw error;
    }
  },

  /**
   * Get search suggestions from job service
   * @deprecated Use getSuggestions() for /search/suggestions endpoint instead
   */
  getSearchSuggestions: async (keyword) => {
    try {
      const response = await api.get('/jobs/suggestions', {
        params: { keyword },
      });
      return unwrapApiData(response, { defaultValue: [] }) || [];
    } catch (error) {
      devError('Job suggestions error:', error);
      captureRecoverableApiError(error, {
        operation: 'search.getSearchSuggestions',
        fallbackUsed: true,
      });
      // FIX M6: Return [] consistently on error
      return [];
    }
  },

  /**
   * Get popular searches from job service
   * @deprecated Use getPopularTerms() for /search/popular endpoint instead
   */
  getPopularSearches: async () => {
    try {
      const response = await api.get('/jobs/popular-searches');
      return unwrapApiData(response, { defaultValue: [] }) || [];
    } catch (error) {
      devError('Popular searches error:', error);
      captureRecoverableApiError(error, {
        operation: 'search.getPopularSearches',
        fallbackUsed: true,
      });
      // FIX M6: Return [] consistently on error
      return [];
    }
  },
};

export default searchService;
