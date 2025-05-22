const Profile = require('../models/profile.model');
const Skill = require('../models/skill.model');
const { response } = require('../../../shared');
const mongoose = require('mongoose');
const searchService = require('../services/search.service');

/**
 * Search for workers by various criteria
 * @route GET /search/workers
 * @access Public
 */
exports.searchWorkers = async (req, res) => {
  try {
    const searchParams = {
      keyword: req.query.keyword,
      skills: req.query.skills ? JSON.parse(req.query.skills) : [],
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : 0,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating) : 5,
      availability: req.query.availability,
      sortBy: req.query.sortBy || 'rating',
      sortDirection: req.query.sortDirection || 'DESC',
      priceRange: req.query.priceRange ? JSON.parse(req.query.priceRange) : null,
      categories: req.query.categories ? JSON.parse(req.query.categories) : [],
      jobType: req.query.jobType,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    // Handle location-based search if coordinates provided
    if (req.query.latitude && req.query.longitude) {
      searchParams.location = {
        latitude: parseFloat(req.query.latitude),
        longitude: parseFloat(req.query.longitude)
      };

      // Add distance if provided
      if (req.query.distance) {
        searchParams.distance = parseFloat(req.query.distance);
      }
    }

    const results = await searchService.searchWorkers(searchParams);
    res.json(results);
  } catch (error) {
    console.error('Error in searchWorkers controller:', error);
    res.status(500).json({ error: 'Failed to search workers' });
  }
};

/**
 * Get featured workers
 * @route GET /search/featured
 * @access Public
 */
exports.getFeaturedWorkers = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    // Get workers with highest number of skills and recent activity
    const profiles = await Profile.find({
      isActive: true,
      'preferences.visibility': { $ne: 'private' },
      isVerified: true // Only show verified workers in featured
    })
    .select('userId headline skills hourlyRate profilePicture')
    .sort({ lastActive: -1 })
    .limit(Number(limit));
    
    return response.success(res, 200, profiles);
  } catch (error) {
    console.error('Featured workers error:', error);
    return response.error(res, 500, 'Failed to get featured workers');
  }
};

/**
 * Get popular skills
 * @route GET /search/skills/popular
 * @access Public
 */
exports.getPopularSkills = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get most popular skills from the skill model
    const skills = await Skill.getPopularSkills(Number(limit));
    
    return response.success(res, 200, skills);
  } catch (error) {
    console.error('Popular skills error:', error);
    return response.error(res, 500, 'Failed to get popular skills');
  }
};

/**
 * Search skills
 * @route GET /search/skills
 * @access Public
 */
exports.searchSkills = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return response.error(res, 400, 'Search query must be at least 2 characters');
    }
    
    // Search for skills
    const skills = await Skill.searchSkills(query);
    
    return response.success(res, 200, skills);
  } catch (error) {
    console.error('Search skills error:', error);
    return response.error(res, 500, 'Failed to search skills');
  }
};

/**
 * Search for jobs with advanced filtering
 */
exports.searchJobs = async (req, res) => {
  try {
    const searchParams = {
      keyword: req.query.keyword,
      skills: req.query.skills ? JSON.parse(req.query.skills) : [],
      categories: req.query.categories ? JSON.parse(req.query.categories) : [],
      jobType: req.query.jobType,
      budgetMin: req.query.budgetMin ? parseFloat(req.query.budgetMin) : null,
      budgetMax: req.query.budgetMax ? parseFloat(req.query.budgetMax) : null,
      sortBy: req.query.sortBy || 'createdAt',
      sortDirection: req.query.sortDirection || 'DESC',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    // Handle location-based search if coordinates provided
    if (req.query.latitude && req.query.longitude) {
      searchParams.location = {
        latitude: parseFloat(req.query.latitude),
        longitude: parseFloat(req.query.longitude)
      };

      // Add distance if provided
      if (req.query.distance) {
        searchParams.distance = parseFloat(req.query.distance);
      }
    }

    const results = await searchService.searchJobs(searchParams);
    res.json(results);
  } catch (error) {
    console.error('Error in searchJobs controller:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
};

/**
 * Get job recommendations for a worker
 */
exports.getJobRecommendations = async (req, res) => {
  try {
    const { workerId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const recommendations = await searchService.getJobRecommendations(workerId, limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in getJobRecommendations controller:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
};

/**
 * Get worker recommendations for a job
 */
exports.getWorkerRecommendations = async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const recommendations = await searchService.getWorkerRecommendations(jobId, limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in getWorkerRecommendations controller:', error);
    res.status(500).json({ error: 'Failed to get worker recommendations' });
  }
};

/**
 * Save a search for future reference
 */
exports.saveSearch = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, type, parameters } = req.body;

    if (!name || !type || !parameters) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const savedSearch = await searchService.saveSearch(userId, name, type, parameters);
    res.status(201).json(savedSearch);
  } catch (error) {
    console.error('Error in saveSearch controller:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
};

/**
 * Get popular search terms (analytics)
 */
exports.getPopularSearchTerms = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const popularTerms = await searchService.getPopularSearchTerms(limit);
    res.json(popularTerms);
  } catch (error) {
    console.error('Error in getPopularSearchTerms controller:', error);
    res.status(500).json({ error: 'Failed to get popular search terms' });
  }
};

/**
 * Clear search cache
 */
exports.clearSearchCache = async (req, res) => {
  try {
    const { key } = req.query;
    const result = await searchService.clearCache(key || null);
    res.json(result);
  } catch (error) {
    console.error('Error in clearSearchCache controller:', error);
    res.status(500).json({ error: 'Failed to clear search cache' });
  }
}; 