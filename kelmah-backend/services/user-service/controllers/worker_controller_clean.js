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
      return handleServiceError(res, error, 'Failed to retrieve workers');
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
