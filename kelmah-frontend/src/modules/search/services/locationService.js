import { api } from '../../../services/apiClient';

const API_URL = '/location';

/**
 * Service for location-based search and geolocation features
 */
const locationService = {
  /**
   * Get popular job locations in Ghana
   * @returns {Promise<Object>} - Popular locations with job counts
   */
  getPopularLocations: async () => {
    try {
      const response = await api.get(`${API_URL}/popular`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get nearby locations based on coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Object>} - Nearby locations
   */
  getNearbyLocations: async (lat, lng, radius = 10) => {
    try {
      const response = await api.get(`${API_URL}/nearby`, {
        params: { lat, lng, radius },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search locations by query
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Search results
   */
  searchLocations: async (query) => {
    try {
      const response = await api.get(`${API_URL}/search`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Address information
   */
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await api.get(`${API_URL}/reverse-geocode`, {
        params: { lat, lng },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's recent location searches
   * @returns {Promise<Object>} - Recent searches
   */
  getRecentSearches: async () => {
    try {
      const response = await api.get(`${API_URL}/recent-searches`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save a location search to recent searches
   * @param {Object} location - Location data
   * @returns {Promise<Object>} - Save confirmation
   */
  saveRecentSearch: async (location) => {
    try {
      const response = await api.post(`${API_URL}/recent-searches`, location);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get location-based job statistics
   * @param {string} locationName - Location name
   * @returns {Promise<Object>} - Location job statistics
   */
  getLocationStats: async (locationName) => {
    try {
      const response = await api.get(`${API_URL}/stats/${locationName}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get travel time and distance between locations
   * @param {Array} origin - Origin coordinates [lat, lng]
   * @param {Array} destination - Destination coordinates [lat, lng]
   * @returns {Promise<Object>} - Travel information
   */
  getTravelInfo: async (origin, destination) => {
    try {
      const response = await api.post(`${API_URL}/travel-info`, {
        origin,
        destination,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get Ghana-specific location suggestions
   * @param {string} query - Partial location query
   * @returns {Promise<Object>} - Location suggestions
   */
  getLocationSuggestions: async (query) => {
    try {
      const response = await api.get(`${API_URL}/suggestions`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default locationService;
