import { api } from '../../../services/apiClient';
import { devWarn } from '';

const API_URL = '/search';
const JOB_RECOMMENDATIONS_ENDPOINT = '/jobs/recommendations/personalized';
const SAVED_SEARCHES_STORAGE_PREFIX = 'kelmah_saved_searches';

const readSavedSearches = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${SAVED_SEARCHES_STORAGE_PREFIX}:${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSavedSearches = (userId, items) => {
  if (!userId) return;
  try {
    localStorage.setItem(
      `${SAVED_SEARCHES_STORAGE_PREFIX}:${userId}`,
      JSON.stringify(Array.isArray(items) ? items : []),
    );
  } catch {
    // noop
  }
};

const withSavedSearchData = (items = []) => ({ data: items });

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
  getSmartJobRecommendations: async (_userId, options = {}) => {
    try {
      const { signal, ...queryOptions } = options || {};
      const response = await api.get(JOB_RECOMMENDATIONS_ENDPOINT, {
        params: {
          ...queryOptions,
        },
        signal,
      });
      const payload = response?.data?.data || response?.data || {};
      return {
        jobs: Array.isArray(payload?.jobs)
          ? payload.jobs
          : Array.isArray(payload)
            ? payload
            : [],
        insights: payload?.insights || null,
        totalRecommendations: payload?.totalRecommendations,
        averageMatchScore: payload?.averageMatchScore,
        recommendationSource: response?.data?.meta?.recommendationSource || null,
      };
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
      const response = await api.get('/jobs/search', { params: searchParams });
      const payload = response?.data?.data || response?.data || [];
      const jobs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      return { jobs, insights: null };
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
      const response = await api.get(`/jobs/${jobId}`);
      const payload = response?.data?.data || response?.data || {};
      return {
        jobId,
        userId,
        score: payload?.matchScore ?? null,
        reasons: payload?.aiReasons || [],
        breakdown: payload?.matchBreakdown || null,
      };
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
      const response = await api.post(`/jobs/${jobId}/save`);
      return response?.data?.data || response?.data || { success: true };
    } catch (error) {
      devWarn('Save job API not available:', error.message);
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
      const response = await api.delete(`/jobs/${jobId}/save`);
      return response?.data?.data || response?.data || { success: true };
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
      const response = await api.post(`${API_URL}/track-interaction`, {
        jobId,
        action,
        timestamp: new Date().toISOString(),
      });
      return response?.data?.data || response?.data || { success: true };
    } catch (error) {
      // Tracking should never block user actions.
      return { success: false, skipped: true };
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
      const response = await api.get('/jobs/suggestions', {
        params: { q: query || '', userId },
      });
      return response?.data?.data || response?.data || [];
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
      const response = await api.get(`${API_URL}/market-insights`, {
        params: filters,
      });
      return response?.data?.data || response?.data || {};
    } catch (error) {
      return {
        trends: [],
        demandByCategory: [],
        demandByLocation: [],
      };
    }
  },

  /**
   * Get saved searches for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Saved searches
   */
  getSavedSearches: async (userId) => {
    try {
      const response = await api.get(`${API_URL}/saved-searches/${userId}`);
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      const normalized = list.map((entry, index) => ({
        ...entry,
        id: entry.id || entry._id || `saved-${index}-${Date.now()}`,
      }));
      writeSavedSearches(userId, normalized);
      return withSavedSearchData(normalized);
    } catch (error) {
      return withSavedSearchData(readSavedSearches(userId));
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
      const response = await api.post(`${API_URL}/saved-searches`, {
        userId,
        ...searchData,
      });
      return response?.data?.data || response?.data || { success: true };
    } catch (error) {
      const existing = readSavedSearches(userId);
      const created = {
        ...searchData,
        userId,
        id: `saved-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const next = [created, ...existing];
      writeSavedSearches(userId, next);
      return { success: true, data: created };
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
      const response = await api.put(
        `${API_URL}/saved-searches/${searchId}`,
        updateData,
      );
      return response?.data?.data || response?.data || { success: true };
    } catch (error) {
      const explicitUserId = updateData?.userId;
      if (explicitUserId) {
        const existing = readSavedSearches(explicitUserId);
        const next = existing.map((entry) =>
          entry.id === searchId ? { ...entry, ...updateData, updatedAt: new Date().toISOString() } : entry,
        );
        writeSavedSearches(explicitUserId, next);
        return { success: true };
      }

      // Fallback: locate and patch search entry across all saved-search keys
      try {
        for (let index = 0; index < localStorage.length; index += 1) {
          const storageKey = localStorage.key(index);
          if (!storageKey || !storageKey.startsWith(`${SAVED_SEARCHES_STORAGE_PREFIX}:`)) continue;
          const userId = storageKey.split(':')[1];
          const existing = readSavedSearches(userId);
          const hasEntry = existing.some((entry) => entry.id === searchId);
          if (!hasEntry) continue;
          const next = existing.map((entry) =>
            entry.id === searchId ? { ...entry, ...updateData, updatedAt: new Date().toISOString() } : entry,
          );
          writeSavedSearches(userId, next);
          break;
        }
      } catch {
        // noop
      }
      return { success: true };
    }
  },

  /**
   * Delete a saved search
   * @param {string} searchId - Saved search ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteSavedSearch: async (searchId) => {
    try {
      const response = await api.delete(
        `${API_URL}/saved-searches/${searchId}`,
      );
      return response?.data?.data || response?.data || { success: true };
    } catch (error) {
      // Fallback is applied by caller reload (getSavedSearches) from local cache.
      return { success: false, skipped: true };
    }
  },
};

// Removed: mock recommendation generator

// Removed: specific mock recommendation generator

// Removed: mock job results generator

export default smartSearchService;
