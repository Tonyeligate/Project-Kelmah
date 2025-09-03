/**
 * User Performance Controller - Manage user performance tracking and tier management
 */

const { UserPerformance, User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

// Get user performance data
exports.getUserPerformance = async (req, res, next) => {
  try {
    const { userId } = req.params;

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

    const { count, rows } = await UserPerformance.findAndCountAll({
      where: { performanceTier: tier },
      offset,
      limit,
      order: [['overallScore', 'DESC']],
      include: [
        { model: 'User', as: 'userId', attributes: ['firstName', 'lastName', 'email', 'profilePicture'] }
      ]
    });

    return paginatedResponse(res, 200, `Users in ${tier} retrieved successfully`, rows, page, limit, count);
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

    let query = {};
    if (tier) {
      query.performanceTier = tier;
    }

    const topPerformers = await UserPerformance.find(query)
      .sort({ 'metrics.jobCompletionRate': -1, 'metrics.clientSatisfaction': -1 })
      .limit(parseInt(limit, 10))
      .populate('userId', 'firstName lastName email profilePicture');

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

    const { count, rows } = await UserPerformance.findAndCountAll({
      where: { 'locationPreferences.primaryRegion': region },
      offset,
      limit,
      order: [['overallScore', 'DESC']],
      include: [
        { model: 'User', as: 'userId', attributes: ['firstName', 'lastName', 'email', 'profilePicture'] }
      ]
    });

    return paginatedResponse(res, 200, `Users in ${region} retrieved successfully`, rows, page, limit, count);
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

    const { count, rows } = await UserPerformance.findAndCountAll({
      where: {
        $or: [
          { 'skillVerification.primarySkills.skill': skill },
          { 'skillVerification.secondarySkills.skill': skill }
        ]
      },
      offset,
      limit,
      order: [['overallScore', 'DESC']],
      include: [
        { model: 'User', as: 'userId', attributes: ['firstName', 'lastName', 'email', 'profilePicture'] }
      ]
    });

    return paginatedResponse(res, 200, `Users with ${skill} skill retrieved successfully`, rows, page, limit, count);
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

    const totalUsers = await UserPerformance.countDocuments();
    const tier1Users = await UserPerformance.countDocuments({ performanceTier: 'tier1' });
    const tier2Users = await UserPerformance.countDocuments({ performanceTier: 'tier2' });
    const tier3Users = await UserPerformance.countDocuments({ performanceTier: 'tier3' });

    const averageCompletionRate = await UserPerformance.aggregate([
      { $group: { _id: null, avg: { $avg: '$metrics.jobCompletionRate' } } }
    ]);

    const averageSatisfaction = await UserPerformance.aggregate([
      { $group: { _id: null, avg: { $avg: '$metrics.clientSatisfaction' } } }
    ]);

    const analytics = {
      totalUsers,
      tierDistribution: {
        tier1: tier1Users,
        tier2: tier2Users,
        tier3: tier3Users
      },
      averageMetrics: {
        jobCompletionRate: averageCompletionRate[0]?.avg || 0,
        clientSatisfaction: averageSatisfaction[0]?.avg || 0
      }
    };

    return successResponse(res, 200, 'Performance analytics retrieved successfully', analytics);
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

    const allUsers = await UserPerformance.find();
    let updatedCount = 0;

    for (const userPerformance of allUsers) {
      const calculatedTier = userPerformance.calculateTier();
      if (calculatedTier !== userPerformance.performanceTier) {
        await userPerformance.updateTier(calculatedTier, 'Auto-calculated based on performance metrics');
        updatedCount++;
      }
    }

    return successResponse(res, 200, `Recalculated tiers for ${updatedCount} users`, {
      updatedCount,
      totalUsers: allUsers.length
    });
  } catch (error) {
    next(error);
  }
};
