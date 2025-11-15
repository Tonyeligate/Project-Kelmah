import axios from '../../common/services/axios';

const API_BASE = '/api';
const withApi = (path) => `${API_BASE}${path}`;

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
      const response = await axios.get(withApi('/search'), {
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
      const response = await axios.get(withApi('/search/workers'), {
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
    const response = await axios.get(withApi('/jobs/search'), { params });
    return response.data;
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
      const response = await axios.get(withApi('/search/suggestions'), {
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
      const response = await axios.get(withApi('/search/popular'), {
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
    const response = await axios.get(withApi('/jobs/categories'));
    return response.data;
  },

  // Get job skills
  getSkills: async () => {
    const response = await axios.get(withApi('/jobs/skills'));
    return response.data;
  },

  // Get search suggestions
  getSearchSuggestions: async (keyword) => {
    const response = await axios.get(withApi('/jobs/suggestions'), {
      params: { keyword },
    });
    return response.data;
  },

  // Get popular searches
  getPopularSearches: async () => {
    const response = await axios.get(withApi('/jobs/popular-searches'));
    return response.data;
  },
};

export default searchService;
