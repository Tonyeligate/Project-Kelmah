/**
 * Saved Search Controller
 * Manages saved search queries and notifications
 */

const { SavedSearch, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const savedSearchController = {
  /**
   * Get all saved searches for a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with saved searches
   */
  getSavedSearches: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const savedSearches = await SavedSearch.findByUserId(userId);
      
      return res.status(200).json({
        success: true,
        data: savedSearches
      });
    } catch (error) {
      logger.error(`Error getting saved searches: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve saved searches',
        error: error.message
      });
    }
  },
  
  /**
   * Get a specific saved search by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with saved search
   */
  getSavedSearchById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const savedSearch = await SavedSearch.findOne({
        where: {
          id,
          userId
        }
      });
      
      if (!savedSearch) {
        return res.status(404).json({
          success: false,
          message: 'Saved search not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: savedSearch
      });
    } catch (error) {
      logger.error(`Error getting saved search by ID: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve saved search',
        error: error.message
      });
    }
  },
  
  /**
   * Create a new saved search
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with created saved search
   */
  createSavedSearch: async (req, res) => {
    try {
      const userId = req.user.id;
      const { query, parameters, notificationsEnabled = false } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      // Check if user already has this search saved
      const existingSearch = await SavedSearch.findOne({
        where: {
          userId,
          query: {
            [Op.iLike]: query
          }
        }
      });
      
      if (existingSearch) {
        return res.status(400).json({
          success: false,
          message: 'You already have this search saved',
          data: existingSearch
        });
      }
      
      // Limit saved searches per user (e.g., 10)
      const userSearchCount = await SavedSearch.count({
        where: { userId }
      });
      
      if (userSearchCount >= 10) {
        return res.status(400).json({
          success: false,
          message: 'You can save a maximum of 10 searches. Please delete some saved searches to add more.'
        });
      }
      
      const savedSearch = await SavedSearch.create({
        userId,
        query,
        parameters,
        notificationsEnabled
      });
      
      return res.status(201).json({
        success: true,
        message: 'Search saved successfully',
        data: savedSearch
      });
    } catch (error) {
      logger.error(`Error creating saved search: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to save search',
        error: error.message
      });
    }
  },
  
  /**
   * Update a saved search
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with updated saved search
   */
  updateSavedSearch: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { notificationsEnabled } = req.body;
      
      const savedSearch = await SavedSearch.findOne({
        where: {
          id,
          userId
        }
      });
      
      if (!savedSearch) {
        return res.status(404).json({
          success: false,
          message: 'Saved search not found'
        });
      }
      
      // Only allow updating notification settings
      savedSearch.notificationsEnabled = notificationsEnabled;
      await savedSearch.save();
      
      return res.status(200).json({
        success: true,
        message: 'Saved search updated successfully',
        data: savedSearch
      });
    } catch (error) {
      logger.error(`Error updating saved search: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to update saved search',
        error: error.message
      });
    }
  },
  
  /**
   * Delete a saved search
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with deletion result
   */
  deleteSavedSearch: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const savedSearch = await SavedSearch.findOne({
        where: {
          id,
          userId
        }
      });
      
      if (!savedSearch) {
        return res.status(404).json({
          success: false,
          message: 'Saved search not found'
        });
      }
      
      await savedSearch.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Saved search deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting saved search: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete saved search',
        error: error.message
      });
    }
  },
  
  /**
   * Process saved searches for notifications 
   * This would be called by a cron job or scheduler
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - JSON response with notification results
   */
  processSearchNotifications: async (req, res) => {
    try {
      // Check if request comes from authorized source (e.g., via API key)
      if (!req.headers['x-api-key'] || req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      // Get all saved searches with notifications enabled
      const searches = await SavedSearch.findWithNotificationsEnabled();
      
      if (!searches.length) {
        return res.status(200).json({
          success: true,
          message: 'No searches to process',
          count: 0
        });
      }
      
      // This would typically call a notification service or job search service
      // For now, we'll just mark the notifications as sent
      const processedSearches = await Promise.all(
        searches.map(async (search) => {
          // Mock result count - in production this would do an actual search
          const resultCount = Math.floor(Math.random() * 5);
          
          if (resultCount > 0 && search.user) {
            // Here we would trigger a notification to the user
            logger.info(`Would send notification to user ${search.user.id} for search "${search.query}" with ${resultCount} new results`);
          }
          
          await search.markNotificationSent(resultCount);
          return {
            searchId: search.id,
            query: search.query,
            userId: search.userId,
            resultCount
          };
        })
      );
      
      return res.status(200).json({
        success: true,
        message: 'Search notifications processed successfully',
        count: processedSearches.length,
        processed: processedSearches
      });
    } catch (error) {
      logger.error(`Error processing search notifications: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to process search notifications',
        error: error.message
      });
    }
  }
};

module.exports = savedSearchController; 