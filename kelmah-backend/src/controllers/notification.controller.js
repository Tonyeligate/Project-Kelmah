const Notification = require('../models/Notification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const query = { user: req.user.id };

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return paginatedResponse(res, 200, 'Notifications retrieved successfully', notifications, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    // Emit dashboard update for notifications change
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) dashboardSocket.emitUpdate(req.user.id, { type: 'notificationRead', notification });

    return successResponse(res, 200, 'Notification marked as read', notification);
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user.id });

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    // Emit dashboard update for notification deletion
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) dashboardSocket.emitUpdate(req.user.id, { type: 'notificationDeleted', notification });

    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
}; 