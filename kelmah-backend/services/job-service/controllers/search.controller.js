/**
 * Search Controller
 * Handles advanced search functionality for the job service
 */

const { getModels } = require('../models');
const logger = require('../utils/logger');
const { Op, Sequelize } = require('sequelize');
const searchNLP = require('../../user-service/utils/searchNLP');
const { defaultGeocodingService } = require('../utils/geocoding');
const { isLocationWithinRadius } = require('../utils/geolocation');
const nlpUtils = require('../utils/nlp');

/**
 * Advanced search for jobs with multiple criteria and intelligent matching
 */
exports.advancedJobSearch = async (req, res) => {
  try {
    const { Job, User, Application } = await getModels();
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Initialize filter object
    const filter = {
      status: 'open',
      visibility: 'public',
      deletedAt: null
    };
    
    // Process natural language query if present
    if (req.query.nlQuery && typeof req.query.nlQuery === 'string') {
      const nlParams = searchNLP.parseNaturalLanguageQuery(req.query.nlQuery);
      
      // Apply extracted parameters to filter
      if (nlParams.skills && nlParams.skills.length > 0) {
        req.query.skills = nlParams.skills.join(',');
      }
      
      if (nlParams.jobType) {
        req.query.jobType = nlParams.jobType;
      }
      
      if (nlParams.location) {
        req.query.location = nlParams.location;
      }
      
      if (nlParams.budget) {
        if (nlParams.budget.minBudget !== null) {
          req.query.minBudget = nlParams.budget.minBudget;
        }
        if (nlParams.budget.maxBudget !== null) {
          req.query.maxBudget = nlParams.budget.maxBudget;
        }
      }
      
      // Use the original query for keyword search if no other parameters were extracted
      if (nlParams.skills.length === 0 && !nlParams.jobType && !nlParams.location && !nlParams.budget) {
        req.query.query = req.query.nlQuery;
      }
    }
    
    // Build complex filter based on query parameters
    
    // Text search (search in title and description)
    if (req.query.query) {
      filter[Op.or] = [
        { title: { [Op.iLike]: `%${req.query.query}%` } },
        { description: { [Op.iLike]: `%${req.query.query}%` } }
      ];
    }
    
    // Category filter (can be multiple, comma separated)
    if (req.query.categories) {
      const categories = req.query.categories.split(',').map(c => c.trim());
      filter.category = { [Op.in]: categories };
    }
    
    // Skills filter (array or comma separated)
    if (req.query.skills) {
      const skills = Array.isArray(req.query.skills) 
        ? req.query.skills 
        : req.query.skills.split(',').map(s => s.trim());
      
      filter.skills = {
        [Op.overlap]: skills
      };
    }
    
    // Budget range filter
    if (req.query.minBudget || req.query.maxBudget) {
      filter.budget = {};
      
      if (req.query.minBudget) {
        filter.budget[Op.gte] = parseFloat(req.query.minBudget);
      }
      
      if (req.query.maxBudget) {
        filter.budget[Op.lte] = parseFloat(req.query.maxBudget);
      }
    }
    
    // Job type filter (full-time, part-time, contract, etc.)
    if (req.query.jobType) {
      const jobTypes = req.query.jobType.split(',').map(t => t.trim());
      filter.jobType = { [Op.in]: jobTypes };
    }
    
    // Experience level filter
    if (req.query.experience) {
      const experienceLevels = req.query.experience.split(',').map(e => e.trim());
      filter.experience = { [Op.in]: experienceLevels };
    }
    
    // Date filter (posted within X days)
    if (req.query.postedWithin) {
      const days = parseInt(req.query.postedWithin, 10);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      filter.createdAt = {
        [Op.gte]: fromDate
      };
    }
    
    // Location filter (if geolocation data is available)
    if (req.query.location) {
      filter.location = { [Op.iLike]: `%${req.query.location}%` };
    }
    
    // Get additional options
    const options = {
      where: filter,
      limit,
      offset,
      order: []
    };
    
    // Add sorting options
    const sort = req.query.sort || 'newest';
    switch (sort) {
      case 'newest':
        options.order.push(['createdAt', 'DESC']);
        break;
      case 'oldest':
        options.order.push(['createdAt', 'ASC']);
        break;
      case 'budget_high':
        options.order.push(['budget', 'DESC']);
        break;
      case 'budget_low':
        options.order.push(['budget', 'ASC']);
        break;
      case 'relevance':
        // If text search is used, sort by relevance
        if (req.query.query || req.query.nlQuery) {
          // This requires a more complex implementation with full-text search
          // For now, just use the default order
          options.order.push(['createdAt', 'DESC']);
        } else {
          options.order.push(['createdAt', 'DESC']);
        }
        break;
      default:
        options.order.push(['createdAt', 'DESC']);
    }
    
    // Include job creator information
    options.include = [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }
    ];
    
    // Execute the search query
    const { count, rows } = await Job.findAndCountAll(options);
    
    // Check if authenticated user has already applied to these jobs
    let userApplications = {};
    if (req.user) {
      const jobIds = rows.map(job => job.id);
      
      const applications = await Application.findAll({
        where: {
          jobId: { [Op.in]: jobIds },
          applicantId: req.user.id
        },
        attributes: ['jobId', 'status']
      });
      
      // Create a map for quick lookup
      userApplications = applications.reduce((acc, app) => {
        acc[app.jobId] = app.status;
        return acc;
      }, {});
    }
    
    // Process results
    const jobs = rows.map(job => {
      const jobData = job.toJSON();
      
      // Add application status if user is authenticated
      if (req.user) {
        jobData.hasApplied = !!userApplications[job.id];
        jobData.applicationStatus = userApplications[job.id] || null;
      }
      
      return jobData;
    });
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    // Return response
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: jobs
    });
  } catch (error) {
    logger.error(`Error in advancedJobSearch: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to search for jobs',
      error: error.message
    });
  }
};

/**
 * Get search suggestions based on user input
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    // Get the models using the database instance
    const { Job, Category, Skill, JobLocation } = await getModels();
    
    // Process the query to extract entities and keywords
    const { keywords, entities } = await nlpUtils.extractEntities(query);
    
    const results = {
      jobTitles: [],
      skills: [],
      categories: [],
      locations: [],
      companies: []
    };
    
    // Search for job titles
    const jobTitleResults = await Job.findAll({
      attributes: ['title'],
      where: {
        title: {
          [Op.iLike]: `%${query}%`
        }
      },
      group: ['title'],
      limit: parseInt(limit, 10)
    });
    
    results.jobTitles = jobTitleResults.map(job => job.title);
    
    // Search for skills
    if (keywords.length > 0) {
      const skillResults = await Skill.findAll({
        attributes: ['name'],
        where: {
          name: {
            [Op.iLike]: { [Op.any]: keywords.map(k => `%${k}%`) }
          }
        },
        limit: parseInt(limit, 10)
      });
      
      results.skills = skillResults.map(skill => skill.name);
    }
    
    // Search for categories
    const categoryResults = await Category.findAll({
      attributes: ['name'],
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit: parseInt(limit, 10)
    });
    
    results.categories = categoryResults.map(category => category.name);
    
    // Search for companies
    const companyResults = await Job.findAll({
      attributes: ['companyName'],
      where: {
        companyName: {
          [Op.iLike]: `%${query}%`
        }
      },
      group: ['companyName'],
      limit: parseInt(limit, 10)
    });
    
    results.companies = companyResults.map(job => job.companyName);
    
    // If location entities were detected in the query, get location suggestions
    if (entities.locations && entities.locations.length > 0) {
      const locationQuery = entities.locations.join(' ');
      const locationSuggestions = await defaultGeocodingService.getSuggestions(locationQuery, { limit: 5 });
      
      if (locationSuggestions.length > 0) {
        results.locations = locationSuggestions;
      }
    }
    
    // Format suggestions for frontend
    const suggestions = [];
    
    // Add job title suggestions
    if (results.jobTitles.length > 0) {
      suggestions.push({
        type: 'jobTitles',
        title: 'Job Titles',
        items: results.jobTitles.map(title => ({
          text: title,
          type: 'jobTitle',
          query: `title:"${title}"`
        }))
      });
    }
    
    // Add skill suggestions
    if (results.skills.length > 0) {
      suggestions.push({
        type: 'skills',
        title: 'Skills',
        items: results.skills.map(skill => ({
          text: skill,
          type: 'skill',
          query: `skill:"${skill}"`
        }))
      });
    }
    
    // Add category suggestions
    if (results.categories.length > 0) {
      suggestions.push({
        type: 'categories',
        title: 'Categories',
        items: results.categories.map(category => ({
          text: category,
          type: 'category',
          query: `category:"${category}"`
        }))
      });
    }
    
    // Add company suggestions
    if (results.companies.length > 0) {
      suggestions.push({
        type: 'companies',
        title: 'Companies',
        items: results.companies.map(company => ({
          text: company,
          type: 'company',
          query: `company:"${company}"`
        }))
      });
    }
    
    // Add location suggestions
    if (results.locations.length > 0) {
      suggestions.push({
        type: 'locations',
        title: 'Locations',
        items: results.locations.map(location => ({
          text: location.formattedAddress,
          type: 'location',
          data: location
        }))
      });
    }
    
    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
};

/**
 * Geolocation-based job search
 */
exports.nearbyJobs = async (req, res) => {
  try {
    const { Job } = await getModels();
    
    // Required parameters
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Base filter 
    const filter = {
      status: 'open',
      visibility: 'public',
      deletedAt: null
    };
    
    // If the Job model has location data (latitude/longitude)
    // Implement the distance calculation using Haversine formula
    // This is a simplified version and assumes the database has postgis extension
    // For actual implementation, consider using a proper spatial database or service
    
    // Using sequelize literal for the distance calculation
    const distanceCalc = Sequelize.literal(`
      (
        6371 * acos(
          cos(radians(${parseFloat(latitude)})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${parseFloat(longitude)})) + 
          sin(radians(${parseFloat(latitude)})) * 
          sin(radians(latitude))
        )
      )
    `);
    
    // Get jobs with pagination and distance calculation
    const { count, rows } = await Job.findAndCountAll({
      where: filter,
      attributes: {
        include: [[distanceCalc, 'distance']]
      },
      having: Sequelize.literal(`distance <= ${parseFloat(radius)}`),
      order: [[Sequelize.col('distance'), 'ASC']],
      limit,
      offset
    });
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: rows
    });
  } catch (error) {
    logger.error(`Error in nearbyJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to find nearby jobs',
      error: error.message
    });
  }
};

/**
 * Job recommendations based on user profile, skills, and history
 */
exports.recommendJobs = async (req, res) => {
  try {
    const { Job, User, Application } = await getModels();
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for personalized recommendations'
      });
    }
    
    const userId = req.user.id;
    
    // Get user profile with skills
    const user = await User.findByPk(userId, {
      attributes: ['id', 'skills', 'jobPreferences']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Extract user skills and preferences
    const userSkills = user.skills || [];
    const userPreferences = user.jobPreferences || {};
    
    // Base filter
    const filter = {
      status: 'open',
      visibility: 'public',
      deletedAt: null
    };
    
    // Find jobs that match user's skills
    if (userSkills.length > 0) {
      filter.skills = {
        [Op.overlap]: userSkills
      };
    }
    
    // Apply user preferences if available
    if (userPreferences.jobTypes && userPreferences.jobTypes.length > 0) {
      filter.jobType = {
        [Op.in]: userPreferences.jobTypes
      };
    }
    
    if (userPreferences.experienceLevels && userPreferences.experienceLevels.length > 0) {
      filter.experience = {
        [Op.in]: userPreferences.experienceLevels
      };
    }
    
    if (userPreferences.minBudget) {
      if (!filter.budget) filter.budget = {};
      filter.budget[Op.gte] = parseFloat(userPreferences.minBudget);
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Get jobs that match user profile
    const { count, rows } = await Job.findAndCountAll({
      where: filter,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Check if user has already applied to these jobs
    const jobIds = rows.map(job => job.id);
    
    const applications = await Application.findAll({
      where: {
        jobId: { [Op.in]: jobIds },
        applicantUserId: userId
      },
      attributes: ['jobId', 'status']
    });
    
    // Create a map for quick lookup
    const applicationMap = {};
    applications.forEach(app => {
      applicationMap[app.jobId] = app.status;
    });
    
    // Add application status and calculate match score
    const jobsWithScore = rows.map(job => {
      const jobData = job.toJSON();
      
      // Calculate match score based on skills overlap
      let matchScore = 0;
      if (userSkills.length > 0 && job.skills && job.skills.length > 0) {
        const skillsOverlap = userSkills.filter(skill => job.skills.includes(skill));
        matchScore = Math.round((skillsOverlap.length / job.skills.length) * 100);
      }
      
      // Add preference match boost
      if (userPreferences.jobTypes && userPreferences.jobTypes.includes(job.jobType)) {
        matchScore += 10;
      }
      
      if (userPreferences.experienceLevels && userPreferences.experienceLevels.includes(job.experience)) {
        matchScore += 10;
      }
      
      // Cap at 100
      matchScore = Math.min(matchScore, 100);
      
      jobData.matchScore = matchScore;
      jobData.hasApplied = !!applicationMap[job.id];
      jobData.applicationStatus = applicationMap[job.id] || null;
      
      return jobData;
    });
    
    // Sort by match score
    jobsWithScore.sort((a, b) => b.matchScore - a.matchScore);
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: jobsWithScore
    });
  } catch (error) {
    logger.error(`Error in recommendJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate job recommendations',
      error: error.message
    });
  }
};

/**
 * Advanced job search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchJobs = async (req, res) => {
  try {
    const {
      keyword,
      categoryId,
      location,
      radius = 50,
      jobType,
      experienceLevel,
      minBudget,
      maxBudget,
      skills = [],
      page = 1,
      limit = 20
    } = req.query;
    
    // Parse pagination parameters
    const pagination = {
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      limit: parseInt(limit, 10)
    };
    
    // Get the models using the database instance
    const { Job, Category, Skill, JobLocation } = await getModels();
    
    // Build the where clause for the search
    const where = {
      status: 'active'
    };
    
    // Add keyword search if provided
    if (keyword) {
      const { keywords, entities } = await nlpUtils.extractEntities(keyword);
      
      // Search in title and description
      where[Op.or] = [
        { title: { [Op.iLike]: { [Op.any]: keywords.map(k => `%${k}%`) } } },
        { description: { [Op.iLike]: { [Op.any]: keywords.map(k => `%${k}%`) } } }
      ];
      
      // If company entity was detected, add it to the search
      if (entities.companies && entities.companies.length > 0) {
        where[Op.or].push({
          companyName: { [Op.iLike]: { [Op.any]: entities.companies.map(c => `%${c}%`) } }
        });
      }
    }
    
    // Add job type filter if provided
    if (jobType) {
      where.jobType = jobType;
    }
    
    // Add experience level filter if provided
    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }
    
    // Add budget range filter if provided
    if (minBudget || maxBudget) {
      where.budget = {};
      
      if (minBudget) {
        where.budget[Op.gte] = parseFloat(minBudget);
      }
      
      if (maxBudget) {
        where.budget[Op.lte] = parseFloat(maxBudget);
      }
    }
    
    // Define include for related models
    const include = [];
    
    // Add category include if provided
    if (categoryId) {
      include.push({
        model: Category,
        where: { id: categoryId },
        attributes: ['id', 'name']
      });
    } else {
      include.push({
        model: Category,
        attributes: ['id', 'name']
      });
    }
    
    // Add skills include if provided
    if (skills.length > 0) {
      include.push({
        model: Skill,
        where: {
          name: { [Op.in]: skills }
        },
        attributes: ['id', 'name'],
        through: { attributes: [] }
      });
    } else {
      include.push({
        model: Skill,
        attributes: ['id', 'name'],
        through: { attributes: [] }
      });
    }
    
    // Add location include
    const locationInclude = {
      model: JobLocation,
      attributes: ['id', 'latitude', 'longitude', 'city', 'region', 'country']
    };
    
    // If location is provided, filter by radius
    if (location && location.latitude && location.longitude) {
      // We'll filter by radius after the initial query
      include.push(locationInclude);
    } else {
      include.push(locationInclude);
    }
    
    // Execute the search query
    const { count, rows } = await Job.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      ...pagination
    });
    
    // If location is provided, filter results by radius
    let filteredJobs = rows;
    
    if (location && location.latitude && location.longitude) {
      filteredJobs = rows.filter(job => {
        if (!job.JobLocation || !job.JobLocation.latitude || !job.JobLocation.longitude) {
          return false;
        }
        
        return isLocationWithinRadius(
          parseFloat(location.latitude),
          parseFloat(location.longitude),
          job.JobLocation.latitude,
          job.JobLocation.longitude,
          parseFloat(radius)
        );
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        jobs: filteredJobs,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error.message
    });
  }
}; 