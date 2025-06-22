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