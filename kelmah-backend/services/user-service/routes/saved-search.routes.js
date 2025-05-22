/**
 * Saved Search Routes
 * Routes for managing saved search queries
 */

const express = require('express');
const router = express.Router();
const savedSearchController = require('../controllers/saved-search.controller');
const { authenticateJWT } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateJWT);

// Get all saved searches for the current user
router.get('/', savedSearchController.getSavedSearches);

// Get a specific saved search by ID
router.get('/:id', savedSearchController.getSavedSearchById);

// Create a new saved search
router.post('/', savedSearchController.createSavedSearch);

// Update a saved search (notification settings)
router.patch('/:id', savedSearchController.updateSavedSearch);

// Delete a saved search
router.delete('/:id', savedSearchController.deleteSavedSearch);

// Process notifications for saved searches - protected by API key
// This would typically be called by a scheduler or cron job
router.post('/process-notifications', savedSearchController.processSearchNotifications);

module.exports = router; 