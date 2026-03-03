/**
 * User Performance Controller - Manage user performance tracking and tier management
 */

const mongoose = require('mongoose');
const { UserPerformance, User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get user performance data
exports.getUserPerformance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return errorResponse(res, 400, 'Invalid user ID');

    // Check if user is viewing their own performance or is an admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    let userPerformance = await UserPerformance.findOne({ userId })
      .populate('userId', 'firstName lastName email profilePicture');

    // Create performance record if it doesn't exist
    if (!userPerformance) {
      userPerformance = new UserPerformance({ userId });
      await userPerformance.save();
      await userPerformance.populate('userId', 'firstName lastName email profilePicture');
    }

    return successResponse(res, 200, 'User performance retrieved successfully', userPerformance);
  } catch (error) {
    next(error);
  }
};

// Update user performance metrics
exports.updateUserPerformance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { metrics } = req.body;
    if (!isValidId(userId)) return errorResponse(res, 400, 'Invalid user ID');
    // Check if user is updating their own performance or is an admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    let userPerformance = await UserPerformance.findOne({ userId });
    if (!userPerformance) {
      userPerformance = new UserPerformance({ userId });
    }

    await userPerformance.updateMetrics(metrics);

    return successResponse(res, 200, 'User performance updated successfully', userPerformance);
  } catch (error) {
    next(error);
  }
};

// Verify user skill
exports.verifySkill = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { skill, isPrimary, verificationData } = req.body;

    // Only admins can verify skills
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied. Only admins can verify skills');
    }
    if (!isValidId(userId)) return errorResponse(res, 400, 'Invalid user ID');

    let userPerformance = await UserPerformance.findOne({ userId });
    if (!userPerformance) {
      userPerformance = new UserPerformance({ userId });
    }

    // Validate verification data
    if (!verificationData.method || !verificationData.experienceMonths) {
      return errorResponse(res, 400, 'Verification method and experience months are required');
    }

    await userPerformance.verifySkill(skill, isPrimary, {
      ...verificationData,
      verifiedBy: req.user.id
    });

    return successResponse(res, 200, 'Skill verified successfully', userPerformance);
  } catch (error) {
    next(error);
  }
};

// Update user tier
exports.updateUserTier = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tier, reason } = req.body;

    // Only admins can manually update tiers
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied. Only admins can update tiers');
    }

    const validTiers = ['tier1', 'tier2', 'tier3'];
    if (!validTiers.includes(tier)) {
      return errorResponse(res, 400, 'Invalid tier. Must be tier1, tier2, or tier3');
    }

    let userPerformance = await UserPerformance.findOne({ userId });
    if (!userPerformance) {
      userPerformance = new UserPerformance({ userId });
    }

    await userPerformance.updateTier(tier, reason || 'Manually updated by admin');

    return successResponse(res, 200, 'User tier updated successfully', userPerformance);
  } catch (error) {
    next(error);
  }
};

// Get users by performance tier
exports.getUsersByTier = async (req, res, next) => {
  try {
    const { tier } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const validTiers = ['tier1', 'tier2', 'tier3'];
    if (!validTiers.includes(tier)) {
      return errorResponse(res, 400, 'Invalid tier. Must be tier1, tier2, or tier3');
    }

    // Use Mongoose syntax (NOT Sequelize)
    const users = await UserPerformance.find({ performanceTier: tier })
      .populate('userId', 'firstName lastName email profilePicture')
      .skip(offset)
      .limit(limit)
      .sort({ overallScore: -1 })
      .lean();

    const totalCount = await UserPerformance.countDocuments({ performanceTier: tier });

    return paginatedResponse(res, 200, `Users in ${tier} retrieved successfully`, users, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Get top performers
exports.getTopPerformers = async (req, res, next) => {
  try {
    const { limit = 10, tier = null } = req.query;

    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const cappedLimit = Math.min(100, parseInt(limit, 10) || 10);

    let query = {};
    if (tier) {
      query.performanceTier = tier;
    }

    const topPerformers = await UserPerformance.find(query)
      .sort({ 'metrics.jobCompletionRate': -1, 'metrics.clientSatisfaction': -1 })
      .limit(cappedLimit)
      .populate('userId', 'firstName lastName email profilePicture')
      .lean();

    return successResponse(res, 200, 'Top performers retrieved successfully', topPerformers);
  } catch (error) {
    next(error);
  }
};

// Get users by location
exports.getUsersByLocation = async (req, res, next) => {
  try {
    const { region } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    // Use Mongoose syntax (NOT Sequelize)
    const users = await UserPerformance.find({ 'locationPreferences.primaryRegion': region })
      .populate('userId', 'firstName lastName email profilePicture')
      .skip(offset)
      .limit(limit)
      .sort({ overallScore: -1 })
      .lean();

    const totalCount = await UserPerformance.countDocuments({ 'locationPreferences.primaryRegion': region });

    return paginatedResponse(res, 200, `Users in ${region} retrieved successfully`, users, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Get users by skill
exports.getUsersBySkill = async (req, res, next) => {
  try {
    const { skill } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    // Use Mongoose syntax (NOT Sequelize)
    const query = {
      $or: [
        { 'skillVerification.primarySkills.skill': skill },
        { 'skillVerification.secondarySkills.skill': skill }
      ]
    };
    const users = await UserPerformance.find(query)
      .populate('userId', 'firstName lastName email profilePicture')
      .skip(offset)
      .limit(limit)
      .sort({ overallScore: -1 });

    const totalCount = await UserPerformance.countDocuments(query);

    return paginatedResponse(res, 200, `Users with ${skill} skill retrieved successfully`, users, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Update location preferences
exports.updateLocationPreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { locationPreferences } = req.body;

    // Check if user is updating their own preferences or is an admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    let userPerformance = await UserPerformance.findOne({ userId });
    if (!userPerformance) {
      userPerformance = new UserPerformance({ userId });
    }

    userPerformance.locationPreferences = {
      ...userPerformance.locationPreferences,
      ...locationPreferences
    };

    await userPerformance.save();

    return successResponse(res, 200, 'Location preferences updated successfully', userPerformance);
  } catch (error) {
    next(error);
  }
};

// Get performance analytics
exports.getPerformanceAnalytics = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const [analytics] = await UserPerformance.aggregate([
      { $facet: {
          byTier: [{ $group: { _id: '$performanceTier', count: { $sum: 1 } } }],
          avgCompletion: [{ $group: { _id: null, avg: { $avg: '$metrics.jobCompletionRate' } } }],
          avgSatisfaction: [{ $group: { _id: null, avg: { $avg: '$metrics.clientSatisfaction' } } }],
          total: [{ $count: 'count' }]
      }}
    ]);

    const tierMap = {};
    for (const t of (analytics?.byTier || [])) tierMap[t._id] = t.count;

    const result = {
      totalUsers: analytics?.total?.[0]?.count || 0,
      tierDistribution: {
        tier1: tierMap.tier1 || 0,
        tier2: tierMap.tier2 || 0,
        tier3: tierMap.tier3 || 0
      },
      averageMetrics: {
        jobCompletionRate: analytics?.avgCompletion?.[0]?.avg || 0,
        clientSatisfaction: analytics?.avgSatisfaction?.[0]?.avg || 0
      }
    };

    return successResponse(res, 200, 'Performance analytics retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Auto-calculate and update all user tiers
exports.recalculateAllTiers = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    // Process in batches using cursor to avoid loading all into memory
    const cursor = UserPerformance.find().cursor();
    let updatedCount = 0;
    let totalUsers = 0;

    for await (const userPerformance of cursor) {
      totalUsers++;
      const calculatedTier = userPerformance.calculateTier();
      if (calculatedTier !== userPerformance.performanceTier) {
        await userPerformance.updateTier(calculatedTier, 'Auto-calculated based on performance metrics');
        updatedCount++;
      }
    }

    return successResponse(res, 200, `Recalculated tiers for ${updatedCount} users`, {
      updatedCount,
      totalUsers
    });
  } catch (error) {
    next(error);
  }
};
