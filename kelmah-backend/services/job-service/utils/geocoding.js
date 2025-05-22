/**
 * Geocoding utility for converting between location names and coordinates
 * Supports geocoding (address to coordinates) and reverse geocoding (coordinates to address)
 */

const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for geocoding results with 1 day TTL
const geocodeCache = new NodeCache({ stdTTL: 86400 });

/**
 * Geocoding service class
 * Uses OpenStreetMap Nominatim API by default, but can be configured to use other providers
 */
class GeocodingService {
  constructor(options = {}) {
    this.provider = options.provider || 'nominatim';
    this.apiKey = options.apiKey || null;
    this.baseUrl = options.baseUrl || 'https://nominatim.openstreetmap.org';
    this.cacheEnabled = options.cacheEnabled !== false;
  }

  /**
   * Convert an address or location name to coordinates
   * 
   * @param {string} address - The address or location name to geocode
   * @param {Object} options - Additional options
   * @param {string} options.countryCode - Limit results to this country code (e.g., 'gh' for Ghana)
   * @param {number} options.limit - Maximum number of results to return
   * @returns {Promise<Array>} Array of location objects with coordinates
   */
  async geocode(address, options = {}) {
    try {
      // Check cache first
      const cacheKey = `geocode:${address}:${JSON.stringify(options)}`;
      if (this.cacheEnabled) {
        const cachedResult = geocodeCache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      let results;
      
      if (this.provider === 'nominatim') {
        results = await this._geocodeWithNominatim(address, options);
      } else if (this.provider === 'google') {
        results = await this._geocodeWithGoogle(address, options);
      } else {
        throw new Error(`Unsupported geocoding provider: ${this.provider}`);
      }

      // Cache the results
      if (this.cacheEnabled) {
        geocodeCache.set(cacheKey, results);
      }

      return results;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  /**
   * Convert coordinates to an address (reverse geocoding)
   * 
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Location object with address details
   */
  async reverseGeocode(latitude, longitude, options = {}) {
    try {
      // Check cache first
      const cacheKey = `revgeocode:${latitude},${longitude}:${JSON.stringify(options)}`;
      if (this.cacheEnabled) {
        const cachedResult = geocodeCache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      let result;
      
      if (this.provider === 'nominatim') {
        result = await this._reverseGeocodeWithNominatim(latitude, longitude, options);
      } else if (this.provider === 'google') {
        result = await this._reverseGeocodeWithGoogle(latitude, longitude, options);
      } else {
        throw new Error(`Unsupported geocoding provider: ${this.provider}`);
      }

      // Cache the result
      if (this.cacheEnabled) {
        geocodeCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error(`Failed to reverse geocode coordinates: ${error.message}`);
    }
  }

  /**
   * Get location suggestions based on partial input
   * 
   * @param {string} query - Partial address or location input
   * @param {Object} options - Additional options
   * @param {string} options.countryCode - Limit results to this country code (e.g., 'gh' for Ghana)
   * @param {number} options.limit - Maximum number of results to return
   * @returns {Promise<Array>} Array of location suggestions
   */
  async getSuggestions(query, options = {}) {
    try {
      // For short queries, we might want to avoid unnecessary API calls
      if (query.length < 3) {
        return [];
      }

      // Check cache first
      const cacheKey = `suggest:${query}:${JSON.stringify(options)}`;
      if (this.cacheEnabled) {
        const cachedResult = geocodeCache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      const results = await this.geocode(query, {
        ...options,
        limit: options.limit || 5
      });

      // Format suggestions in a more user-friendly way
      const suggestions = results.map(location => ({
        id: location.placeId || location.osmId || `${location.lat},${location.lon}`,
        displayName: location.displayName,
        formattedAddress: this._formatAddress(location),
        city: location.city || location.town || location.village || location.county,
        region: location.state || location.region,
        country: location.country,
        countryCode: location.countryCode,
        coordinates: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        }
      }));

      // Cache the suggestions
      if (this.cacheEnabled) {
        geocodeCache.set(cacheKey, suggestions);
      }

      return suggestions;
    } catch (error) {
      console.error('Location suggestion error:', error);
      return []; // Return empty array instead of throwing to provide a graceful fallback
    }
  }

  /**
   * Geocode using OpenStreetMap Nominatim API
   * @private
   */
  async _geocodeWithNominatim(address, options = {}) {
    const params = {
      q: address,
      format: 'json',
      addressdetails: 1,
      limit: options.limit || 10
    };

    if (options.countryCode) {
      params.countrycodes = options.countryCode;
    }

    const response = await axios.get(`${this.baseUrl}/search`, {
      params,
      headers: {
        'User-Agent': 'KelmahPlatform/1.0'
      }
    });

    return response.data.map(item => ({
      placeId: item.place_id,
      osmId: item.osm_id,
      lat: item.lat,
      lon: item.lon,
      displayName: item.display_name,
      type: item.type,
      city: item.address.city,
      town: item.address.town,
      village: item.address.village,
      county: item.address.county,
      state: item.address.state,
      country: item.address.country,
      countryCode: item.address.country_code,
      postcode: item.address.postcode,
      road: item.address.road,
      boundingbox: item.boundingbox
    }));
  }

  /**
   * Reverse geocode using OpenStreetMap Nominatim API
   * @private
   */
  async _reverseGeocodeWithNominatim(latitude, longitude, options = {}) {
    const params = {
      lat: latitude,
      lon: longitude,
      format: 'json',
      addressdetails: 1,
      zoom: options.zoom || 18
    };

    const response = await axios.get(`${this.baseUrl}/reverse`, {
      params,
      headers: {
        'User-Agent': 'KelmahPlatform/1.0'
      }
    });

    const item = response.data;
    return {
      placeId: item.place_id,
      osmId: item.osm_id,
      lat: item.lat,
      lon: item.lon,
      displayName: item.display_name,
      type: item.type,
      city: item.address.city,
      town: item.address.town,
      village: item.address.village,
      county: item.address.county,
      state: item.address.state,
      country: item.address.country,
      countryCode: item.address.country_code,
      postcode: item.address.postcode,
      road: item.address.road,
      houseNumber: item.address.house_number,
      boundingbox: item.boundingbox
    };
  }

  /**
   * Geocode using Google Maps API
   * @private
   */
  async _geocodeWithGoogle(address, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required');
    }

    const params = {
      address,
      key: this.apiKey
    };

    if (options.countryCode) {
      params.components = `country:${options.countryCode}`;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google geocoding error: ${response.data.status}`);
    }

    return response.data.results.map(item => {
      // Extract address components
      const getComponent = (type, shortVersion = false) => {
        const component = item.address_components.find(
          comp => comp.types.includes(type)
        );
        return component ? (shortVersion ? component.short_name : component.long_name) : null;
      };

      return {
        placeId: item.place_id,
        lat: item.geometry.location.lat,
        lon: item.geometry.location.lng,
        displayName: item.formatted_address,
        type: item.types[0],
        city: getComponent('locality'),
        county: getComponent('administrative_area_level_2'),
        state: getComponent('administrative_area_level_1'),
        country: getComponent('country'),
        countryCode: getComponent('country', true),
        postcode: getComponent('postal_code'),
        road: getComponent('route'),
        houseNumber: getComponent('street_number'),
        boundingbox: [
          item.geometry.bounds?.southwest.lat,
          item.geometry.bounds?.southwest.lng,
          item.geometry.bounds?.northeast.lat,
          item.geometry.bounds?.northeast.lng
        ].filter(Boolean)
      };
    });
  }

  /**
   * Reverse geocode using Google Maps API
   * @private
   */
  async _reverseGeocodeWithGoogle(latitude, longitude, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required');
    }

    const params = {
      latlng: `${latitude},${longitude}`,
      key: this.apiKey
    };

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google reverse geocoding error: ${response.data.status}`);
    }

    // Use the first result
    const item = response.data.results[0];
    
    // Extract address components
    const getComponent = (type, shortVersion = false) => {
      const component = item.address_components.find(
        comp => comp.types.includes(type)
      );
      return component ? (shortVersion ? component.short_name : component.long_name) : null;
    };

    return {
      placeId: item.place_id,
      lat: item.geometry.location.lat,
      lon: item.geometry.location.lng,
      displayName: item.formatted_address,
      type: item.types[0],
      city: getComponent('locality'),
      county: getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      countryCode: getComponent('country', true),
      postcode: getComponent('postal_code'),
      road: getComponent('route'),
      houseNumber: getComponent('street_number')
    };
  }

  /**
   * Format an address for display
   * @private
   */
  _formatAddress(location) {
    const parts = [];
    
    // Add city/town/village
    if (location.city || location.town || location.village) {
      parts.push(location.city || location.town || location.village);
    }
    
    // Add state/region
    if (location.state && (!parts.length || parts[0] !== location.state)) {
      parts.push(location.state);
    }
    
    // Add country
    if (location.country && (!parts.length || parts[parts.length - 1] !== location.country)) {
      parts.push(location.country);
    }
    
    return parts.join(', ');
  }
}

// Export a default instance with Nominatim
const defaultGeocodingService = new GeocodingService();

module.exports = {
  GeocodingService,
  defaultGeocodingService
}; 