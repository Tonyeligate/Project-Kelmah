import { api } from '../../../services/apiClient';

const API_URL = '/location';

const DEFAULT_POPULAR_LOCATIONS = [
  { name: 'Accra', type: 'capital', region: 'Greater Accra Region', jobs: 245, coordinates: [5.6037, -0.187] },
  { name: 'Kumasi', type: 'city', region: 'Ashanti Region', jobs: 189, coordinates: [6.6885, -1.6244] },
  { name: 'Tamale', type: 'city', region: 'Northern Region', jobs: 96, coordinates: [9.4034, -0.8393] },
  { name: 'Takoradi', type: 'city', region: 'Western Region', jobs: 88, coordinates: [4.8918, -1.755] },
];

const RECENT_KEY = 'kelmah_recent_location_searches';

const unwrap = (response) => {
  const payload = response?.data;
  if (payload?.success && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
};

const toResponseShape = (data) => ({ data });

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
      const payload = unwrap(response);
      return toResponseShape(Array.isArray(payload) ? payload : payload?.locations || []);
    } catch (error) {
      return toResponseShape(DEFAULT_POPULAR_LOCATIONS);
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
      const payload = unwrap(response);
      return toResponseShape(Array.isArray(payload) ? payload : payload?.locations || []);
    } catch (error) {
      return toResponseShape([]);
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
      const payload = unwrap(response);
      return toResponseShape(Array.isArray(payload) ? payload : payload?.results || []);
    } catch (error) {
      const fallback = DEFAULT_POPULAR_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(String(query || '').toLowerCase()),
      );
      return toResponseShape(fallback);
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
      const payload = unwrap(response);
      return toResponseShape(payload || null);
    } catch (error) {
      return toResponseShape(null);
    }
  },

  /**
   * Get user's recent location searches
   * @returns {Promise<Object>} - Recent searches
   */
  getRecentSearches: async () => {
    try {
      const response = await api.get(`${API_URL}/recent-searches`);
      const payload = unwrap(response);
      return toResponseShape(Array.isArray(payload) ? payload : payload?.searches || []);
    } catch (error) {
      try {
        const cached = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        return toResponseShape(Array.isArray(cached) ? cached : []);
      } catch {
        return toResponseShape([]);
      }
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
      return toResponseShape(unwrap(response));
    } catch (error) {
      try {
        const cached = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        const next = [location, ...(Array.isArray(cached) ? cached : [])].slice(0, 10);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // noop
      }
      return toResponseShape(location);
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
      return toResponseShape(unwrap(response) || {});
    } catch (error) {
      return toResponseShape({ jobs: 0, workers: 0, demand: 'unknown' });
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
      return toResponseShape(unwrap(response) || {});
    } catch (error) {
      return toResponseShape({
        distanceKm: null,
        durationMinutes: null,
        mode: 'unknown',
      });
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
      const payload = unwrap(response);
      return toResponseShape(Array.isArray(payload) ? payload : payload?.suggestions || []);
    } catch (error) {
      const fallback = DEFAULT_POPULAR_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(String(query || '').toLowerCase()),
      );
      return toResponseShape(fallback);
    }
  },
};

export default locationService;
