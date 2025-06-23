const Setting = require('../models/Setting');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get settings for the current user
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ user: req.user.id });
    if (!settings) {
      // Return empty object when no settings exist
      return successResponse(res, 200, 'Settings retrieved successfully', {});
    }
    return successResponse(res, 200, 'Settings retrieved successfully', settings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update settings for the current user
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const data = req.body;
    let settings = await Setting.findOne({ user: req.user.id });
    if (settings) {
      settings = await Setting.findOneAndUpdate(
        { user: req.user.id },
        data,
        { new: true, runValidators: true }
      );
    } else {
      settings = await Setting.create({ user: req.user.id, ...data });
    }
    return successResponse(res, 200, 'Settings updated successfully', settings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update privacy settings for the current user
 */
exports.updatePrivacy = async (req, res, next) => {
  try {
    const data = { privacy: req.body };
    let settings = await Setting.findOne({ user: req.user.id });
    if (settings) {
      settings = await Setting.findOneAndUpdate(
        { user: req.user.id },
        { $set: data },
        { new: true, runValidators: true }
      );
    } else {
      settings = await Setting.create({ user: req.user.id, ...data });
    }
    return successResponse(res, 200, 'Privacy settings updated successfully', settings.privacy);
  } catch (err) {
    next(err);
  }
}; 