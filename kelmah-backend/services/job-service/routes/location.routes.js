const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/suggestions', locationController.getLocationSuggestions);
router.get('/reverse', locationController.reverseGeocode);
router.get('/jobs', locationController.searchJobsByLocation);
router.get('/workers', locationController.searchWorkersByLocation);

// Protected routes (require authentication)
router.use(authenticate);
router.post('/saved-searches', locationController.saveSearch);
router.get('/saved-searches', locationController.getSavedSearches);
router.delete('/saved-searches/:id', locationController.deleteSavedSearch);

module.exports = router; 