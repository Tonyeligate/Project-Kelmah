import axios from 'axios';
import { api } from '../../../services/apiClient';
import { EXTERNAL_SERVICES } from '../../../config/services';
import workerService from '../../worker/services/workerService';
import { devError } from '@/modules/common/utils/devLogger';

const mapError = devError;

const JOB_LOCATION_ENDPOINTS = ['/jobs/location', '/jobs/search/location'];

const shouldTryFallback = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501 || status === 503;
};

const requestWithFallback = async (endpoints, requestFactory) => {
  let lastError;

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    try {
      return await requestFactory(endpoint);
    } catch (error) {
      lastError = error;
      const canRetryWithFallback =
        index < endpoints.length - 1 && shouldTryFallback(error);
      if (!canRetryWithFallback) {
        break;
      }
    }
  }

  throw lastError;
};

const extractPayload = (response) => {
  const payload = response?.data;

  if (payload?.success === false) {
    const message =
      payload?.error?.message || payload?.message || 'Location search failed';
    const normalized = new Error(message);
    normalized.response = response;
    normalized.code = payload?.error?.code;
    throw normalized;
  }

  return payload?.data ?? payload ?? [];
};

/**
 * Professional Map Service for Vocational Job Platform
 * Integrates with Kelmah backend APIs for real job and worker data
 */
class MapService {
  constructor() {
    this.defaultCenter = [5.6037, -0.187]; // Accra, Ghana default for West Africa
    this.watchId = null;
    this.locationCache = new Map();
    this._maxCacheSize = 500;

    // Vocational job categories specific to the platform
    this.vocationalCategories = [
      'Carpentry',
      'Masonry',
      'Plumbing',
      'Electrical',
      'Painting',
      'Roofing',
      'Tiling',
      'Welding',
      'HVAC',
      'Landscaping',
      'Security',
      'Cleaning',
      'Catering',
      'Tailoring',
      'Mechanics',
    ];
  }

  /**
   * Get user's current location with high accuracy
   */
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      ...options,
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
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          let message = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              message =
                'Location information unavailable. Check your internet connection.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(message));
        },
        defaultOptions,
      );
    });
  }

  /**
   * Search for jobs near a location using real API
   */
  async searchJobsNearLocation(params = {}) {
    try {
      const {
        latitude,
        longitude,
        radius = 25,
        category,
        skills,
        budget,
        page = 1,
        limit = 20,
      } = params;

      const searchParams = {
        page,
        limit,
        latitude,
        longitude,
        radius,
        status: 'open',
        visibility: 'public',
      };

      if (category) searchParams.category = category;
      if (skills) searchParams.skills = skills.join(',');
      if (budget) {
        searchParams.minBudget = budget[0];
        searchParams.maxBudget = budget[1];
      }

      const response = await requestWithFallback(
        JOB_LOCATION_ENDPOINTS,
        (endpoint) =>
          api.get(endpoint, {
            params: searchParams,
          }),
      );
      const jobs = extractPayload(response);
      return this.transformJobsForMap(Array.isArray(jobs) ? jobs : []);
    } catch (error) {
      mapError('Jobs API unavailable:', error);
      throw error;
    }
  }

  /**
   * Search for workers near a location using real API
   */
  async searchWorkersNearLocation(params = {}) {
    try {
      const workers = await workerService.searchWorkers({
        ...params,
        available: true,
      });

      return this.transformWorkersForMap(workers);
    } catch (error) {
      mapError('Workers API unavailable:', error);
      throw error;
    }
  }

  /**
   * Transform job data for map display
   */
  transformJobsForMap(jobs) {
    return jobs.map((job) => ({
      id: job._id || job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      skills: job.skills || [],
      budget: job.budget,
      paymentType: job.paymentType,
      coordinates: this.extractCoordinates(job),
      hirer: job.hirer,
      type: 'job',
      color: '#FFD700', // Gold for jobs
      urgent: job.urgent || false,
      verified: job.hirer?.verified || false,
      createdAt: job.createdAt,
      distance: job.distance,
    }));
  }

  /**
   * Transform worker data for map display
   */
  transformWorkersForMap(workers) {
    return workers.map((worker) => ({
      id: worker._id || worker.id,
      name:
        worker.name ||
        [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
        'Skilled Worker',
      title:
        worker.title ||
        worker.profession ||
        worker.profile?.title ||
        worker.skills?.[0] ||
        'Skilled Worker',
      bio: worker.bio || worker.profile?.bio || worker.description,
      category:
        worker.profile?.category ||
        worker.profession ||
        this.getCategoryFromSkills(worker.skills),
      skills: worker.skills || [],
      hourlyRate: worker.hourlyRate || worker.profile?.hourlyRate,
      rating: worker.rating || worker.averageRating || 0,
      reviewCount: worker.reviewCount || worker.totalReviews || 0,
      coordinates: this.extractCoordinates(worker),
      profileImage: worker.profileImage || worker.profilePicture,
      type: 'worker',
      color: '#1a1a1a', // Black for workers
      verified:
        worker.verified ||
        worker.isVerified ||
        worker.verification?.isVerified ||
        false,
      online: worker.isOnline || false,
      distance: worker.distance,
      availability: worker.availability || worker.availabilityStatus,
    }));
  }

  /**
   * Extract coordinates from job/worker location data
   */
  extractCoordinates(item) {
    // Handle different coordinate formats
    if (item.coordinates) {
      return {
        latitude:
          item.coordinates.latitude ||
          item.coordinates.lat ||
          item.coordinates[1],
        longitude:
          item.coordinates.longitude ||
          item.coordinates.lng ||
          item.coordinates[0],
      };
    }

    if (item.location?.coordinates) {
      return {
        latitude:
          item.location.coordinates.latitude || item.location.coordinates[1],
        longitude:
          item.location.coordinates.longitude || item.location.coordinates[0],
      };
    }

    // Generate coordinates based on location name or use default
    return this.generateCoordinatesFromLocation(item.location);
  }

  // Removed all mock data generators to enforce real data usage only

  /**
   * Get skills for a specific vocational category
   */
  getSkillsForCategory(category) {
    const skillMap = {
      Carpentry: [
        'Cabinet Making',
        'Furniture Building',
        'Framing',
        'Finish Carpentry',
      ],
      Masonry: ['Bricklaying', 'Stone Work', 'Concrete', 'Block Work'],
      Plumbing: [
        'Pipe Installation',
        'Drain Cleaning',
        'Water Systems',
        'Gas Lines',
      ],
      Electrical: [
        'Wiring',
        'Circuit Installation',
        'Lighting',
        'Safety Systems',
      ],
      Painting: [
        'Interior Painting',
        'Exterior Painting',
        'Spray Painting',
        'Wall Prep',
      ],
    };

    return skillMap[category] || [category];
  }

  /**
   * Reverse geocoding using OpenStreetMap Nominatim
   */
  async reverseGeocode(latitude, longitude) {
    const cacheKey = `reverse_${latitude}_${longitude}`;

    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        EXTERNAL_SERVICES.OPENSTREETMAP.NOMINATIM_REVERSE,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1,
            zoom: 18,
          },
        },
      );

      const result = {
        address: response.data.display_name,
        city:
          response.data.address?.city ||
          response.data.address?.town ||
          response.data.address?.village,
        state: response.data.address?.state || response.data.address?.region,
        country: response.data.address?.country,
        postcode: response.data.address?.postcode,
        coordinates: { latitude, longitude },
      };

      if (this.locationCache.size >= this._maxCacheSize) {
        const firstKey = this.locationCache.keys().next().value;
        this.locationCache.delete(firstKey);
      }
      this.locationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      mapError('Reverse geocoding error:', error);
      throw new Error('Failed to get address for location');
    }
  }

  /**
   * Forward geocoding using OpenStreetMap Nominatim
   */
  async geocodeAddress(address) {
    const cacheKey = `forward_${address}`;

    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        EXTERNAL_SERVICES.OPENSTREETMAP.NOMINATIM_SEARCH,
        {
          params: {
            q: address,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'gh', // Prioritize Ghana
          },
        },
      );

      const results = response.data.map((item) => ({
        address: item.display_name,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
        boundingBox: item.boundingbox,
      }));

      if (results.length > 0) {
        if (this.locationCache.size >= this._maxCacheSize) {
          const firstKey = this.locationCache.keys().next().value;
          this.locationCache.delete(firstKey);
        }
        this.locationCache.set(cacheKey, results);
      }

      return results;
    } catch (error) {
      mapError('Geocoding error:', error);
      throw new Error('Failed to find coordinates for address');
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
    const R = unit === 'km' ? 6371 : 3959;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

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
   * Filter locations by radius
   */
  filterLocationsByRadius(userLocation, locations, radiusKm) {
    return locations
      .filter((location) => {
        if (!location.coordinates) return false;

        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude,
        );

        return distance <= radiusKm;
      })
      .map((location) => ({
        ...location,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
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
   * Get category from skills array
   */
  getCategoryFromSkills(skills) {
    if (!skills || skills.length === 0) return 'General';

    const skill = skills[0].toLowerCase();
    for (const category of this.vocationalCategories) {
      if (skill.includes(category.toLowerCase())) {
        return category;
      }
    }
    return 'General';
  }

  /**
   * Generate coordinates from location string
   */
  generateCoordinatesFromLocation(location) {
    // Default coordinates for major Ghanaian cities
    const cityCoordinates = {
      accra: { latitude: 5.6037, longitude: -0.187 },
      kumasi: { latitude: 6.6885, longitude: -1.6244 },
      tamale: { latitude: 9.4034, longitude: -0.8424 },
      'cape coast': { latitude: 5.1053, longitude: -1.2466 },
      sekondi: { latitude: 4.9344, longitude: -1.7167 },
    };

    if (location?.city) {
      const city = location.city.toLowerCase();
      if (cityCoordinates[city]) {
        return cityCoordinates[city];
      }
    }

    // Return default Accra coordinates
    return cityCoordinates.accra;
  }

  /**
   * Clear location cache
   */
  clearCache() {
    this.locationCache.clear();
  }

  /**
   * Get vocational categories
   */
  getVocationalCategories() {
    return this.vocationalCategories;
  }
}

export default new MapService();
