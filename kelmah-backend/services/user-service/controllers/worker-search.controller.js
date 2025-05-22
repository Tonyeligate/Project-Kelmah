/**
 * Worker Search Controller
 * Handles advanced search functionality for finding workers
 */

const { User, WorkerProfile, Review, Skill } = require('../models');
const { Op, Sequelize, literal } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Advanced worker search with filtering capabilities
 */
exports.searchWorkers = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Initialize filter object
    const filter = {
      role: 'worker', // Only search for workers
      isActive: true,
      profileVisibility: 'public'
    };
    
    // Build complex filter based on query parameters
    
    // Text search (search in name, headline, or bio)
    if (req.query.query) {
      filter[Op.or] = [
        { firstName: { [Op.iLike]: `%${req.query.query}%` } },
        { lastName: { [Op.iLike]: `%${req.query.query}%` } },
        { '$workerProfile.headline$': { [Op.iLike]: `%${req.query.query}%` } },
        { '$workerProfile.bio$': { [Op.iLike]: `%${req.query.query}%` } }
      ];
    }
    
    // Skills filter (array or comma separated)
    const includeSkills = [];
    if (req.query.skills) {
      const skills = Array.isArray(req.query.skills) 
        ? req.query.skills 
        : req.query.skills.split(',').map(s => s.trim());
      
      includeSkills.push({
        model: Skill,
        where: {
          name: { [Op.in]: skills }
        },
        required: true
      });
    }
    
    // Hourly rate range filter
    if (req.query.minRate || req.query.maxRate) {
      if (!filter['$workerProfile.hourlyRate$']) {
        filter['$workerProfile.hourlyRate$'] = {};
      }
      
      if (req.query.minRate) {
        filter['$workerProfile.hourlyRate$'][Op.gte] = parseFloat(req.query.minRate);
      }
      
      if (req.query.maxRate) {
        filter['$workerProfile.hourlyRate$'][Op.lte] = parseFloat(req.query.maxRate);
      }
    }
    
    // Availability filter (full-time, part-time, contract, etc.)
    if (req.query.availability) {
      const availabilities = req.query.availability.split(',').map(a => a.trim());
      filter['$workerProfile.availability$'] = { [Op.in]: availabilities };
    }
    
    // Experience level filter
    if (req.query.experience) {
      const experienceLevels = req.query.experience.split(',').map(e => e.trim());
      filter['$workerProfile.experienceLevel$'] = { [Op.in]: experienceLevels };
    }
    
    // Rating filter
    if (req.query.minRating) {
      filter['$workerProfile.rating$'] = { [Op.gte]: parseFloat(req.query.minRating) };
    }
    
    // Location filter
    if (req.query.location) {
      filter['$workerProfile.location$'] = { [Op.iLike]: `%${req.query.location}%` };
    }
    
    // Remote only filter
    if (req.query.remoteOnly === 'true') {
      filter['$workerProfile.isRemote$'] = true;
    }
    
    // Get additional options
    const options = {
      where: filter,
      include: [
        {
          model: WorkerProfile,
          as: 'workerProfile',
          required: true,
          include: [
            {
              model: Review,
              as: 'reviews',
              required: false
            }
          ]
        },
        ...includeSkills
      ],
      limit,
      offset,
      order: []
    };
    
    // Add sorting options
    const sort = req.query.sort || 'relevance';
    switch (sort) {
      case 'rating_high':
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'rating', 'DESC']);
        break;
      case 'rating_low':
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'rating', 'ASC']);
        break;
      case 'hourly_high':
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'hourlyRate', 'DESC']);
        break;
      case 'hourly_low':
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'hourlyRate', 'ASC']);
        break;
      case 'experience_high':
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'experienceYears', 'DESC']);
        break;
      case 'relevance':
      default:
        // For relevance, we could use more complex logic
        // For now, order by rating or experience
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'rating', 'DESC']);
        options.order.push([{ model: WorkerProfile, as: 'workerProfile' }, 'experienceYears', 'DESC']);
    }
    
    // Get users with pagination
    const { count, rows } = await User.findAndCountAll(options);
    
    // Process results to include relevant data and omit sensitive information
    const workers = rows.map(worker => {
      const profile = worker.workerProfile;
      return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        profilePicture: worker.profilePicture,
        skills: worker.Skills ? worker.Skills.map(skill => skill.name) : [],
        headline: profile.headline,
        hourlyRate: profile.hourlyRate,
        location: profile.location,
        isRemote: profile.isRemote,
        availability: profile.availability,
        experienceLevel: profile.experienceLevel,
        experienceYears: profile.experienceYears,
        rating: profile.rating,
        completedJobs: profile.completedJobs,
        languages: profile.languages
      };
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
      data: workers
    });
  } catch (error) {
    logger.error(`Error in searchWorkers: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to search for workers',
      error: error.message
    });
  }
};

/**
 * Geolocation-based worker search
 */
exports.nearbyWorkers = async (req, res) => {
  try {
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
      role: 'worker',
      isActive: true,
      profileVisibility: 'public'
    };
    
    // Using Sequelize literal for the distance calculation (Haversine formula)
    const distanceCalc = literal(`
      (
        6371 * acos(
          cos(radians(${parseFloat(latitude)})) * 
          cos(radians("workerProfile"."latitude")) * 
          cos(radians("workerProfile"."longitude") - radians(${parseFloat(longitude)})) + 
          sin(radians(${parseFloat(latitude)})) * 
          sin(radians("workerProfile"."latitude"))
        )
      )
    `);
    
    // Get workers with pagination and distance calculation
    const { count, rows } = await User.findAndCountAll({
      where: filter,
      include: [
        {
          model: WorkerProfile,
          as: 'workerProfile',
          required: true
        }
      ],
      attributes: {
        include: [[distanceCalc, 'distance']]
      },
      having: literal(`distance <= ${parseFloat(radius)}`),
      order: [[literal('distance'), 'ASC']],
      limit,
      offset
    });
    
    // Process results to include relevant data and omit sensitive information
    const workers = rows.map(worker => {
      const profile = worker.workerProfile;
      return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        profilePicture: worker.profilePicture,
        headline: profile.headline,
        distance: worker.get('distance'),
        hourlyRate: profile.hourlyRate,
        location: profile.location,
        isRemote: profile.isRemote,
        availability: profile.availability,
        rating: profile.rating
      };
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
      data: workers
    });
  } catch (error) {
    logger.error(`Error in nearbyWorkers: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to find nearby workers',
      error: error.message
    });
  }
};

/**
 * Worker recommendations based on job requirements
 */
exports.recommendWorkers = async (req, res) => {
  try {
    // Get job details from request
    const {
      skills = [],
      experienceLevel,
      jobType,
      budget,
      location
    } = req.body;
    
    if (!skills || !skills.length) {
      return res.status(400).json({
        success: false,
        message: 'Skills are required for worker recommendations'
      });
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Base filter
    const filter = {
      role: 'worker',
      isActive: true,
      profileVisibility: 'public'
    };
    
    // Include skills
    const includeSkills = [{
      model: Skill,
      where: {
        name: { [Op.in]: skills }
      },
      required: false // We'll calculate match score based on overlap
    }];
    
    // Experience level filter if provided
    if (experienceLevel) {
      filter['$workerProfile.experienceLevel$'] = experienceLevel;
    }
    
    // Availability filter based on job type
    if (jobType) {
      // Map job type to worker availability
      // e.g., 'full-time' job type might look for 'Full-Time' availability
      const availabilityMap = {
        'full-time': 'Full-Time',
        'part-time': 'Part-Time',
        'contract': 'Contract',
        'freelance': 'Freelance'
      };
      
      const availability = availabilityMap[jobType.toLowerCase()];
      if (availability) {
        filter['$workerProfile.availability$'] = availability;
      }
    }
    
    // Budget filter - hourly rate should be <= budget/40 (assuming weekly budget)
    if (budget) {
      // Convert budget to hourly rate
      const estimatedHourlyRate = parseFloat(budget) / 40;
      filter['$workerProfile.hourlyRate$'] = { [Op.lte]: estimatedHourlyRate };
    }
    
    // Location filter
    if (location) {
      filter['$workerProfile.location$'] = { [Op.iLike]: `%${location}%` };
    }
    
    // Get users with pagination
    const { count, rows } = await User.findAndCountAll({
      where: filter,
      include: [
        {
          model: WorkerProfile,
          as: 'workerProfile',
          required: true,
          include: [
            {
              model: Review,
              as: 'reviews',
              required: false
            }
          ]
        },
        ...includeSkills
      ],
      limit,
      offset,
      order: [[{ model: WorkerProfile, as: 'workerProfile' }, 'rating', 'DESC']]
    });
    
    // Process results and calculate match score
    const workers = rows.map(worker => {
      const profile = worker.workerProfile;
      
      // Calculate match score based on skills overlap
      const workerSkills = worker.Skills ? worker.Skills.map(skill => skill.name) : [];
      const skillsOverlap = skills.filter(skill => workerSkills.includes(skill));
      const skillMatchPercentage = skills.length > 0 
        ? Math.round((skillsOverlap.length / skills.length) * 100) 
        : 0;
      
      // Calculate additional match factors
      let matchScore = skillMatchPercentage;
      
      // Experience level match
      if (experienceLevel && profile.experienceLevel === experienceLevel) {
        matchScore += 15;
      }
      
      // Job type / availability match
      if (jobType && profile.availability === jobType) {
        matchScore += 10;
      }
      
      // Location match
      if (location && profile.location && profile.location.includes(location)) {
        matchScore += 10;
      }
      
      // Adjust for rating (0-5 stars)
      if (profile.rating > 0) {
        matchScore += Math.min(profile.rating * 4, 20); // Up to 20 points for 5-star rating
      }
      
      // Cap at 100
      matchScore = Math.min(matchScore, 100);
      
      return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        profilePicture: worker.profilePicture,
        skills: workerSkills,
        skillsMatch: {
          requested: skills,
          matching: skillsOverlap,
          percentage: skillMatchPercentage
        },
        headline: profile.headline,
        hourlyRate: profile.hourlyRate,
        location: profile.location,
        isRemote: profile.isRemote,
        availability: profile.availability,
        experienceLevel: profile.experienceLevel,
        experienceYears: profile.experienceYears,
        rating: profile.rating,
        completedJobs: profile.completedJobs,
        matchScore: matchScore
      };
    });
    
    // Sort by match score
    workers.sort((a, b) => b.matchScore - a.matchScore);
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: workers
    });
  } catch (error) {
    logger.error(`Error in recommendWorkers: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate worker recommendations',
      error: error.message
    });
  }
}; 