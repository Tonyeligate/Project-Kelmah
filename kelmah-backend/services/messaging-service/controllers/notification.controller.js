const Notification = require('../models/Notification');
const { handleError } = require('../utils/errorHandler');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipient: req.user._id
    };

    if (unreadOnly === 'true') {
      query['readStatus.isRead'] = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('relatedEntity.id');

    const totalNotifications = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        'readStatus.isRead': false
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': new Date()
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.remove();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      'readStatus.isRead': false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    handleError(res, error);
  }
}; 