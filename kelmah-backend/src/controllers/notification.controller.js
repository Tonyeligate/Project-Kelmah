const { Notification } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new notification
exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    return successResponse(res, 201, 'Notification created successfully', notification);
  } catch (error) {
    next(error);
  }
};

// Retrieve all notifications with pagination
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Notifications retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single notification by ID
exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }
    return successResponse(res, 200, 'Notification retrieved successfully', notification);
  } catch (error) {
    next(error);
  }
};

// Update a notification by ID
exports.updateNotification = async (req, res, next) => {
  try {
    const [updated] = await Notification.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Notification not found');
    }
    const updatedNotification = await Notification.findByPk(req.params.id);
    return successResponse(res, 200, 'Notification updated successfully', updatedNotification);
  } catch (error) {
    next(error);
  }
};

// Delete a notification by ID
exports.deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Notification not found');
    }
    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
}; 