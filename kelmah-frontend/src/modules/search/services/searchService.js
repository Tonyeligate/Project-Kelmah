import { api } from '../../../services/apiClient';

const unwrapPayload = (response) => {
  const payload = response?.data;
  if (payload?.success && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
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
      const response = await api.get('/search', {
        params: {
          q: query,
          ...filters,
        },
      });
      const payload = unwrapPayload(response);
      return payload?.results || payload || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Search error:', error);
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
      const response = await api.get('/search/workers', {
        params,
      });
      const payload = unwrapPayload(response);
      return payload?.results || payload?.workers || payload || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Worker search error:', error);
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
      const response = await api.get('/jobs/search', { params });
      return unwrapPayload(response) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Job search error:', error);
      throw error;
    }
  },

  /**
   * Get search suggestions based on partial query
   * @param {string} partialQuery - Partial search query
   * @returns {Promise<Array>} - Search suggestions
   */
  getSuggestions: async (partialQuery) => {
    if (!partialQuery || partialQuery.trim() === '') {
      return [];
    }

    try {
      const response = await api.get('/search/suggestions', {
        params: {
          q: partialQuery,
        },
      });
      const payload = unwrapPayload(response);
      return payload?.suggestions || payload || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Suggestions error:', error);
      return [];
    }
  },

  /**
   * Get popular search terms
   * @param {number} limit - Number of terms to retrieve
   * @returns {Promise<Array>} - Popular search terms
   */
  getPopularTerms: async (limit = 5) => {
    try {
      const response = await api.get('/search/popular', {
        params: { limit },
      });
      const payload = unwrapPayload(response);
      return payload?.terms || payload || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Popular terms error:', error);
      return { error: true, message: error.message, data: [] };
    }
  },

  // Get job categories
  getCategories: async () => {
    try {
      const response = await api.get('/jobs/categories');
      return unwrapPayload(response) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Categories fetch error:', error);
      throw error;
    }
  },

  // Get job skills
  getSkills: async () => {
    try {
      const response = await api.get('/jobs/skills');
      return unwrapPayload(response) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Skills fetch error:', error);
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
      return unwrapPayload(response) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Job suggestions error:', error);
      return { error: true, message: error.message, data: [] };
    }
  },

  /**
   * Get popular searches from job service
   * @deprecated Use getPopularTerms() for /search/popular endpoint instead
   */
  getPopularSearches: async () => {
    try {
      const response = await api.get('/jobs/popular-searches');
      return unwrapPayload(response) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Popular searches error:', error);
      return { error: true, message: error.message, data: [] };
    }
  },
};

export default searchService;
