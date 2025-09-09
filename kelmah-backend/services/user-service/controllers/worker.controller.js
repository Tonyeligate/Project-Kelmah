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
   * Get all workers with filtering and pagination - FIXED to use MongoDB
   */
  static async getAllWorkers(req, res) {
    try {
      console.log('🔍 getAllWorkers called - URL:', req.originalUrl, 'Path:', req.path);
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
      
      // ✅ FIXED: Use MongoDB User model instead of PostgreSQL WorkerProfile
      const MongoUser = require('../models/User');
      
      // Build MongoDB query
      const mongoQuery = {
        role: 'worker',
        isActive: true
      };

      // Apply filters
      if (location) {
        mongoQuery.location = { $regex: location, $options: 'i' };
      }

      if (rating) {
        mongoQuery.rating = { $gte: parseFloat(rating) };
      }

      if (availability) {
        mongoQuery.availabilityStatus = availability;
      }

      if (maxRate) {
        mongoQuery.hourlyRate = { $lte: parseFloat(maxRate) };
      }

      if (verified === 'true') {
        mongoQuery.isVerified = true;
      }

      // Search functionality
      if (search) {
        mongoQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { profession: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } }
        ];
      }

      // Skills filter
      if (skills) {
        const skillsArray = skills.split(',');
        mongoQuery.skills = { $in: skillsArray };
      }

      // Execute MongoDB query
      const [workers, totalCount] = await Promise.all([
        MongoUser.find(mongoQuery)
          .sort({ updatedAt: -1 })
          .skip(offset)
          .limit(parseInt(limit))
          .lean(),
        MongoUser.countDocuments(mongoQuery)
      ]);

      // Ranking weights from env or defaults
      const weights = {
        verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
        rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
        jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
      };
      const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
      const scoreFor = (w) => {
        const ratingNorm = clamp01((Number(w.rating || 0)) / 5);
        const jobsNorm = clamp01(Math.log10(1 + Number(w.totalJobsCompleted || 0)) / 3);
        const verifiedBonus = w.isVerified ? 1 : 0;
        return (
          weights.rating * ratingNorm +
          weights.jobsCompleted * jobsNorm +
          weights.verified * verifiedBonus
        );
      };

      // Auto-populate missing worker fields for existing users
      const workersWithDefaults = await Promise.all(workers.map(async (worker) => {
        let updateNeeded = false;
        const updates = {};
        
        // Set default values for missing fields
        if (!worker.profession) { updates.profession = 'General Worker'; updateNeeded = true; }
        if (!worker.skills || worker.skills.length === 0) { updates.skills = ['General Work']; updateNeeded = true; }
        if (!worker.hourlyRate) { updates.hourlyRate = 25; updateNeeded = true; }
        if (!worker.currency) { updates.currency = 'GHS'; updateNeeded = true; }
        if (worker.rating === undefined) { updates.rating = 4.5; updateNeeded = true; }
        if (!worker.totalReviews) { updates.totalReviews = 0; updateNeeded = true; }
        if (!worker.totalJobsCompleted) { updates.totalJobsCompleted = 0; updateNeeded = true; }
        if (!worker.availabilityStatus) { updates.availabilityStatus = 'available'; updateNeeded = true; }
        if (worker.isVerified === undefined) { updates.isVerified = false; updateNeeded = true; }
        if (!worker.yearsOfExperience) { updates.yearsOfExperience = 1; updateNeeded = true; }
        if (!worker.location) { updates.location = 'Ghana'; updateNeeded = true; }
        if (!worker.specializations || worker.specializations.length === 0) { updates.specializations = ['General Work']; updateNeeded = true; }
        if (!worker.bio) { updates.bio = `${updates.profession || worker.profession || 'Professional Worker'} with ${updates.yearsOfExperience || worker.yearsOfExperience || 1} years of experience.`; updateNeeded = true; }
        
        // Update worker in database if needed
        if (updateNeeded) {
          try {
            await MongoUser.findByIdAndUpdate(worker._id, updates);
            return { ...worker, ...updates };
          } catch (err) {
            console.warn('Failed to update worker defaults:', err.message);
            return { ...worker, ...updates };
          }
        }
        
        return worker;
      }));

      // Format response data with ranking score
      const formattedWorkers = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        userId: worker._id.toString(),
        name: `${worker.firstName} ${worker.lastName}`,
        bio: worker.bio,
        location: worker.location,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency,
        rating: worker.rating,
        totalReviews: worker.totalReviews,
        totalJobsCompleted: worker.totalJobsCompleted,
        availabilityStatus: worker.availabilityStatus,
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture || null,
        skills: worker.skills?.map(skill => ({
          name: skill,
          proficiency: 'Intermediate',
          certified: false
        })) || [{ name: worker.profession || 'General Work', proficiency: 'Intermediate', certified: false }],
        specializations: worker.specializations,
        title: worker.profession,
        experience: `${worker.yearsOfExperience} years`
      })).map((w) => ({ ...w, rankScore: scoreFor(w) }));

      // Sort by computed rankScore desc
      formattedWorkers.sort((a, b) => b.rankScore - a.rankScore);

      res.status(200).json({
        success: true,
        message: 'Workers retrieved successfully',
        data: {
          workers: formattedWorkers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
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
   * Find nearby workers using geo search when available
   */
  static async getNearbyWorkers(req, res) {
    try {
      const { latitude, longitude, radiusKm = 50, limit = 50 } = req.body || {};
      if (!(latitude && longitude)) {
        return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
      }
      // Prefer Mongo users with 2dsphere, fallback to Sequelize WorkerProfile lat/lng range filter
      const results = [];
      try {
        const MongoUser = require('../models/User');
        const users = await MongoUser.find({
          role: 'worker',
          isActive: true,
          locationCoordinates: {
            $near: {
              $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
              $maxDistance: Number(radiusKm) * 1000,
            }
          }
        })
        .limit(Math.min(200, Number(limit)))
        .select('firstName lastName profilePicture locationCoordinates');
        results.push(...users.map(u => ({
          id: String(u._id),
          name: `${u.firstName} ${u.lastName}`,
          picture: u.profilePicture,
          coordinates: u.locationCoordinates?.coordinates || null,
          source: 'mongo'
        })));
      } catch (_) {
        // ignore
      }

      if (results.length < limit) {
        const { WorkerProfile } = require('../models');
        if (WorkerProfile) {
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);
          const delta = Number(radiusKm) / 111; // rough degrees per km
          const more = await WorkerProfile.findAll({
            where: {
              isActive: true,
              latitude: { [Op.between]: [lat - delta, lat + delta] },
              longitude: { [Op.between]: [lng - delta, lng + delta] },
            },
            limit: Math.max(0, Number(limit) - results.length),
          });
          results.push(...more.map(w => ({
            id: w.userId || w.id,
            name: undefined,
            picture: w.profilePicture,
            coordinates: [Number(w.longitude), Number(w.latitude)],
            source: 'sql'
          })));
        }
      }

      return res.json({ success: true, data: { workers: results.slice(0, Number(limit)) } });
    } catch (error) {
      console.error('Nearby workers error:', error);
      return handleServiceError(res, error, 'Failed to find nearby workers');
    }
  }

  /**
   * Get profile completion score and suggestions
   */
  static async getProfileCompleteness(req, res) {
    try {
      const { id } = req.params;
      const { WorkerProfile, WorkerSkill, Portfolio } = require('../models');
      const profile = await WorkerProfile.findOne({
        where: { userId: id },
        include: [
          { model: WorkerSkill, as: 'skills' },
          { model: Portfolio, as: 'portfolioItems' }
        ]
      });
      if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found' });
      const completion = profile.getProfileCompletionPercentage();
      const suggestions = [];
      if (!(profile.bio && profile.bio.length >= 50)) suggestions.push('Add a longer bio (50+ chars)');
      if (!(profile.hourlyRate > 0)) suggestions.push('Set your hourly rate');
      if (!profile.availabilityStatus) suggestions.push('Set your availability status');
      if (!profile.location) suggestions.push('Set your location');
      if (!profile.skills || profile.skills.length === 0) suggestions.push('Add at least one skill');
      if (!profile.portfolioItems || profile.portfolioItems.length === 0) suggestions.push('Add a portfolio item');
      return res.json({ success: true, data: { completion, suggestions } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to calculate profile completeness');
    }
  }

  /**
   * Get worker availability by worker id or user id
   */
  static async getAvailability(req, res) {
    try {
      const { id } = req.params;
      const worker = await WorkerProfile.findOne({
        where: {
          [Op.or]: [{ id }, { userId: id }],
          isActive: true,
        },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      return res.status(200).json({
        success: true,
        data: {
          availabilityStatus: worker.availabilityStatus,
          availableHours: worker.availableHours,
          pausedUntil: worker.pausedUntil,
        },
      });
    } catch (error) {
      console.error('Get availability error:', error);
      return handleServiceError(res, error, 'Failed to get availability');
    }
  }

  /**
   * List worker skills
   */
  static async getSkills(req, res) {
    try {
      const { id } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const skills = await WorkerSkill.findByWorker(worker.id);
      return res.status(200).json({ success: true, data: skills });
    } catch (error) {
      console.error('Get skills error:', error);
      return handleServiceError(res, error, 'Failed to get skills');
    }
  }

  /**
   * Update a worker skill
   */
  static async updateSkill(req, res) {
    try {
      const { id, skillId } = req.params;
      const updates = req.body || {};
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const skill = await WorkerSkill.findOne({
        where: { id: skillId, workerProfileId: worker.id, isActive: true },
      });
      if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }
      await skill.update({
        skillName: updates.skillName ?? skill.skillName,
        proficiencyLevel: updates.proficiencyLevel ?? skill.proficiencyLevel,
        yearsOfExperience: updates.yearsOfExperience ?? skill.yearsOfExperience,
        isCertified: updates.isCertified ?? skill.isCertified,
        certificationName: updates.certificationName ?? skill.certificationName,
        certificationIssuer: updates.certificationIssuer ?? skill.certificationIssuer,
        certificationDate: updates.certificationDate ?? skill.certificationDate,
        certificationExpiry: updates.certificationExpiry ?? skill.certificationExpiry,
        certificationUrl: updates.certificationUrl ?? skill.certificationUrl,
        isPrimary: updates.isPrimary ?? skill.isPrimary,
        availability: updates.availability ?? skill.availability,
        description: updates.description ?? skill.description,
        keywords: updates.keywords ?? skill.keywords,
        tags: updates.tags ?? skill.tags,
        hourlyRate: updates.hourlyRate ?? skill.hourlyRate,
      });
      return res.status(200).json({ success: true, data: { skill } });
    } catch (error) {
      console.error('Update skill error:', error);
      return handleServiceError(res, error, 'Failed to update skill');
    }
  }

  /**
   * Delete a worker skill
   */
  static async deleteSkill(req, res) {
    try {
      const { id, skillId } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const skill = await WorkerSkill.findOne({
        where: { id: skillId, workerProfileId: worker.id, isActive: true },
      });
      if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }
      await skill.update({ isActive: false });
      return res.status(200).json({ success: true, message: 'Skill deleted' });
    } catch (error) {
      console.error('Delete skill error:', error);
      return handleServiceError(res, error, 'Failed to delete skill');
    }
  }

  /**
   * Get worker stats summary
   */
  static async getStats(req, res) {
    try {
      const { workerId } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id: workerId }, { userId: workerId }], isActive: true },
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const stats = {
        jobsCompleted: worker.totalJobsCompleted,
        completionRate: worker.getCompletionRate(),
        rating: Number(worker.rating || 0),
        totalReviews: worker.totalReviews,
        totalEarnings: Number(worker.totalEarnings || 0),
        responseRate: worker.getResponseRate(),
      };
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error('Get stats error:', error);
      return handleServiceError(res, error, 'Failed to get stats');
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
      const userId = req.user?.id || req.params.userId || req.params.id;
      const body = req.body || {};

      // Accept JSON only here; file uploads must use presigned URLs (handled elsewhere)
      const coerceNumber = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
      const parseMaybeJson = (v) => {
        if (v === undefined || v === null) return undefined;
        if (typeof v === 'object') return v;
        try { return JSON.parse(v); } catch (_) { return undefined; }
      };

      const updates = {
        bio: body.bio,
        hourlyRate: coerceNumber(body.hourlyRate),
        hourlyRateMin: coerceNumber(body.hourlyRateMin),
        hourlyRateMax: coerceNumber(body.hourlyRateMax),
        currency: body.currency || 'GHS',
        location: body.location,
        latitude: coerceNumber(body.latitude),
        longitude: coerceNumber(body.longitude),
        serviceRadius: coerceNumber(body.serviceRadius),
        availabilityStatus: body.availabilityStatus,
        availableHours: parseMaybeJson(body.availableHours) || body.availableHours,
        experienceLevel: body.experienceLevel,
        yearsOfExperience: coerceNumber(body.yearsOfExperience ?? body.experience),
        specializations: parseMaybeJson(body.specializations) || body.specializations,
        languages: parseMaybeJson(body.languages) || body.languages,
        website: body.website,
        socialMedia: parseMaybeJson(body.socialMedia) || body.socialMedia,
        emergencyContact: parseMaybeJson(body.emergencyContact) || body.emergencyContact,
        preferences: parseMaybeJson(body.preferences) || body.preferences,
        metadata: parseMaybeJson(body.metadata) || body.metadata,
      };

      // Basic validation
      const validation = validateInput(
        { bio: updates.bio, location: updates.location, hourlyRate: updates.hourlyRate },
        ['bio', 'location', 'hourlyRate']
      );
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      }

      let worker = await WorkerProfile.findOne({ where: { userId } });
      if (worker) {
        await worker.update(updates);
        await auditLogger.log({ userId, action: 'WORKER_PROFILE_UPDATED', details: { profileId: worker.id } });
        return res.status(200).json({ success: true, message: 'Worker profile updated successfully', data: { worker } });
      }

      worker = await WorkerProfile.create({ userId, ...updates });
      await auditLogger.log({ userId, action: 'WORKER_PROFILE_CREATED', details: { profileId: worker.id } });
      return res.status(201).json({ success: true, message: 'Worker profile created successfully', data: { worker } });

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
      const { availabilityStatus, availableHours, pausedUntil } = req.body || {};

      // Validate status
      const allowedStatuses = ['available', 'busy', 'unavailable', 'vacation'];
      if (availabilityStatus && !allowedStatuses.includes(availabilityStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid availabilityStatus' });
      }

      // Validate schedule shape if provided
      const validateTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      if (availableHours) {
        if (typeof availableHours !== 'object') {
          return res.status(400).json({ success: false, message: 'availableHours must be an object' });
        }
        for (const day of days) {
          const d = availableHours[day];
          if (!d) continue; // allow partial updates
          if (typeof d.available !== 'boolean') {
            return res.status(400).json({ success: false, message: `availableHours.${day}.available must be boolean` });
          }
          if (d.available) {
            if (!validateTime(d.start) || !validateTime(d.end)) {
              return res.status(400).json({ success: false, message: `Invalid time for ${day} (HH:mm)` });
            }
          }
        }
      }

      // Normalize pausedUntil
      let pausedUntilDate = null;
      if (pausedUntil) {
        const dt = new Date(pausedUntil);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({ success: false, message: 'pausedUntil must be a valid date' });
        }
        pausedUntilDate = dt;
      }

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
        availabilityStatus: availabilityStatus ?? worker.availabilityStatus,
        availableHours: availableHours ?? worker.availableHours,
        pausedUntil: pausedUntilDate ?? worker.pausedUntil,
      });

      // Audit log for availability change
      try {
        await auditLogger.log({
          userId: worker.userId,
          action: 'WORKER_AVAILABILITY_UPDATED',
          details: {
            profileId: worker.id,
            availabilityStatus: worker.availabilityStatus,
            pausedUntil: worker.pausedUntil,
          }
        });
      } catch (e) {
        // Non-blocking: audit log failures should not disrupt flow
        console.warn('Audit log failed for availability update:', e?.message);
      }

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
      console.error('Update availability error:', { message: error.message });
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
   * Search workers with advanced filtering - FIXED to use MongoDB
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
      
      // ✅ FIXED: Use MongoDB User model instead of PostgreSQL WorkerProfile
      const MongoUser = require('../models/User');
      
      // Build MongoDB query
      const mongoQuery = {
        role: 'worker',
        isActive: true
      };

      // Text search
      if (query) {
        mongoQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { profession: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ];
      }

      // Location search
      if (location) {
        mongoQuery.$or = mongoQuery.$or || [];
        mongoQuery.$or.push({ location: { $regex: location, $options: 'i' } });
      }

      // Skills search
      if (skills) {
        const skillsArray = skills.split(',');
        mongoQuery.skills = { $in: skillsArray };
      }

      // Rating filter
      if (minRating > 0) {
        mongoQuery.rating = { $gte: parseFloat(minRating) };
      }

      // Rate filter
      if (maxRate) {
        mongoQuery.hourlyRate = { $lte: parseFloat(maxRate) };
      }

      // Geographic search
      if (latitude && longitude && radius) {
        mongoQuery.locationCoordinates = {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
            $maxDistance: Number(radius) * 1000
          }
        };
      }

      // Sort options
      let sortClause = {};
      switch (sortBy) {
        case 'rating':
          sortClause = { rating: -1, totalReviews: -1 };
          break;
        case 'price_low':
          sortClause = { hourlyRate: 1 };
          break;
        case 'price_high':
          sortClause = { hourlyRate: -1 };
          break;
        case 'experience':
          sortClause = { totalJobsCompleted: -1, yearsOfExperience: -1 };
          break;
        default: // relevance
          sortClause = { isVerified: -1, rating: -1, totalJobsCompleted: -1 };
      }

      // Execute MongoDB query
      const [workers, totalCount] = await Promise.all([
        MongoUser.find(mongoQuery)
          .sort(sortClause)
          .skip(offset)
          .limit(parseInt(limit))
          .lean(),
        MongoUser.countDocuments(mongoQuery)
      ]);

      // Calculate ranking scores
      const weights = {
        verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
        rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
        jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
      };
      const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
      const scoreFor = (w) => {
        const ratingNorm = clamp01((Number(w.rating || 0)) / 5);
        const jobsNorm = clamp01(Math.log10(1 + Number(w.totalJobsCompleted || 0)) / 3);
        const verifiedBonus = w.isVerified ? 1 : 0;
        return (
          weights.rating * ratingNorm +
          weights.jobsCompleted * jobsNorm +
          weights.verified * verifiedBonus
        );
      };

      // Auto-populate missing worker fields for search results
      const workersWithDefaults = await Promise.all(workers.map(async (worker) => {
        let updateNeeded = false;
        const updates = {};
        
        // Set default values for missing fields (same logic as getAllWorkers)
        if (!worker.profession) { updates.profession = 'General Worker'; updateNeeded = true; }
        if (!worker.skills || worker.skills.length === 0) { updates.skills = ['General Work']; updateNeeded = true; }
        if (!worker.hourlyRate) { updates.hourlyRate = 25; updateNeeded = true; }
        if (!worker.currency) { updates.currency = 'GHS'; updateNeeded = true; }
        if (worker.rating === undefined) { updates.rating = 4.5; updateNeeded = true; }
        if (!worker.totalReviews) { updates.totalReviews = 0; updateNeeded = true; }
        if (!worker.totalJobsCompleted) { updates.totalJobsCompleted = 0; updateNeeded = true; }
        if (!worker.availabilityStatus) { updates.availabilityStatus = 'available'; updateNeeded = true; }
        if (worker.isVerified === undefined) { updates.isVerified = false; updateNeeded = true; }
        if (!worker.yearsOfExperience) { updates.yearsOfExperience = 1; updateNeeded = true; }
        if (!worker.location) { updates.location = 'Ghana'; updateNeeded = true; }
        if (!worker.specializations || worker.specializations.length === 0) { updates.specializations = ['General Work']; updateNeeded = true; }
        if (!worker.bio) { updates.bio = `${updates.profession || worker.profession || 'Professional Worker'} with ${updates.yearsOfExperience || worker.yearsOfExperience || 1} years of experience.`; updateNeeded = true; }
        
        // Update worker in database if needed
        if (updateNeeded) {
          try {
            await MongoUser.findByIdAndUpdate(worker._id, updates);
            return { ...worker, ...updates };
          } catch (err) {
            console.warn('Failed to update worker defaults in search:', err.message);
            return { ...worker, ...updates };
          }
        }
        
        return worker;
      }));

      // Format response data
      const searchResults = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        name: `${worker.firstName} ${worker.lastName}`,
        bio: worker.bio,
        location: worker.location,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency,
        rating: worker.rating,
        totalReviews: worker.totalReviews,
        totalJobsCompleted: worker.totalJobsCompleted,
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture || null,
        skills: worker.skills,
        availability: worker.availabilityStatus,
        title: worker.profession,
        experience: `${worker.yearsOfExperience} years`,
        distance: latitude && longitude && worker.locationCoordinates ?
          calculateDistance(latitude, longitude, worker.locationCoordinates.coordinates[1], worker.locationCoordinates.coordinates[0]) : null
      })).map((w) => ({ ...w, rankScore: scoreFor(w) }));

      // Sort by relevance if requested
      if (sortBy === 'relevance') {
        searchResults.sort((a, b) => b.rankScore - a.rankScore);
      }

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          workers: searchResults,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
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

  /**
   * Get worker availability (status, hours, pause)
   */
  static async getAvailability(req, res) {
    try {
      const { id } = req.params;
      const worker = await WorkerProfile.findOne({
        where: {
          [Op.or]: [{ id }, { userId: id }],
          isActive: true,
        },
      });

      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Availability retrieved successfully',
        data: {
          availabilityStatus: worker.availabilityStatus,
          availableHours: worker.availableHours,
          pausedUntil: worker.pausedUntil || null,
          serviceRadius: worker.serviceRadius,
        },
      });
    } catch (error) {
      console.error('Get availability error:', error);
      return handleServiceError(res, error, 'Failed to retrieve availability');
    }
  }

  /**
   * List worker skills
   */
  static async getSkills(req, res) {
    try {
      const { id } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const skills = await WorkerSkill.findAll({
        where: { workerProfileId: worker.id, isActive: true },
        order: [['proficiencyLevel', 'DESC'], ['yearsOfExperience', 'DESC']],
      });

      const data = skills.map((s) => ({
        id: s.id,
        workerProfileId: s.workerProfileId,
        skillName: s.skillName,
        proficiencyLevel: s.proficiencyLevel,
        yearsOfExperience: s.yearsOfExperience,
        isCertified: s.isCertified,
        certificationName: s.certificationName,
        certificationIssuer: s.certificationIssuer,
        certificationDate: s.certificationDate,
      }));

      return res.status(200).json({ success: true, message: 'Skills retrieved successfully', data });
    } catch (error) {
      console.error('Get skills error:', error);
      return handleServiceError(res, error, 'Failed to retrieve skills');
    }
  }

  /**
   * Update an existing skill
   */
  static async updateSkill(req, res) {
    try {
      const { id, skillId } = req.params;
      const updates = req.body || {};

      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const skill = await WorkerSkill.findOne({
        where: { id: skillId, workerProfileId: worker.id, isActive: true },
      });
      if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      await skill.update({
        skillName: updates.skillName ?? skill.skillName,
        proficiencyLevel: updates.proficiencyLevel ?? skill.proficiencyLevel,
        yearsOfExperience: updates.yearsOfExperience ?? skill.yearsOfExperience,
        isCertified: updates.isCertified ?? skill.isCertified,
        certificationName: updates.certificationName ?? skill.certificationName,
        certificationIssuer: updates.certificationIssuer ?? skill.certificationIssuer,
        certificationDate: updates.certificationDate ?? skill.certificationDate,
      });

      return res.status(200).json({ success: true, message: 'Skill updated successfully', data: { skill } });
    } catch (error) {
      console.error('Update skill error:', error);
      return handleServiceError(res, error, 'Failed to update skill');
    }
  }

  /**
   * Delete a skill
   */
  static async deleteSkill(req, res) {
    try {
      const { id, skillId } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id }, { userId: id }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const skill = await WorkerSkill.findOne({
        where: { id: skillId, workerProfileId: worker.id, isActive: true },
      });
      if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      // Soft-delete when possible
      if (typeof skill.update === 'function' && Object.prototype.hasOwnProperty.call(skill, 'isActive')) {
        await skill.update({ isActive: false });
      } else if (typeof skill.destroy === 'function') {
        await skill.destroy();
      }

      return res.status(200).json({ success: true, message: 'Skill deleted successfully' });
    } catch (error) {
      console.error('Delete skill error:', error);
      return handleServiceError(res, error, 'Failed to delete skill');
    }
  }

  /**
   * Worker statistics (rating, reviews, jobs, rates)
   */
  static async getStats(req, res) {
    try {
      const { workerId } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id: workerId }, { userId: workerId }], isActive: true },
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      // Compute richer stats using available services where possible (safe fallbacks)
      const hasMethod = (obj, name) => obj && typeof obj[name] === 'function';
      const completionRate = hasMethod(worker, 'getCompletionRate') ? worker.getCompletionRate() : undefined;
      const responseRate = hasMethod(worker, 'getResponseRate') ? worker.getResponseRate() : undefined;

      // Fallbacks to existing columns; cross-service aggregations can be added later
      const stats = {
        rating: Number(worker.rating || 0),
        totalReviews: Number(worker.totalReviews || 0),
        totalJobsCompleted: Number(worker.totalJobsCompleted || 0),
        completionRate: completionRate ?? null,
        responseRate: responseRate ?? null,
        availabilityStatus: worker.availabilityStatus,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency || 'GHS',
        updatedAt: worker.updatedAt,
      };

      return res.status(200).json({ success: true, message: 'Worker stats retrieved successfully', data: stats });
    } catch (error) {
      console.error('Get stats error:', error);
      return handleServiceError(res, error, 'Failed to get worker stats');
    }
  }
  /**
   * Get profile completion score and suggestions
   */
  static async getProfileCompleteness(req, res) {
    try {
      const { id } = req.params;
      const { WorkerProfile, WorkerSkill, Portfolio } = require('../models');
      const profile = await WorkerProfile.findOne({
        where: { userId: id },
        include: [
          { model: WorkerSkill, as: 'skills' },
          { model: Portfolio, as: 'portfolioItems' }
        ]
      });
      if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found' });
      const completion = profile.getProfileCompletionPercentage();
      const suggestions = [];
      if (!(profile.bio && profile.bio.length >= 50)) suggestions.push('Add a longer bio (50+ chars)');
      if (!(profile.hourlyRate > 0)) suggestions.push('Set your hourly rate');
      if (!profile.availabilityStatus) suggestions.push('Set your availability status');
      if (!profile.location) suggestions.push('Set your location');
      if (!profile.skills || profile.skills.length === 0) suggestions.push('Add at least one skill');
      if (!profile.portfolioItems || profile.portfolioItems.length === 0) suggestions.push('Add a portfolio item');
      return res.json({ success: true, data: { completion, suggestions } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to calculate profile completeness');
    }
  }
 
/* NOTE: duplicate legacy block below



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



        res.status(201).json({ success: true, message: 'Worker profile created successfully', data: { worker } });

      }



    } catch (error) {
      console.error('Create/Update worker profile error:', error);
      return handleServiceError(res, error, 'Failed to save worker profile');
    }
  }

  // legacy duplicate: updateAvailability (removed; see canonical above)



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



// END of trimmed legacy block
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
