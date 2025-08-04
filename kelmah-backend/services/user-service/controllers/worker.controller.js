/**
 * Worker Profile Controller
 * Handles all worker-related operations
 */

const { Op } = require('sequelize');
const { WorkerProfile, WorkerSkill, Portfolio, Skill, User } = require('../models');
const { validateInput, handleServiceError } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');

class WorkerController {
  /**
   * Get all workers with filtering and pagination
   */
  static async getAllWorkers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        location,
        skills,
        rating,
        availability,
        maxRate,
        verified,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isActive: true };
      const include = [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'isEmailVerified'],
          where: { isActive: true }
        },
        {
          model: WorkerSkill,
          as: 'skills',
          where: { isActive: true },
          required: false,
          include: [{
            model: Skill,
            as: 'skill',
            attributes: ['name', 'category']
          }]
        }
      ];

      // Apply filters
      if (location) {
        whereClause.location = { [Op.iLike]: `%${location}%` };
      }

      if (rating) {
        whereClause.rating = { [Op.gte]: parseFloat(rating) };
      }

      if (availability) {
        whereClause.availabilityStatus = availability;
      }

      if (maxRate) {
        whereClause.hourlyRate = { [Op.lte]: parseFloat(maxRate) };
      }

      if (verified === 'true') {
        whereClause.isVerified = true;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { bio: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } },
          { specializations: { [Op.contains]: [search.toLowerCase()] } }
        ];
      }

      // Skills filter
      if (skills) {
        const skillsArray = skills.split(',');
        include[1].where = {
          ...include[1].where,
          skillName: { [Op.in]: skillsArray }
        };
        include[1].required = true;
      }

      const { count, rows: workers } = await WorkerProfile.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset,
        order: [
          ['isVerified', 'DESC'],
          ['rating', 'DESC'],
          ['totalJobsCompleted', 'DESC'],
          ['updatedAt', 'DESC']
        ],
        distinct: true
      });

      // Format response data
      const formattedWorkers = workers.map(worker => ({
        id: worker.id,
        userId: worker.userId,
        name: `${worker.user.firstName} ${worker.user.lastName}`,
        bio: worker.bio,
        location: worker.location,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency,
        rating: worker.rating,
        totalReviews: worker.totalReviews,
        totalJobsCompleted: worker.totalJobsCompleted,
        availabilityStatus: worker.availabilityStatus,
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture,
        skills: worker.skills?.map(skill => ({
          name: skill.skillName,
          proficiency: skill.proficiencyLevel,
          certified: skill.isCertified
        })) || [],
        specializations: worker.specializations
      }));

      res.status(200).json({
        success: true,
        message: 'Workers retrieved successfully',
        data: {
          workers: formattedWorkers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          },
          filters: {
            location,
            skills,
            rating,
            availability,
            maxRate,
            verified
          }
        }
      });

    } catch (error) {
      console.error('Get workers error:', error);
      return handleServiceError(res, error, 'Failed to retrieve workers');
    }
  }

  /**
   * Get single worker profile
   */
  static async getWorkerById(req, res) {
    try {
      const { id } = req.params;

      const worker = await WorkerProfile.findOne({
        where: { 
          [Op.or]: [{ id }, { userId: id }],
          isActive: true 
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email', 'phone', 'isEmailVerified']
          },
          {
            model: WorkerSkill,
            as: 'skills',
            where: { isActive: true },
            required: false,
            include: [{
              model: Skill,
              as: 'skill',
              attributes: ['name', 'category', 'description']
            }]
          },
          {
            model: Portfolio,
            as: 'portfolioItems',
            where: { status: 'published', isActive: true },
            required: false,
            limit: 6,
            order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']]
          }
        ]
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          code: 'WORKER_NOT_FOUND'
        });
      }

      // Format detailed response
      const workerData = {
        id: worker.id,
        userId: worker.userId,
        name: `${worker.user.firstName} ${worker.user.lastName}`,
        email: worker.user.email,
        phone: worker.user.phone,
        bio: worker.bio,
        location: worker.location,
        coordinates: {
          latitude: worker.latitude,
          longitude: worker.longitude
        },
        serviceRadius: worker.serviceRadius,
        hourlyRate: {
          min: worker.hourlyRateMin || worker.hourlyRate,
          max: worker.hourlyRateMax || worker.hourlyRate,
          currency: worker.currency
        },
        availability: {
          status: worker.availabilityStatus,
          schedule: worker.availableHours
        },
        experience: {
          level: worker.experienceLevel,
          years: worker.yearsOfExperience
        },
        statistics: {
          rating: worker.rating,
          totalReviews: worker.totalReviews,
          totalJobsCompleted: worker.totalJobsCompleted,
          completionRate: worker.getCompletionRate(),
          responseRate: worker.getResponseRate()
        },
        verification: {
          isVerified: worker.isVerified,
          level: worker.verificationLevel,
          verifiedAt: worker.verifiedAt
        },
        profile: {
          picture: worker.profilePicture,
          coverPhoto: worker.coverPhoto,
          website: worker.website,
          socialMedia: worker.socialMedia
        },
        skills: worker.skills?.map(skill => ({
          id: skill.id,
          name: skill.skillName,
          proficiency: skill.proficiencyLevel,
          yearsOfExperience: skill.yearsOfExperience,
          isCertified: skill.isCertified,
          certification: skill.isCertified ? {
            name: skill.certificationName,
            issuer: skill.certificationIssuer,
            date: skill.certificationDate
          } : null,
          category: skill.skill?.category
        })) || [],
        portfolio: worker.portfolioItems?.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          mainImage: item.getMainImageUrl(),
          projectValue: item.projectValue,
          duration: item.getDurationText(),
          skillsUsed: item.getSkillsUsed(),
          clientRating: item.clientRating
        })) || [],
        specializations: worker.specializations,
        languages: worker.languages,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Worker profile retrieved successfully',
        data: { worker: workerData }
      });

    } catch (error) {
      console.error('Get worker error:', error);
      return handleServiceError(res, error, 'Failed to retrieve worker profile');
    }
  }

  /**
   * Create or update worker profile
   */
  static async createOrUpdateProfile(req, res) {
    try {
      const userId = req.user?.id || req.params.userId;
      const profileData = req.body;

      // Validate required fields
      const validation = validateInput(profileData, [
        'bio', 'location', 'hourlyRate'
      ]);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Check if profile exists
      let worker = await WorkerProfile.findOne({
        where: { userId }
      });

      if (worker) {
        // Update existing profile
        await worker.update({
          bio: profileData.bio,
          hourlyRate: profileData.hourlyRate,
          hourlyRateMin: profileData.hourlyRateMin,
          hourlyRateMax: profileData.hourlyRateMax,
          currency: profileData.currency || 'GHS',
          location: profileData.location,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          serviceRadius: profileData.serviceRadius,
          availabilityStatus: profileData.availabilityStatus,
          availableHours: profileData.availableHours,
          experienceLevel: profileData.experienceLevel,
          yearsOfExperience: profileData.yearsOfExperience,
          specializations: profileData.specializations,
          languages: profileData.languages,
          website: profileData.website,
          socialMedia: profileData.socialMedia,
          emergencyContact: profileData.emergencyContact,
          preferences: profileData.preferences
        });

        await auditLogger.log({
          userId,
          action: 'WORKER_PROFILE_UPDATED',
          details: { profileId: worker.id }
        });

        res.status(200).json({
          success: true,
          message: 'Worker profile updated successfully',
          data: { worker }
        });

      } else {
        // Create new profile
        worker = await WorkerProfile.create({
          userId,
          ...profileData,
          currency: profileData.currency || 'GHS'
        });

        await auditLogger.log({
          userId,
          action: 'WORKER_PROFILE_CREATED',
          details: { profileId: worker.id }
        });

        res.status(201).json({
          success: true,
          message: 'Worker profile created successfully',
          data: { worker }
        });
      }

    } catch (error) {
      console.error('Create/Update worker profile error:', error);
      return handleServiceError(res, error, 'Failed to save worker profile');
    }
  }

  /**
   * Update worker availability
   */
  static async updateAvailability(req, res) {
    try {
      const { id } = req.params;
      const { availabilityStatus, availableHours, pausedUntil } = req.body;

      const worker = await WorkerProfile.findOne({
        where: { 
          [Op.or]: [{ id }, { userId: id }],
          isActive: true 
        }
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      await worker.update({
        availabilityStatus,
        availableHours,
        pausedUntil
      });

      res.status(200).json({
        success: true,
        message: 'Availability updated successfully',
        data: {
          availabilityStatus: worker.availabilityStatus,
          availableHours: worker.availableHours,
          pausedUntil: worker.pausedUntil
        }
      });

    } catch (error) {
      console.error('Update availability error:', error);
      return handleServiceError(res, error, 'Failed to update availability');
    }
  }

  /**
   * Add skill to worker profile
   */
  static async addSkill(req, res) {
    try {
      const { id } = req.params;
      const { skillName, proficiencyLevel, yearsOfExperience, isCertified } = req.body;

      const worker = await WorkerProfile.findOne({
        where: { 
          [Op.or]: [{ id }, { userId: id }],
          isActive: true 
        }
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      // Check if skill already exists
      const existingSkill = await WorkerSkill.findOne({
        where: {
          workerProfileId: worker.id,
          skillName: { [Op.iLike]: skillName }
        }
      });

      if (existingSkill) {
        return res.status(409).json({
          success: false,
          message: 'Skill already exists for this worker'
        });
      }

      const skill = await WorkerSkill.create({
        workerProfileId: worker.id,
        skillName,
        proficiencyLevel,
        yearsOfExperience,
        isCertified
      });

      res.status(201).json({
        success: true,
        message: 'Skill added successfully',
        data: { skill }
      });

    } catch (error) {
      console.error('Add skill error:', error);
      return handleServiceError(res, error, 'Failed to add skill');
    }
  }

  /**
   * Search workers with advanced filtering
   */
  static async searchWorkers(req, res) {
    try {
      const {
        query = '',
        location,
        skills,
        minRating = 0,
        maxRate,
        availability = 'available',
        radius = 50,
        latitude,
        longitude,
        page = 1,
        limit = 20,
        sortBy = 'relevance'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { 
        isActive: true,
        availabilityStatus: availability 
      };

      // Text search
      if (query) {
        whereClause[Op.or] = [
          { bio: { [Op.iLike]: `%${query}%` } },
          { location: { [Op.iLike]: `%${query}%` } },
          { specializations: { [Op.contains]: [query.toLowerCase()] } }
        ];
      }

      // Location search
      if (location) {
        whereClause.location = { [Op.iLike]: `%${location}%` };
      }

      // Rating filter
      if (minRating > 0) {
        whereClause.rating = { [Op.gte]: parseFloat(minRating) };
      }

      // Rate filter
      if (maxRate) {
        whereClause.hourlyRate = { [Op.lte]: parseFloat(maxRate) };
      }

      // Geographic search
      if (latitude && longitude && radius) {
        // Implement geographic search with PostGIS or similar
        // For now, basic implementation
        whereClause.latitude = {
          [Op.between]: [
            parseFloat(latitude) - (radius / 111),
            parseFloat(latitude) + (radius / 111)
          ]
        };
        whereClause.longitude = {
          [Op.between]: [
            parseFloat(longitude) - (radius / 111),
            parseFloat(longitude) + (radius / 111)
          ]
        };
      }

      // Sort options
      let orderClause;
      switch (sortBy) {
        case 'rating':
          orderClause = [['rating', 'DESC'], ['totalReviews', 'DESC']];
          break;
        case 'price_low':
          orderClause = [['hourlyRate', 'ASC']];
          break;
        case 'price_high':
          orderClause = [['hourlyRate', 'DESC']];
          break;
        case 'experience':
          orderClause = [['totalJobsCompleted', 'DESC'], ['yearsOfExperience', 'DESC']];
          break;
        default: // relevance
          orderClause = [
            ['isVerified', 'DESC'],
            ['rating', 'DESC'],
            ['totalJobsCompleted', 'DESC']
          ];
      }

      const { count, rows: workers } = await WorkerProfile.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'isEmailVerified']
          },
          {
            model: WorkerSkill,
            as: 'skills',
            where: skills ? {
              skillName: { [Op.in]: skills.split(',') },
              isActive: true
            } : { isActive: true },
            required: !!skills,
            include: [{
              model: Skill,
              as: 'skill',
              attributes: ['name', 'category']
            }]
          }
        ],
        limit: parseInt(limit),
        offset,
        order: orderClause,
        distinct: true
      });

      const searchResults = workers.map(worker => ({
        id: worker.id,
        name: `${worker.user.firstName} ${worker.user.lastName}`,
        bio: worker.bio?.substring(0, 150) + '...',
        location: worker.location,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency,
        rating: worker.rating,
        totalReviews: worker.totalReviews,
        totalJobsCompleted: worker.totalJobsCompleted,
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture,
        skills: worker.skills?.slice(0, 5).map(skill => skill.skillName) || [],
        distance: latitude && longitude && worker.latitude && worker.longitude ?
          calculateDistance(latitude, longitude, worker.latitude, worker.longitude) : null
      }));

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          workers: searchResults,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          },
          searchParams: {
            query,
            location,
            skills,
            minRating,
            maxRate,
            radius
          }
        }
      });

    } catch (error) {
      console.error('Search workers error:', error);
      return handleServiceError(res, error, 'Search failed');
    }
  }
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

module.exports = WorkerController;