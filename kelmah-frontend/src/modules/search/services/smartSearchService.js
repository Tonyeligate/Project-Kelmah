import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/search';
const JOB_RECOMMENDATIONS_ENDPOINT = '/api/jobs/recommendations';

/**
 * Service for AI-powered smart job search and recommendations
 */
const smartSearchService = {
  /**
   * Get AI-powered job recommendations for a user
   * @param {string} userId - User ID
   * @param {Object} options - Search options and filters
   * @returns {Promise<Object>} - Job recommendations with AI insights
   */
  getSmartJobRecommendations: async (userId, options = {}) => {
    try {
      const response = await userServiceClient.get(JOB_RECOMMENDATIONS_ENDPOINT, {
        params: {
          userId,
          ...options,
        },
      });
      return response.data;
    } catch (error) {
      if (error?.response?.status === 403) {
        return {
          jobs: [],
          insights: null,
          status: 'forbidden',
        };
      }

      if (error?.response?.status === 404 || error?.response?.status === 204) {
        return {
          jobs: [],
          insights: null,
          status: 'empty',
        };
      }

      throw error;
    }
  },

  /**
   * Perform AI-enhanced job search
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Enhanced search results
   */
  performSmartSearch: async (searchParams) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/smart-search`,
        searchParams,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job matching score and explanation
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Match analysis
   */
  getJobMatchAnalysis: async (jobId, userId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/match-analysis/${jobId}/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save a job for later
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Save confirmation
   */
  saveJob: async (jobId) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/save-job`, {
        jobId,
      });
      return response.data;
    } catch (error) {
      console.warn('Save job API not available:', error.message);
      throw error;
    }
  },

  /**
   * Remove a job from saved list
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Removal confirmation
   */
  unsaveJob: async (jobId) => {
    try {
      const response = await userServiceClient.delete(
        `${API_URL}/save-job/${jobId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Track user interaction with job recommendations
   * @param {string} jobId - Job ID
   * @param {string} action - Action type (view, click, apply, etc.)
   * @returns {Promise<Object>} - Tracking confirmation
   */
  trackJobInteraction: async (jobId, action) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/track-interaction`,
        {
          jobId,
          action,
          timestamp: new Date().toISOString(),
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get personalized search suggestions
   * @param {string} userId - User ID
   * @param {string} query - Partial search query
   * @returns {Promise<Object>} - Search suggestions
   */
  getSearchSuggestions: async (userId, query) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/suggestions/${userId}`,
        { params: { q: query } },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job market insights
   * @param {Object} filters - Market analysis filters
   * @returns {Promise<Object>} - Market insights
   */
  getMarketInsights: async (filters = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/market-insights`,
        {
          params: filters,
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get saved searches for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Saved searches
   */
  getSavedSearches: async (userId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/saved-searches/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a saved search
   * @param {string} userId - User ID
   * @param {Object} searchData - Search criteria and settings
   * @returns {Promise<Object>} - Created saved search
   */
  createSavedSearch: async (userId, searchData) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/saved-searches`,
        {
          userId,
          ...searchData,
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a saved search
   * @param {string} searchId - Saved search ID
   * @param {Object} updateData - Updated search data
   * @returns {Promise<Object>} - Updated saved search
   */
  updateSavedSearch: async (searchId, updateData) => {
    try {
      const response = await userServiceClient.put(
        `${API_URL}/saved-searches/${searchId}`,
        updateData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a saved search
   * @param {string} searchId - Saved search ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteSavedSearch: async (searchId) => {
    try {
      const response = await userServiceClient.delete(
        `${API_URL}/saved-searches/${searchId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Removed: mock recommendation generator

// Removed: specific mock recommendation generator

// Removed: mock job results generator

export default smartSearchService;
