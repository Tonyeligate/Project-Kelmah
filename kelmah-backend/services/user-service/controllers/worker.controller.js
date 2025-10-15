/**
 * Worker Profile Controller
 * Handles all worker-related operations
 */

const mongoose = require('mongoose');
const modelsModule = require('../models');
// DO NOT destructure models at module load time - use modelsModule.ModelName or local variables
// Models are loaded AFTER database connection, so they're undefined at module load time
const { ensureConnection } = require('../config/db');
const { validateInput, handleServiceError } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');
const { verifyAccessToken, decodeUserFromClaims } = require('../../../shared/utils/jwt');

const REQUIRED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'profession',
  'bio',
  'location',
  'hourlyRate',
  'skills',
];

const OPTIONAL_PROFILE_FIELDS = [
  'profilePicture',
  'phone',
  'website',
  'portfolio',
  'certifications',
  'yearsOfExperience',
];

const buildProfileFallbackPayload = (reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  completionPercentage: 0,
  requiredCompletion: 0,
  optionalCompletion: 0,
  missingRequired: [...REQUIRED_PROFILE_FIELDS],
  missingOptional: [...OPTIONAL_PROFILE_FIELDS],
  recommendations: [
    'Complete your professional bio',
    'Add your profile picture',
    'List your certifications',
    'Update your portfolio',
  ],
  source: {
    user: false,
    workerProfile: false,
  },
  fallback: true,
  fallbackReason: reason,
});

const buildAvailabilityFallbackPayload = (workerId = null, reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  status: 'not_set',
  isAvailable: true,
  timezone: 'Africa/Accra',
  daySlots: [],
  schedule: [],
  nextAvailable: null,
  message: 'Availability temporarily unavailable',
  pausedUntil: null,
  lastUpdated: null,
  fallback: true,
  fallbackReason: reason,
  user: workerId,
});

const isDbUnavailableError = (error) => {
  if (!error) {
    return false;
  }

  const name = String(error.name || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();
  if (
    name.includes('mongonetworkerror') ||
    name.includes('mongooseerror') ||
    name.includes('mongoerror') ||
    name.includes('mongoosetimeouts') ||
    code === 'etimedout' ||
    code === 'ecancelled'
  ) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('timed out waiting for mongodb connection') ||
    message.includes('mongodb connection failed to reach ready state') ||
    message.includes('failed to connect to server') ||
    message.includes('topology was destroyed')
  );
};

class WorkerController {
  /**
   * Get all workers with filtering and pagination - FIXED to use MongoDB
   */
  static async getAllWorkers(req, res) {
    try {
      console.log('🔍 getAllWorkers called - URL:', req.originalUrl, 'Path:', req.path);
      await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
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

      // ✅ FIXED: Use direct MongoDB driver (bypass disconnected Mongoose models)
      const mongoose = require('mongoose');
      const client = mongoose.connection.getClient();
      const db = client.db();
      const usersCollection = db.collection('users');

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

      // Execute MongoDB query using direct driver
      const [workers, totalCount] = await Promise.all([
        usersCollection
          .find(mongoQuery)
          .sort({ updatedAt: -1 })
          .skip(offset)
          .limit(parseInt(limit))
          .toArray(),
        usersCollection.countDocuments(mongoQuery)
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
        if (!worker.bio) {
          updates.bio = `Experienced ${worker.profession || 'General Worker'} with ${worker.yearsOfExperience || 2} years of experience in ${worker.location || 'Accra, Ghana'}.`;
          updateNeeded = true;
        }

        // Update MongoDB document if needed (using direct driver)
        if (updateNeeded) {
          try {
            await usersCollection.updateOne(
              { _id: worker._id },
              { $set: updates }
            );
            console.log(`✅ Auto-populated worker fields for ${worker.firstName} ${worker.lastName}`);
          } catch (error) {
            console.error(`❌ Failed to auto-populate worker fields for ${worker._id}:`, error);
          }
        }

        // Return worker with populated defaults
        return { ...worker, ...updates };
      }));

      // Format response data with ranking score
      const formattedWorkers = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        userId: worker._id.toString(),
        name: `${worker.firstName} ${worker.lastName}`,
        bio: worker.bio || `${worker.profession || 'Professional Worker'} with ${worker.yearsOfExperience || 0} years of experience.`,
        location: worker.location || 'Ghana',
        hourlyRate: worker.hourlyRate || 25,
        currency: worker.currency || 'GHS',
        rating: worker.rating || 4.5,
        totalReviews: worker.totalReviews || 0,
        totalJobsCompleted: worker.totalJobsCompleted || 0,
        availabilityStatus: worker.availabilityStatus || 'available',
        isVerified: worker.isVerified || false,
        profilePicture: worker.profilePicture || null,
        skills: worker.skills?.map(skill => ({
          name: skill,
          proficiency: 'Intermediate',
          certified: false
        })) || [{ name: worker.profession || 'General Work', proficiency: 'Intermediate', certified: false }],
        specializations: [worker.profession || 'General Work'],
        title: worker.profession || 'General Worker',
        experience: `${worker.yearsOfExperience || 2} years`,
        rankScore: scoreFor(worker)
      }));

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
            verified,
            search
          }
        }
      });

    } catch (error) {
      console.error('Get all workers error:', error);
      if (error?.message?.toLowerCase().includes('timed out waiting for mongodb connection')) {
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_DB_NOT_READY'
        });
      }
      return handleServiceError(res, error, 'Failed to retrieve workers');
    }
  }

  /**
   * Search workers with advanced filtering
   */
  static async searchWorkers(req, res) {
    try {
      await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
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

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;

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

        // Add missing worker fields with defaults
        if (!worker.profession) {
          updates.profession = 'General Worker';
          updateNeeded = true;
        }
        if (!worker.skills || worker.skills.length === 0) {
          updates.skills = ['General Work', 'Manual Labor'];
          updateNeeded = true;
        }
        if (!worker.hourlyRate) {
          updates.hourlyRate = 25;
          updateNeeded = true;
        }
        if (!worker.currency) {
          updates.currency = 'GHS';
          updateNeeded = true;
        }
        if (!worker.rating) {
          updates.rating = 4.5;
          updateNeeded = true;
        }
        if (!worker.totalReviews) {
          updates.totalReviews = 0;
          updateNeeded = true;
        }
        if (!worker.totalJobsCompleted) {
          updates.totalJobsCompleted = 0;
          updateNeeded = true;
        }
        if (!worker.availabilityStatus) {
          updates.availabilityStatus = 'available';
          updateNeeded = true;
        }
        if (worker.isVerified === undefined) {
          updates.isVerified = false;
          updateNeeded = true;
        }
        if (!worker.bio) {
          updates.bio = `Experienced ${worker.profession || 'General Worker'} with ${worker.yearsOfExperience || 2} years of experience in ${worker.location || 'Accra, Ghana'}.`;
          updateNeeded = true;
        }

        // Update MongoDB document if needed
        if (updateNeeded) {
          try {
            await MongoUser.updateOne({ _id: worker._id }, { $set: updates });
            console.log(`✅ Auto-populated worker fields for ${worker.firstName} ${worker.lastName}`);
          } catch (error) {
            console.error(`❌ Failed to auto-populate worker fields for ${worker._id}:`, error);
          }
        }

        // Return worker with populated defaults
        return { ...worker, ...updates };
      }));

      // Format search results
      const searchResults = workersWithDefaults.map(worker => ({
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
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture,
        skills: worker.skills?.slice(0, 5).map(skill => skill.skillName) || [],
        distance: latitude && longitude && worker.latitude && worker.longitude ?
          calculateDistance(latitude, longitude, worker.latitude, worker.longitude) : null
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
      if (error?.message?.toLowerCase().includes('timed out waiting for mongodb connection')) {
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_DB_NOT_READY'
        });
      }
      return handleServiceError(res, error, 'Search failed');
    }
  }

  /**
   * Get profile completion percentage for a worker
   */
  static async getProfileCompletion(req, res) {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid worker ID required',
      });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildProfileFallbackPayload(reason),
      });

    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not ready for profile completeness request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoWorkerProfile = modelsModule.WorkerProfile;

      if (!MongoUser) {
        return res.status(503).json({
          success: false,
          message: 'User model not initialized',
        });
      }

      const [worker, workerProfile] = await Promise.all([
        MongoUser.findById(workerId).lean(),
        MongoWorkerProfile ? MongoWorkerProfile.findOne({ userId: workerId }).lean() : null,
      ]);

      if (!worker && !workerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      const normalizeArray = (value) => {
        if (Array.isArray(value)) {
          return value.filter((item) => item !== null && item !== undefined);
        }
        return [];
      };

      const combined = {
        ...(worker || {}),
        ...(workerProfile || {}),
        // Explicit precedence rules for overlapping fields
        bio: worker?.bio ?? workerProfile?.bio ?? '',
        location: worker?.location ?? workerProfile?.location ?? '',
        hourlyRate:
          worker?.hourlyRate ??
          workerProfile?.hourlyRate ??
          workerProfile?.hourlyRateMin ??
          workerProfile?.hourlyRateMax ?? null,
        skills: normalizeArray(
          (Array.isArray(worker?.skills) && worker?.skills.length > 0
            ? worker.skills
            : workerProfile?.skills) || [],
        ),
        profilePicture: worker?.profilePicture ?? workerProfile?.profilePicture ?? null,
        certifications: normalizeArray(
          (workerProfile?.certifications && workerProfile.certifications.length
            ? workerProfile.certifications
            : worker?.certifications) || [],
        ),
        portfolio: normalizeArray(
          (workerProfile?.portfolioItems && workerProfile.portfolioItems.length
            ? workerProfile.portfolioItems
            : worker?.portfolio) || [],
        ),
        yearsOfExperience: worker?.yearsOfExperience ?? workerProfile?.yearsOfExperience ?? null,
        profession: worker?.profession ?? workerProfile?.profession ?? '',
        phone: worker?.phone ?? workerProfile?.phone ?? '',
        website: worker?.website ?? workerProfile?.website ?? '',
      };

      const getFieldValue = (field) => {
        switch (field) {
          case 'portfolio':
            return combined.portfolio;
          case 'certifications':
            return combined.certifications;
          case 'skills':
            return combined.skills;
          default:
            return combined[field];
        }
      };

      const hasValue = (value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (value && typeof value === 'object') {
          return Object.keys(value).length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      };

      // Calculate completion percentage based on profile fields
      let completedRequired = 0;
      let completedOptional = 0;

      // Check required fields
      REQUIRED_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedRequired++;
        }
      });

      // Check optional fields
      OPTIONAL_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedOptional++;
        }
      });

      const requiredPercentage = (completedRequired / REQUIRED_PROFILE_FIELDS.length) * 70; // 70% weight
      const optionalPercentage = (completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 30; // 30% weight
      const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

      // Determine missing fields
      const missingRequired = REQUIRED_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const missingOptional = OPTIONAL_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const recommendations = [];
      if (missingRequired.includes('bio')) {
        recommendations.push('Complete your professional bio');
      }
      if (missingRequired.includes('profilePicture')) {
        recommendations.push('Add your profile picture');
      }
      if (missingOptional.includes('certifications')) {
        recommendations.push('List your certifications');
      }
      if (missingOptional.includes('portfolio')) {
        recommendations.push('Update your portfolio');
      }
      if (recommendations.length === 0 && totalPercentage < 100) {
        recommendations.push('Review your profile details to reach 100% completion');
      }

      res.json({
        success: true,
        data: {
          completionPercentage: totalPercentage,
          requiredCompletion: Math.round((completedRequired / REQUIRED_PROFILE_FIELDS.length) * 100),
          optionalCompletion: Math.round((completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 100),
          missingRequired,
          missingOptional,
          recommendations,
          source: {
            user: !!worker,
            workerProfile: !!workerProfile,
          },
        }
      });

    } catch (error) {
      console.error('❌ ERROR in getProfileCompletion - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        UserModelExists: !!User,
        WorkerProfileModelExists: !!WorkerProfile,
        connectionState: mongoose.connection.readyState
      });
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      return handleServiceError(res, error, 'Failed to get profile completion');
    }
  }

  /**
   * Get recent jobs for workers
   */
  static async getRecentJobs(req, res) {
    try {
      const { limit = 10 } = req.query;
      const parseGatewayUser = () => {
        if (req.user?.id) {
          return req.user;
        }

        const gatewayHeader = req.headers['x-authenticated-user'];
        if (gatewayHeader) {
          try {
            const parsed = JSON.parse(gatewayHeader);
            if (parsed && parsed.id) {
              return parsed;
            }
          } catch (error) {
            console.warn('Failed to parse x-authenticated-user header:', error.message);
          }
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          try {
            const decoded = verifyAccessToken(token);
            const claims = decodeUserFromClaims(decoded);
            if (claims?.id) {
              return claims;
            }
          } catch (error) {
            console.warn('Unable to decode authorization token for recent jobs:', error.message);
          }
        }

        return null;
      };

      const buildRecentJobsFallback = (reason = 'RECENT_JOBS_FALLBACK') => {
        const mockJobs = [
          {
            id: 'job_123',
            title: 'Kitchen Cabinet Installation',
            client: 'Sarah Johnson',
            clientId: 'user_456',
            status: 'completed',
            budget: 2500,
            currency: 'GHS',
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            rating: 5,
            location: 'East Legon, Accra'
          },
          {
            id: 'job_124',
            title: 'Plumbing Repair',
            client: 'Michael Brown',
            clientId: 'user_789',
            status: 'in-progress',
            budget: 800,
            currency: 'GHS',
            startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            location: 'Tema, Accra'
          },
          {
            id: 'job_125',
            title: 'Electrical Wiring',
            client: 'Jennifer Wilson',
            clientId: 'user_321',
            status: 'pending',
            budget: 1500,
            currency: 'GHS',
            appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            location: 'Airport Residential, Accra'
          }
        ];

        return {
          success: true,
          data: {
            jobs: mockJobs.slice(0, parseInt(limit)),
            total: mockJobs.length,
            fallback: true,
            fallbackReason: reason
          }
        };
      };

      const userContext = parseGatewayUser();
      const userId = userContext?.id;

      if (!userId) {
        console.warn('Recent jobs request missing authenticated user context; returning fallback data');
        return res.status(200).json(buildRecentJobsFallback('MISSING_AUTH_CONTEXT'));
      }

      // Try to get real job data from job service
      let jobs = [];
      try {
        const axios = require('axios');
        const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://localhost:5003';
        const response = await axios.get(`${jobServiceUrl}/api/jobs/worker/recent`, {
          params: { workerId: userId, limit },
          headers: { Authorization: req.headers.authorization },
          timeout: 5000
        });
        jobs = response.data?.jobs || [];
      } catch (error) {
        console.warn('Could not fetch recent jobs from job service:', error.message);
        const fallback = buildRecentJobsFallback('JOB_SERVICE_UNAVAILABLE');
        return res.status(200).json(fallback);
      }

      res.json({
        success: true,
        data: {
          jobs: jobs.slice(0, parseInt(limit)),
          total: jobs.length
        }
      });
    } catch (error) {
      console.error('Get recent jobs error:', error);
      return handleServiceError(res, error, 'Failed to get recent jobs');
    }
  }

  /**
   * Get worker availability by worker ID
   */
  static async getWorkerAvailability(req, res) {
    const workerId = req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker ID required' });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildAvailabilityFallbackPayload(workerId, reason),
      });

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      console.warn('Invalid worker ID supplied for availability; returning fallback', { workerId });
      return sendFallback('INVALID_WORKER_ID');
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not ready for availability request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoAvailability = modelsModule.Availability;

      if (!MongoUser || !MongoAvailability) {
        console.warn('Availability request missing initialized models, returning fallback');
        return sendFallback('MODELS_NOT_INITIALIZED');
      }

      // Get worker user info
      const worker = await MongoUser.findById(workerId).lean();
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const availability = await MongoAvailability.findOne({ user: workerId }).lean();

      if (!availability) {
        return res.json({
          success: true,
          data: {
            status: 'not_set',
            isAvailable: true,
            timezone: 'Africa/Accra',
            daySlots: [],
            schedule: [],
            nextAvailable: null,
            message: 'Availability not configured'
          }
        });
      }

      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const normalizedSchedule = Array.isArray(availability.daySlots)
        ? availability.daySlots.map((daySlot) => ({
            day: dayMap[daySlot.dayOfWeek] ?? 'unknown',
            available: Array.isArray(daySlot.slots) && daySlot.slots.length > 0,
            slots: Array.isArray(daySlot.slots)
              ? daySlot.slots.map((slot) => ({
                  start: slot.start,
                  end: slot.end,
                }))
              : [],
          }))
        : [];

      const computeNextAvailable = () => {
        if (!normalizedSchedule.length) {
          return null;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let offset = 0; offset < 7; offset += 1) {
          const dayIndex = (now.getDay() + offset) % 7;
          const dayName = dayMap[dayIndex];
          const dayEntry = normalizedSchedule.find((entry) => entry.day === dayName && entry.slots.length > 0);
          if (!dayEntry) {
            continue;
          }

          for (const slot of dayEntry.slots) {
            const [startHour = '0', startMinute = '0'] = slot.start.split(':');
            const slotMinutes = Number(startHour) * 60 + Number(startMinute);
            if (offset > 0 || slotMinutes >= currentMinutes) {
              return `${dayName} ${slot.start}`;
            }
          }
        }

        return null;
      };

      res.json({
        success: true,
        data: {
          status: availability.isAvailable ? 'available' : 'unavailable',
          isAvailable: Boolean(availability.isAvailable),
          timezone: availability.timezone,
          daySlots: availability.daySlots || [],
          schedule: normalizedSchedule,
          nextAvailable: computeNextAvailable(),
          lastUpdated: availability.updatedAt,
          pausedUntil: availability.pausedUntil || null,
        }
      });
    } catch (error) {
      console.error('❌ ERROR in getWorkerAvailability - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        AvailabilityModelExists: !!Availability,
        UserModelExists: !!User,
        connectionState: mongoose.connection.readyState
      });
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      if (error?.name === 'CastError') {
        return sendFallback('INVALID_WORKER_ID');
      }
      return handleServiceError(res, error, 'Failed to get worker availability');
    }
  }
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

module.exports = WorkerController;
