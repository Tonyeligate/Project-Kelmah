/**
 * Search API Service
 * Handles search functionality across the application
 */

import apiClient from '../index';

class SearchApi {
  /**
   * Perform a global search across all entities
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {Array} params.types - Entity types to search ('jobs', 'workers', 'hirers', etc.)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Search results
   */
  async globalSearch(params = {}) {
    const response = await apiClient.get('/api/search', { params });
    return response.data;
  }

  /**
   * Search for jobs
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.location - Job location
   * @param {string} params.category - Job category
   * @param {string} params.status - Job status
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Job search results
   */
  async searchJobs(params = {}) {
    const response = await apiClient.get('/api/search', { params });
    return response.data;
  }

  /**
   * Search for workers
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.location - Worker location
   * @param {Array} params.skills - Required skills
   * @param {number} params.minRating - Minimum rating
   * @param {number} params.maxRating - Maximum rating
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Worker search results
   */
  async searchWorkers(params = {}) {
    const response = await apiClient.get('/api/search/workers', { params });
    return response.data;
  }

  /**
   * Search for hirers
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.location - Hirer location
   * @param {number} params.minRating - Minimum rating
   * @param {number} params.maxRating - Maximum rating
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Hirer search results
   */
  async searchHirers(params = {}) {
    const response = await apiClient.get('/api/search/hirers', { params });
    return response.data;
  }

  /**
   * Get location suggestions based on partial input
   * @param {string} query - Location query
   * @returns {Promise<Object>} Location suggestions
   */
  async getLocationSuggestions(query) {
    const response = await apiClient.get('/api/search/locations', {
      params: { query },
    });
    return response.data;
  }

  /**
   * Get skill suggestions based on partial input
   * @param {string} query - Skill query
   * @returns {Promise<Object>} Skill suggestions
   */
  async getSkillSuggestions(query) {
    const response = await apiClient.get('/api/search/skills', {
      params: { query },
    });
    return response.data;
  }

  /**
   * Get job category suggestions
   * @returns {Promise<Object>} Job category suggestions
   */
  async getJobCategorySuggestions() {
    const response = await apiClient.get('/api/search/job-categories');
    return response.data;
  }

  /**
   * Get recent searches for current user
   * @returns {Promise<Object>} Recent searches
   */
  async getRecentSearches() {
    const response = await apiClient.get('/api/search/recent');
    return response.data;
  }

  /**
   * Clear recent searches for current user
   * @returns {Promise<Object>} Operation result
   */
  async clearRecentSearches() {
    const response = await apiClient.delete('/api/search/recent');
    return response.data;
  }

  /**
   * Get popular searches
   * @returns {Promise<Object>} Popular searches
   */
  async getPopularSearches() {
    const response = await apiClient.get('/api/search/popular');
    return response.data;
  }
}

export default new SearchApi();
