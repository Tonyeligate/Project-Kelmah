/**
 * Location Routes
 * Handles routes for location-related operations such as geocoding and location suggestions
 */

const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/location.controller');

/**
 * @route GET /api/locations/suggestions
 * @desc Get location suggestions based on query
 * @access Public
 */
router.get('/suggestions', locationController.getLocationSuggestions);

/**
 * @route GET /api/locations/geocode
 * @desc Convert address to coordinates
 * @access Public
 */
router.get('/geocode', locationController.geocodeAddress);

/**
 * @route GET /api/locations/reverse-geocode
 * @desc Convert coordinates to address
 * @access Public
 */
router.get('/reverse-geocode', locationController.reverseGeocode);

/**
 * @route GET /api/locations/popular
 * @desc Get popular locations based on job postings
 * @access Public
 */
router.get('/popular', locationController.getPopularLocations);

/**
 * @route GET /api/locations/in-radius
 * @desc Get locations within a radius of coordinates
 * @access Public
 */
router.get('/in-radius', locationController.getLocationsInRadius);

module.exports = router; 