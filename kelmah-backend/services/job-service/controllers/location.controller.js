/**
 * Location Controller
 * Handles location-related functionality such as geocoding and location suggestions
 */

const { defaultGeocodingService } = require('../utils/geocoding');
const { isLocationWithinRadius } = require('../utils/geolocation');
const { Op } = require('sequelize');
const axios = require('axios');
const Job = require('../models/job.model');
const Profile = require('../models/profile.model');
const SavedSearch = require('../models/saved-search.model');
const { createNotification } = require('../utils/notification.utils');
const logger = require('../utils/logger');

// API key for geocoding services
const GEOCODING_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Location controller with methods for handling location-related requests
 */
const locationController = {
  /**
   * Get location suggestions based on query text
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getLocationSuggestions: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter must be at least 2 characters'
        });
      }
      
      // Call Google Places Autocomplete API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GEOCODING_API_KEY}&types=(cities)&components=country:gh`
      );
      
      if (response.data.status !== 'OK') {
        logger.error(`Places API error: ${response.data.status}`, {
          error_message: response.data.error_message
        });
        
        return res.status(500).json({
          success: false,
          message: 'Error fetching location suggestions'
        });
      }
      
      // Format response for frontend
      const suggestions = await Promise.all(response.data.predictions.map(async (prediction) => {
        // Get coordinates for each suggestion
        const geocodeResponse = await axios.get(
          `${GEOCODING_BASE_URL}?place_id=${prediction.place_id}&key=${GEOCODING_API_KEY}`
        );
        
        let latitude = null;
        let longitude = null;
        
        if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
          const location = geocodeResponse.data.results[0].geometry.location;
          latitude = location.lat;
          longitude = location.lng;
        }
        
        return {
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
          latitude,
          longitude
        };
      }));
      
      return res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      logger.error('Error in getLocationSuggestions:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },
  
  /**
   * Geocode an address to coordinates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  geocodeAddress: async (req, res) => {
    try {
      const { address, countryCode } = req.query;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Address is required'
        });
      }
      
      const options = {
        countryCode,
        limit: 1
      };
      
      const results = await defaultGeocodingService.geocode(address, options);
      
      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: 'No coordinates found for the provided address'
        });
      }
      
      const location = results[0];
      
      return res.status(200).json({
        success: true,
        data: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          displayName: location.displayName,
          formattedAddress: defaultGeocodingService._formatAddress(location),
          city: location.city || location.town || location.village || location.county,
          region: location.state,
          country: location.country
        }
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to geocode address',
        error: error.message
      });
    }
  },
  
  /**
   * Reverse geocode coordinates to an address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  reverseGeocode: async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }
      
      // Call Google Reverse Geocoding API
      const response = await axios.get(
        `${GEOCODING_BASE_URL}?latlng=${latitude},${longitude}&key=${GEOCODING_API_KEY}`
      );
      
      if (response.data.status !== 'OK') {
        logger.error(`Geocoding API error: ${response.data.status}`, {
          error_message: response.data.error_message
        });
        
        return res.status(500).json({
          success: false,
          message: 'Error in reverse geocoding'
        });
      }
      
      // Extract formatted address from results
      let address = null;
      let city = null;
      let region = null;
      let country = null;
      
      if (response.data.results.length > 0) {
        // Get the most appropriate result (usually the first one with a locality)
        const result = response.data.results.find(r => 
          r.types.includes('locality') || 
          r.types.includes('administrative_area_level_2')
        ) || response.data.results[0];
        
        address = result.formatted_address;
        
        // Extract individual components
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            region = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        address,
        city,
        region,
        country,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      });
    } catch (error) {
      logger.error('Error in reverseGeocode:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },
  
  /**
   * Get popular locations based on recent job postings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPopularLocations: async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      
      // Get the models using the database instance
      const { JobLocation } = await require('../models')();
      
      // Aggregate locations from recent job postings
      const locations = await JobLocation.findAll({
        attributes: [
          'city',
          'region',
          'country',
          [sequelize.fn('COUNT', sequelize.col('id')), 'jobCount']
        ],
        where: {
          city: { [Op.ne]: null }
        },
        group: ['city', 'region', 'country'],
        order: [[sequelize.literal('jobCount'), 'DESC']],
        limit: parseInt(limit, 10)
      });
      
      return res.status(200).json({
        success: true,
        data: locations.map(location => ({
          city: location.city,
          region: location.region,
          country: location.country,
          jobCount: location.get('jobCount')
        }))
      });
    } catch (error) {
      console.error('Error getting popular locations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get popular locations',
        error: error.message
      });
    }
  },
  
  /**
   * Get locations within a radius
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getLocationsInRadius: async (req, res) => {
    try {
      const { latitude, longitude, radius = 50, limit = 20 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }
      
      // Get the models using the database instance
      const { JobLocation } = await require('../models')();
      
      // First get all locations
      const allLocations = await JobLocation.findAll({
        attributes: [
          'id', 'latitude', 'longitude', 'city', 'region', 'country',
          [sequelize.fn('COUNT', sequelize.col('jobId')), 'jobCount']
        ],
        where: {
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        },
        group: ['id', 'latitude', 'longitude', 'city', 'region', 'country']
      });
      
      // Calculate distance for each location and filter by radius
      const locationsInRadius = allLocations
        .filter(location => {
          return isLocationWithinRadius(
            parseFloat(latitude),
            parseFloat(longitude),
            location.latitude,
            location.longitude,
            parseFloat(radius)
          );
        })
        .map(location => ({
          id: location.id,
          city: location.city,
          region: location.region,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          jobCount: location.get('jobCount')
        }))
        .slice(0, parseInt(limit, 10));
      
      return res.status(200).json({
        success: true,
        data: locationsInRadius
      });
    } catch (error) {
      console.error('Error getting locations in radius:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get locations in radius',
        error: error.message
      });
    }
  },

  /**
   * Search jobs by location with radius
   * @route GET /api/locations/jobs
   */
  searchJobsByLocation: async (req, res) => {
    try {
      const { latitude, longitude, radius = 25, page = 1, limit = 20, ...filters } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }
      
      // Convert to numbers
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseInt(radius, 10);
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      // Create geospatial query
      const geoQuery = {
        location: {
          $geoWithin: {
            $centerSphere: [
              [lng, lat], // MongoDB uses [longitude, latitude] order
              radiusKm / 6371 // Convert km to radians (6371 is Earth's radius in km)
            ]
          }
        }
      };
      
      // Add other filters
      const query = { ...geoQuery };
      
      if (filters.jobType) {
        query.jobType = filters.jobType;
      }
      
      if (filters.skills) {
        const skillsArray = Array.isArray(filters.skills) 
          ? filters.skills 
          : filters.skills.split(',');
        
        query.skills = { $in: skillsArray };
      }
      
      if (filters.minBudget) {
        query.budget = { $gte: parseFloat(filters.minBudget) };
      }
      
      if (filters.maxBudget) {
        query.budget = { ...query.budget, $lte: parseFloat(filters.maxBudget) };
      }
      
      // Only show active jobs
      query.status = 'active';
      
      // Perform the search with pagination
      const jobs = await Job.find(query)
        .select('title description location jobType budget skills createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));
        
      const total = await Job.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            pages: Math.ceil(total / parseInt(limit, 10))
          }
        }
      });
    } catch (error) {
      logger.error('Error in searchJobsByLocation:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  /**
   * Search workers by location with radius
   * @route GET /api/locations/workers
   */
  searchWorkersByLocation: async (req, res) => {
    try {
      const { latitude, longitude, radius = 25, page = 1, limit = 20, ...filters } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }
      
      // Convert to numbers
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseInt(radius, 10);
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      // Create geospatial query
      const geoQuery = {
        'location.coordinates': {
          $geoWithin: {
            $centerSphere: [
              [lng, lat], // MongoDB uses [longitude, latitude] order
              radiusKm / 6371 // Convert km to radians (6371 is Earth's radius in km)
            ]
          }
        }
      };
      
      // Add other filters
      const query = { 
        ...geoQuery,
        userType: 'worker', // Only get worker profiles
        isActive: true // Only get active profiles
      };
      
      if (filters.skills) {
        const skillsArray = Array.isArray(filters.skills) 
          ? filters.skills 
          : filters.skills.split(',');
        
        query.skills = { $in: skillsArray };
      }
      
      if (filters.hourlyRateMin) {
        query.hourlyRate = { $gte: parseFloat(filters.hourlyRateMin) };
      }
      
      if (filters.hourlyRateMax) {
        query.hourlyRate = { ...query.hourlyRate, $lte: parseFloat(filters.hourlyRateMax) };
      }
      
      // Perform the search with pagination
      const workers = await Profile.find(query)
        .select('userId name title location skills hourlyRate rating reviewCount')
        .sort({ rating: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));
        
      const total = await Profile.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        data: {
          workers,
          pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            pages: Math.ceil(total / parseInt(limit, 10))
          }
        }
      });
    } catch (error) {
      logger.error('Error in searchWorkersByLocation:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  /**
   * Save a location-based search
   * @route POST /api/locations/saved-searches
   */
  saveSearch: async (req, res) => {
    try {
      const { userId } = req.user;
      const { latitude, longitude, radius, location, filters, notifyNew } = req.body;
      
      if (!latitude || !longitude || !location) {
        return res.status(400).json({
          success: false,
          message: 'Latitude, longitude, and location name are required'
        });
      }
      
      // Create a new saved search
      const savedSearch = new SavedSearch({
        userId,
        type: 'location',
        name: `Location search for ${location}`,
        query: {
          latitude,
          longitude,
          radius: radius || 25,
          location,
          ...filters
        },
        notifyNew: notifyNew || false
      });
      
      await savedSearch.save();
      
      return res.status(201).json({
        success: true,
        data: savedSearch
      });
    } catch (error) {
      logger.error('Error in saveSearch:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  /**
   * Get saved location searches for a user
   * @route GET /api/locations/saved-searches
   */
  getSavedSearches: async (req, res) => {
    try {
      const { userId } = req.user;
      
      const savedSearches = await SavedSearch.find({
        userId,
        type: 'location'
      }).sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        data: savedSearches
      });
    } catch (error) {
      logger.error('Error in getSavedSearches:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },

  /**
   * Delete a saved search
   * @route DELETE /api/locations/saved-searches/:id
   */
  deleteSavedSearch: async (req, res) => {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      const savedSearch = await SavedSearch.findOne({
        _id: id,
        userId
      });
      
      if (!savedSearch) {
        return res.status(404).json({
          success: false,
          message: 'Saved search not found'
        });
      }
      
      await savedSearch.remove();
      
      return res.status(200).json({
        success: true,
        message: 'Saved search deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteSavedSearch:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

module.exports = locationController; 