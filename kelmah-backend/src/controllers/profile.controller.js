const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get the profile of the currently authenticated user
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'Profile retrieved successfully', user);
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile activity data
 */
exports.getProfileActivity = async (req, res, next) => {
  try {
    // TODO: Implement actual activity tracking
    // For now, return mock activity data
    const activity = {
      recentJobs: [],
      applications: [],
      completedProjects: 0,
      rating: 0,
      reviewsCount: 0,
      lastActive: new Date()
    };
    return successResponse(res, 200, 'Profile activity retrieved successfully', activity);
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile statistics
 */
exports.getProfileStatistics = async (req, res, next) => {
  try {
    // TODO: Implement actual statistics calculation
    // For now, return mock statistics data
    const statistics = {
      totalProjects: 0,
      completedProjects: 0,
      activeApplications: 0,
      totalEarnings: 0,
      averageRating: 0,
      responseRate: 100,
      completionRate: 100
    };
    return successResponse(res, 200, 'Profile statistics retrieved successfully', statistics);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific user's profile by ID
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User profile retrieved successfully', user);
  } catch (err) {
    next(err);
  }
};

/**
 * Update the profile of the currently authenticated user
 */
exports.updateMyProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (err) {
    next(err);
  }
}; 