import { api } from '../../../services/apiClient';

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
      return response.data.results || response.data;
    } catch (error) {
      console.error('Search error:', error);
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
      return response.data.results || response.data;
    } catch (error) {
      console.error('Worker search error:', error);
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
      return response.data;
    } catch (error) {
      console.error('Job search error:', error);
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
      return response.data.suggestions || response.data;
    } catch (error) {
      console.error('Suggestions error:', error);
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
      return response.data.terms || response.data;
    } catch (error) {
      console.error('Popular terms error:', error);
      return [];
    }
  },

  // Get job categories
  getCategories: async () => {
    try {
      const response = await api.get('/jobs/categories');
      return response.data;
    } catch (error) {
      console.error('Categories fetch error:', error);
      return [];
    }
  },

  // Get job skills
  getSkills: async () => {
    try {
      const response = await api.get('/jobs/skills');
      return response.data;
    } catch (error) {
      console.error('Skills fetch error:', error);
      return [];
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
      return response.data;
    } catch (error) {
      console.error('Job suggestions error:', error);
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
      return response.data;
    } catch (error) {
      console.error('Popular searches error:', error);
      return [];
    }
  },
};

export default searchService;
