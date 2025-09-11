const { User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Get current user's credentials (public endpoint for authenticated users)
 */
exports.getMyCredentials = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User credentials retrieved successfully', user);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get current user's bookmarks
 */
exports.getMyBookmarks = async (req, res, next) => {
  try {
    // For now, return empty bookmarks with proper structure
    // TODO: Implement actual bookmark model/logic
    const bookmarks = {
      workerIds: [] // Array of worker IDs that user has bookmarked
    };
    return successResponse(res, 200, 'Bookmarks retrieved successfully', bookmarks);
  } catch (error) {
    return next(error);
  }
};

/**
 * Toggle worker bookmark for current user
 */
exports.toggleWorkerBookmark = async (req, res, next) => {
  try {
    const workerId = req.params.id;
    // TODO: Implement actual bookmark toggle logic
    // For now, return success response
    const result = {
      bookmarked: true, // Would be actual toggle result
      workerId: workerId
    };
    return successResponse(res, 200, 'Bookmark toggled successfully', result);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get current user's settings
 */
exports.getMySettings = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'preferences']
    });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Return user settings with safe defaults
    const settings = {
      notifications: user.preferences?.notifications ?? {
        email: true,
        push: true,
        sms: false
      },
      privacy: user.preferences?.privacy ?? {
        profileVisibility: 'public',
        contactInfo: 'registered_users'
      },
      preferences: user.preferences ?? {}
    };
    
    return successResponse(res, 200, 'User settings retrieved successfully', settings);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update current user's settings
 */
exports.updateMySettings = async (req, res, next) => {
  try {
    const { notifications, privacy, preferences } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Update user preferences
    const updatedPreferences = {
      ...user.preferences,
      notifications,
      privacy,
      ...preferences
    };

    await user.update({ preferences: updatedPreferences });
    
    return successResponse(res, 200, 'Settings updated successfully', updatedPreferences);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all users (admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    return paginatedResponse(res, 200, 'Users retrieved successfully', rows, page, limit, count);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single user by ID (admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update a user by ID (admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updatedCount, [updatedUser]] = await User.update(req.body, {
      where: { id },
      returning: true,
      individualHooks: true
    });

    if (updatedCount === 0) {
      return errorResponse(res, 404, 'User not found');
    }

    const userData = updatedUser.toJSON();
    delete userData.password;
    return successResponse(res, 200, 'User updated successfully', userData);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a user by ID (admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const deletedCount = await User.destroy({ where: { id: req.params.id } });
    if (deletedCount === 0) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    return next(error);
  }
};

// Search users by name or email with pagination
// GET /api/search/users
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const where = query
      ? {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${query}%` } },
            { lastName: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } }
          ]
        }
      : {};

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    return paginatedResponse(res, 200, 'User search results', rows, page, limit, count);
  } catch (error) {
    return next(error);
  }
};

// Create a new user (admin only)
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    return successResponse(res, 201, 'User created successfully', user);
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser, searchUsers }; 