import axios from 'axios';

/**
 * Professional Map Service with location-based features
 * Similar to Uber's location system
 */
class MapService {
  constructor() {
    this.defaultCenter = [37.7749, -122.4194]; // San Francisco default
    this.watchId = null;
    this.locationCache = new Map();
  }

  /**
   * Get user's current location with high accuracy
   */
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(location);
        },
        (error) => {
          let message = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch user location for real-time tracking
   */
  watchLocation(callback, errorCallback = null) {
    if (!navigator.geolocation) {
      if (errorCallback) errorCallback(new Error('Geolocation not supported'));
      return null;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
        callback(location);
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    const cacheKey = `reverse_${latitude}_${longitude}`;
    
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }

    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`, {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1,
            zoom: 18
          }
        }
      );

      const result = {
        address: response.data.display_name,
        city: response.data.address?.city || response.data.address?.town || response.data.address?.village,
        state: response.data.address?.state,
        country: response.data.address?.country,
        postcode: response.data.address?.postcode,
        coordinates: { latitude, longitude }
      };

      this.locationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to get address for location');
    }
  }

  /**
   * Forward geocoding - convert address to coordinates
   */
  async geocodeAddress(address) {
    const cacheKey = `forward_${address}`;
    
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`, {
          params: {
            q: address,
            format: 'json',
            addressdetails: 1,
            limit: 5
          }
        }
      );

      const results = response.data.map(item => ({
        address: item.display_name,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        },
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
        boundingBox: item.boundingbox
      }));

      if (results.length > 0) {
        this.locationCache.set(cacheKey, results);
      }

      return results;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to find coordinates for address');
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
    const R = unit === 'km' ? 6371 : 3959; // Earth's radius in km or miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2));
    const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
              Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLon);
    
    const bearing = this.toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  /**
   * Convert radians to degrees
   */
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Get locations within radius
   */
  filterLocationsByRadius(userLocation, locations, radiusKm) {
    return locations.filter(location => {
      if (!location.coordinates) return false;
      
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      );
      
      return distance <= radiusKm;
    }).map(location => ({
      ...location,
      distance: this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      )
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get map bounds for multiple locations
   */
  getBounds(locations) {
    if (!locations || locations.length === 0) return null;

    let minLat = locations[0].coordinates.latitude;
    let maxLat = locations[0].coordinates.latitude;
    let minLng = locations[0].coordinates.longitude;
    let maxLng = locations[0].coordinates.longitude;

    locations.forEach(location => {
      const { latitude, longitude } = location.coordinates;
      minLat = Math.min(minLat, latitude);
      maxLat = Math.max(maxLat, latitude);
      minLng = Math.min(minLng, longitude);
      maxLng = Math.max(maxLng, longitude);
    });

    return {
      southwest: { latitude: minLat, longitude: minLng },
      northeast: { latitude: maxLat, longitude: maxLng }
    };
  }

  /**
   * Format distance for display
   */
  formatDistance(distance, unit = 'km') {
    if (distance < 1) {
      return unit === 'km' 
        ? `${Math.round(distance * 1000)}m`
        : `${Math.round(distance * 5280)}ft`;
    }
    return `${distance.toFixed(1)}${unit}`;
  }

  /**
   * Clear location cache
   */
  clearCache() {
    this.locationCache.clear();
  }
}

export default new MapService(); 