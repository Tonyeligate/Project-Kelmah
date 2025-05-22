const { Op, fn, col, literal, where } = require('sequelize');
const sequelize = require('../config/database');
const Worker = require('../models/worker.model');
const User = require('../models/user.model');
const Job = require('../models/job.model');
const Skill = require('../models/skill.model');
const WorkerSkill = require('../models/workerSkill.model');
const Review = require('../models/review.model');
const WorkerLocation = require('../models/workerLocation.model');
const JobLocation = require('../models/jobLocation.model');
const NodeCache = require('node-cache');
const { calculateDistance } = require('../utils/geolocation');

// Cache for search results - 30 minute TTL
const searchCache = new NodeCache({ stdTTL: 1800 });

// Cache for popular search terms - 24 hour TTL
const searchTermCache = new NodeCache({ stdTTL: 86400 });

// Helper to update popular search terms
const updateSearchTermStats = (searchQuery) => {
  // Clean and normalize the search term
  const normalizedTerm = searchQuery.toLowerCase().trim();
  
  // Ignore very short terms
  if (normalizedTerm.length < 3) return;
  
  // Get current count or initialize to 0
  const currentCount = searchTermCache.get(normalizedTerm) || 0;
  searchTermCache.set(normalizedTerm, currentCount + 1);
};

// Get cache key for a search query
const getCacheKey = (params) => {
  return JSON.stringify(params);
};

const searchService = {
  /**
   * Search for workers with advanced filtering
   */
  searchWorkers: async (params) => {
    try {
      // Generate cache key from the search parameters
      const cacheKey = getCacheKey(params);
      
      // Check if we have cached results
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        console.log('Returning cached search results');
        return cachedResults;
      }
      
      // Track search term for analytics if keyword provided
      if (params.keyword) {
        updateSearchTermStats(params.keyword);
      }
      
      // Default values
      const {
        keyword = '',
        skills = [],
        minRating = 0,
        maxRating = 5,
        availability = null,
        sortBy = 'rating',
        sortDirection = 'DESC',
        priceRange = null,
        location = null,
        distance = null,
        categories = [],
        jobType = null,
        page = 1,
        limit = 20
      } = params;
      
      // Build where clause for the query
      const whereClause = {};
      const userWhereClause = {};
      const workerSkillWhereClause = {};
      const reviewWhereClause = {};
      
      // Keyword search in name, bio, or skills
      if (keyword) {
        userWhereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${keyword}%` } },
          { lastName: { [Op.iLike]: `%${keyword}%` } }
        ];
        
        whereClause[Op.or] = [
          { bio: { [Op.iLike]: `%${keyword}%` } },
          { headline: { [Op.iLike]: `%${keyword}%` } }
        ];
      }
      
      // Filter by skills
      if (skills && skills.length > 0) {
        workerSkillWhereClause.skillId = { [Op.in]: skills };
      }
      
      // Filter by categories
      if (categories && categories.length > 0) {
        whereClause.categories = { [Op.overlap]: categories };
      }
      
      // Filter by job type
      if (jobType) {
        whereClause.jobTypes = { [Op.contains]: [jobType] };
      }
      
      // Filter by availability
      if (availability) {
        whereClause.availability = { [Op.contains]: [availability] };
      }
      
      // Filter by price range
      if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
        whereClause.hourlyRate = {
          [Op.between]: [priceRange.min, priceRange.max]
        };
      }
      
      // Pagination
      const offset = (page - 1) * limit;
      
      // Define the order based on sortBy and sortDirection
      let order = [];
      if (sortBy === 'rating') {
        order.push(['avgRating', sortDirection]);
      } else if (sortBy === 'hourlyRate') {
        order.push(['hourlyRate', sortDirection]);
      } else if (sortBy === 'name') {
        order.push([{ model: User, as: 'user' }, 'firstName', sortDirection]);
      } else if (sortBy === 'distance' && location) {
        // Sorting by distance is handled after fetching results
        order.push(['id', 'ASC']); // default ordering
      } else {
        order.push(['createdAt', sortDirection]);
      }
      
      // Base query
      const baseQuery = {
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhereClause,
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          },
          {
            model: WorkerSkill,
            as: 'workerSkills',
            where: Object.keys(workerSkillWhereClause).length > 0 ? workerSkillWhereClause : undefined,
            include: [
              {
                model: Skill,
                as: 'skill'
              }
            ],
            required: Object.keys(workerSkillWhereClause).length > 0
          },
          {
            model: Review,
            as: 'reviews',
            where: reviewWhereClause,
            required: false
          }
        ],
        distinct: true,
        order
      };
      
      // If location-based search is requested
      let workersWithDistance = [];
      if (location && location.latitude && location.longitude) {
        // Add location include
        baseQuery.include.push({
          model: WorkerLocation,
          as: 'locations',
          required: true
        });
        
        // First, get all workers that match other criteria
        const workersResult = await Worker.findAll(baseQuery);
        
        // Then calculate distance for each worker
        for (const worker of workersResult) {
          // Calculate minimum distance from any of worker's locations
          let minDistance = Infinity;
          for (const workerLocation of worker.locations) {
            const calculatedDistance = calculateDistance(
              location.latitude,
              location.longitude,
              workerLocation.latitude,
              workerLocation.longitude
            );
            minDistance = Math.min(minDistance, calculatedDistance);
          }
          
          // Add worker to results if within distance (or if no distance filter)
          if (!distance || minDistance <= distance) {
            workersWithDistance.push({
              ...worker.toJSON(),
              distance: minDistance
            });
          }
        }
        
        // Sort by distance if requested
        if (sortBy === 'distance') {
          workersWithDistance.sort((a, b) => {
            return sortDirection === 'ASC' ? a.distance - b.distance : b.distance - a.distance;
          });
        }
        
        // Apply pagination manually
        workersWithDistance = workersWithDistance.slice(offset, offset + limit);
      } else {
        // Regular search without location
        baseQuery.limit = limit;
        baseQuery.offset = offset;
        
        // Execute query
        const { count, rows } = await Worker.findAndCountAll(baseQuery);
        workersWithDistance = rows.map(worker => ({
          ...worker.toJSON(),
          distance: null
        }));
      }
      
      // Format the final result
      const result = {
        workers: workersWithDistance.map(worker => ({
          id: worker.id,
          user: {
            id: worker.user.id,
            firstName: worker.user.firstName,
            lastName: worker.user.lastName,
            avatar: worker.user.avatar
          },
          headline: worker.headline,
          bio: worker.bio,
          avgRating: worker.avgRating,
          hourlyRate: worker.hourlyRate,
          categories: worker.categories,
          skills: worker.workerSkills.map(ws => ({
            id: ws.skill.id,
            name: ws.skill.name,
            proficiency: ws.proficiency
          })),
          reviewCount: worker.reviews ? worker.reviews.length : 0,
          distance: worker.distance
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: workersWithDistance.length, // This will be inaccurate for location-based searches
          totalPages: Math.ceil(workersWithDistance.length / limit) // This will be inaccurate for location-based searches
        }
      };
      
      // Cache the results
      searchCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error in searchWorkers:', error);
      throw error;
    }
  },
  
  /**
   * Search for jobs with advanced filtering
   */
  searchJobs: async (params) => {
    try {
      // Generate cache key from the search parameters
      const cacheKey = getCacheKey(params);
      
      // Check if we have cached results
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        console.log('Returning cached search results');
        return cachedResults;
      }
      
      // Track search term for analytics if keyword provided
      if (params.keyword) {
        updateSearchTermStats(params.keyword);
      }
      
      // Default values
      const {
        keyword = '',
        skills = [],
        categories = [],
        jobType = null,
        budgetMin = null,
        budgetMax = null,
        location = null,
        distance = null,
        sortBy = 'createdAt',
        sortDirection = 'DESC',
        page = 1,
        limit = 20
      } = params;
      
      // Build where clause for the query
      const whereClause = {
        status: 'open' // Only return open jobs by default
      };
      
      // Keyword search in title or description
      if (keyword) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { description: { [Op.iLike]: `%${keyword}%` } }
        ];
      }
      
      // Filter by skills
      if (skills && skills.length > 0) {
        whereClause.requiredSkills = { [Op.overlap]: skills };
      }
      
      // Filter by categories
      if (categories && categories.length > 0) {
        whereClause.category = { [Op.in]: categories };
      }
      
      // Filter by job type
      if (jobType) {
        whereClause.jobType = jobType;
      }
      
      // Filter by budget range
      if (budgetMin !== null && budgetMax !== null) {
        whereClause.budget = {
          [Op.between]: [budgetMin, budgetMax]
        };
      } else if (budgetMin !== null) {
        whereClause.budget = { [Op.gte]: budgetMin };
      } else if (budgetMax !== null) {
        whereClause.budget = { [Op.lte]: budgetMax };
      }
      
      // Pagination
      const offset = (page - 1) * limit;
      
      // Define the order based on sortBy and sortDirection
      let order = [];
      if (sortBy === 'budget') {
        order.push(['budget', sortDirection]);
      } else if (sortBy === 'deadline') {
        order.push(['deadline', sortDirection]);
      } else {
        order.push(['createdAt', sortDirection]);
      }
      
      // Base query
      const baseQuery = {
        where: whereClause,
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order,
        limit,
        offset
      };
      
      // If location-based search is requested
      let jobsWithDistance = [];
      if (location && location.latitude && location.longitude) {
        // Add location include
        baseQuery.include.push({
          model: JobLocation,
          as: 'location',
          required: true
        });
        
        // Remove limit and offset temporarily
        delete baseQuery.limit;
        delete baseQuery.offset;
        
        // First, get all jobs that match other criteria
        const jobsResult = await Job.findAll(baseQuery);
        
        // Then calculate distance for each job
        for (const job of jobsResult) {
          if (job.location) {
            const calculatedDistance = calculateDistance(
              location.latitude,
              location.longitude,
              job.location.latitude,
              job.location.longitude
            );
            
            // Add job to results if within distance (or if no distance filter)
            if (!distance || calculatedDistance <= distance) {
              jobsWithDistance.push({
                ...job.toJSON(),
                distance: calculatedDistance
              });
            }
          }
        }
        
        // Sort by distance if requested
        if (sortBy === 'distance') {
          jobsWithDistance.sort((a, b) => {
            return sortDirection === 'ASC' ? a.distance - b.distance : b.distance - a.distance;
          });
        }
        
        // Get total count for pagination
        const totalCount = jobsWithDistance.length;
        
        // Apply pagination manually
        jobsWithDistance = jobsWithDistance.slice(offset, offset + limit);
        
        // Format the result
        const result = {
          jobs: jobsWithDistance.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            budget: job.budget,
            jobType: job.jobType,
            category: job.category,
            deadline: job.deadline,
            requiredSkills: job.requiredSkills,
            client: {
              id: job.client.id,
              firstName: job.client.firstName,
              lastName: job.client.lastName,
              avatar: job.client.avatar
            },
            location: job.location ? {
              city: job.location.city,
              country: job.location.country
            } : null,
            distance: job.distance,
            createdAt: job.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        };
        
        // Cache the results
        searchCache.set(cacheKey, result);
        
        return result;
      } else {
        // Regular search without location
        const { count, rows } = await Job.findAndCountAll(baseQuery);
        
        // Format the result
        const result = {
          jobs: rows.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            budget: job.budget,
            jobType: job.jobType,
            category: job.category,
            deadline: job.deadline,
            requiredSkills: job.requiredSkills,
            client: {
              id: job.client.id,
              firstName: job.client.firstName,
              lastName: job.client.lastName,
              avatar: job.client.avatar
            },
            location: job.location ? {
              city: job.location.city,
              country: job.location.country
            } : null,
            distance: null,
            createdAt: job.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        };
        
        // Cache the results
        searchCache.set(cacheKey, result);
        
        return result;
      }
    } catch (error) {
      console.error('Error in searchJobs:', error);
      throw error;
    }
  },
  
  /**
   * Get job recommendations for a worker based on skills and location
   */
  getJobRecommendations: async (workerId, limit = 10) => {
    try {
      // Get worker details including skills
      const worker = await Worker.findByPk(workerId, {
        include: [
          {
            model: WorkerSkill,
            as: 'workerSkills',
            include: [
              {
                model: Skill,
                as: 'skill'
              }
            ]
          },
          {
            model: WorkerLocation,
            as: 'locations'
          }
        ]
      });
      
      if (!worker) {
        throw new Error('Worker not found');
      }
      
      // Extract worker skills
      const workerSkills = worker.workerSkills.map(ws => ws.skill.id);
      
      // Get worker categories
      const workerCategories = worker.categories || [];
      
      // Get worker primary location (if any)
      const primaryLocation = worker.locations && worker.locations.length > 0 
        ? worker.locations.find(loc => loc.isPrimary) || worker.locations[0]
        : null;
      
      // Base query for open jobs
      const baseQuery = {
        where: {
          status: 'open'
        },
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [
          ['createdAt', 'DESC']
        ],
        limit
      };
      
      // If worker has skills, prioritize jobs that require those skills
      if (workerSkills.length > 0) {
        baseQuery.where[Op.and] = [
          // Using raw query for array overlap
          sequelize.literal(`"Job"."required_skills" && ARRAY[${workerSkills.join(',')}]::uuid[]`)
        ];
      }
      
      // If worker has categories, include jobs in those categories
      if (workerCategories.length > 0) {
        if (!baseQuery.where[Op.and]) {
          baseQuery.where[Op.and] = [];
        }
        
        baseQuery.where[Op.and].push({
          category: { [Op.in]: workerCategories }
        });
      }
      
      // If worker has location, include location-based results
      if (primaryLocation) {
        baseQuery.include.push({
          model: JobLocation,
          as: 'location'
        });
      }
      
      // Get recommended jobs
      const jobResults = await Job.findAll(baseQuery);
      
      // Calculate skill match and distance score for ranking
      let jobsWithScore = [];
      
      for (const job of jobResults) {
        let score = 0;
        
        // Skill match score - 60% weight
        if (job.requiredSkills && workerSkills.length > 0) {
          const matchingSkills = job.requiredSkills.filter(skill => 
            workerSkills.includes(skill)
          );
          const skillMatchPercent = matchingSkills.length / job.requiredSkills.length;
          score += skillMatchPercent * 60;
        }
        
        // Category match - 20% weight
        if (job.category && workerCategories.includes(job.category)) {
          score += 20;
        }
        
        // Distance score - 20% weight (closer = higher score)
        let distance = null;
        if (primaryLocation && job.location) {
          distance = calculateDistance(
            primaryLocation.latitude,
            primaryLocation.longitude,
            job.location.latitude,
            job.location.longitude
          );
          
          // Max distance considered is 100km, giving lower scores as distance increases
          const distanceScore = Math.max(0, 20 - (distance / 5));
          score += distanceScore;
        }
        
        jobsWithScore.push({
          ...job.toJSON(),
          score,
          distance
        });
      }
      
      // Sort by score descending
      jobsWithScore.sort((a, b) => b.score - a.score);
      
      // Format the result
      return {
        recommendations: jobsWithScore.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          jobType: job.jobType,
          category: job.category,
          deadline: job.deadline,
          requiredSkills: job.requiredSkills,
          client: {
            id: job.client.id,
            firstName: job.client.firstName,
            lastName: job.client.lastName,
            avatar: job.client.avatar
          },
          location: job.location ? {
            city: job.location.city,
            country: job.location.country
          } : null,
          distance: job.distance,
          matchScore: Math.round(job.score),
          createdAt: job.createdAt
        }))
      };
    } catch (error) {
      console.error('Error in getJobRecommendations:', error);
      throw error;
    }
  },
  
  /**
   * Get worker recommendations for a job based on skills and location match
   */
  getWorkerRecommendations: async (jobId, limit = 10) => {
    try {
      // Get job details
      const job = await Job.findByPk(jobId, {
        include: [
          {
            model: JobLocation,
            as: 'location'
          }
        ]
      });
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      // Base query for workers
      const baseQuery = {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          },
          {
            model: WorkerSkill,
            as: 'workerSkills',
            include: [
              {
                model: Skill,
                as: 'skill'
              }
            ]
          },
          {
            model: Review,
            as: 'reviews',
            required: false
          },
          {
            model: WorkerLocation,
            as: 'locations',
            required: false
          }
        ],
        order: [
          ['avgRating', 'DESC']
        ],
        limit
      };
      
      // If job has specific category
      if (job.category) {
        baseQuery.where = {
          categories: { [Op.contains]: [job.category] }
        };
      }
      
      // Get workers
      const workerResults = await Worker.findAll(baseQuery);
      
      // Calculate match score based on skills, location, rating
      let workersWithScore = [];
      
      for (const worker of workerResults) {
        let score = 0;
        
        // Skill match score - 50% weight
        if (job.requiredSkills && job.requiredSkills.length > 0) {
          const workerSkillIds = worker.workerSkills.map(ws => ws.skill.id);
          const matchingSkills = job.requiredSkills.filter(skill => 
            workerSkillIds.includes(skill)
          );
          
          const skillMatchPercent = job.requiredSkills.length > 0 
            ? matchingSkills.length / job.requiredSkills.length 
            : 0;
          
          score += skillMatchPercent * 50;
          
          // Bonus for workers with all required skills
          if (skillMatchPercent === 1) {
            score += 10;
          }
        }
        
        // Location score - 20% weight
        let distance = null;
        if (job.location && worker.locations && worker.locations.length > 0) {
          // Find minimum distance from any worker location
          let minDistance = Infinity;
          for (const workerLocation of worker.locations) {
            const calculatedDistance = calculateDistance(
              job.location.latitude,
              job.location.longitude,
              workerLocation.latitude,
              workerLocation.longitude
            );
            minDistance = Math.min(minDistance, calculatedDistance);
          }
          
          distance = minDistance;
          
          // Max distance considered is 100km, giving lower scores as distance increases
          const distanceScore = Math.max(0, 20 - (distance / 5));
          score += distanceScore;
        }
        
        // Rating score - 20% weight
        if (worker.avgRating) {
          // Convert 0-5 rating to 0-20 score
          const ratingScore = worker.avgRating * 4;
          score += ratingScore;
        }
        
        // Category match - 10% weight
        if (job.category && worker.categories && worker.categories.includes(job.category)) {
          score += 10;
        }
        
        workersWithScore.push({
          ...worker.toJSON(),
          score,
          distance
        });
      }
      
      // Sort by score descending
      workersWithScore.sort((a, b) => b.score - a.score);
      
      // Format the result
      return {
        recommendations: workersWithScore.map(worker => ({
          id: worker.id,
          user: {
            id: worker.user.id,
            firstName: worker.user.firstName,
            lastName: worker.user.lastName,
            avatar: worker.user.avatar
          },
          headline: worker.headline,
          bio: worker.bio,
          avgRating: worker.avgRating,
          hourlyRate: worker.hourlyRate,
          categories: worker.categories,
          skills: worker.workerSkills.map(ws => ({
            id: ws.skill.id,
            name: ws.skill.name,
            proficiency: ws.proficiency
          })),
          reviewCount: worker.reviews ? worker.reviews.length : 0,
          distance: worker.distance,
          matchScore: Math.round(worker.score)
        }))
      };
    } catch (error) {
      console.error('Error in getWorkerRecommendations:', error);
      throw error;
    }
  },
  
  /**
   * Save a search for future reference and notifications
   */
  saveSearch: async (userId, searchName, searchType, searchParams) => {
    try {
      const savedSearch = await SavedSearch.create({
        userId,
        name: searchName,
        type: searchType,
        parameters: searchParams,
        notificationsEnabled: false
      });
      
      return savedSearch;
    } catch (error) {
      console.error('Error in saveSearch:', error);
      throw error;
    }
  },
  
  /**
   * Get popular search terms (analytics)
   */
  getPopularSearchTerms: async (limit = 10) => {
    try {
      // Get all keys from cache
      const keys = searchTermCache.keys();
      
      // Convert to array of objects with count
      const terms = keys.map(key => ({
        term: key,
        count: searchTermCache.get(key)
      }));
      
      // Sort by count (descending)
      terms.sort((a, b) => b.count - a.count);
      
      // Return top N results
      return {
        popularTerms: terms.slice(0, limit)
      };
    } catch (error) {
      console.error('Error in getPopularSearchTerms:', error);
      throw error;
    }
  },
  
  /**
   * Clear cache for specific key or all keys
   */
  clearCache: async (cacheKey = null) => {
    if (cacheKey) {
      searchCache.del(cacheKey);
    } else {
      searchCache.flushAll();
    }
    
    return { success: true };
  }
};

module.exports = searchService; 