const { successResponse, errorResponse } = require('../utils/response');
const Job = require('../models/Job');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * GET /api/dashboard/overview
 */
exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const totalJobs = await Job.countDocuments({ hirer: userId });
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const upcomingAppointments = await Appointment.countDocuments({ worker: userId, date: { $gte: new Date() } });
    const data = { totalJobs, unreadNotifications, unreadConversations, upcomingAppointments };
    return successResponse(res, 200, 'Overview data retrieved', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/activity
 */
exports.getActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Recent notifications
    const notifications = await Notification.find({ user: userId })
      .sort('-createdAt')
      .limit(10);
    // Recent conversations (last messages)
    const convs = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .sort('-updatedAt')
      .limit(10);
    const recentMessages = convs.map(c => ({
      conversationId: c._id,
      lastMessage: c.lastMessage,
      participants: c.participants
    }));
    return successResponse(res, 200, 'Activity data retrieved', { notifications, recentMessages });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Job counts by status
    const totalOpenJobs = await Job.countDocuments({ hirer: userId, status: 'open' });
    const totalInProgress = await Job.countDocuments({ hirer: userId, status: 'in-progress' });
    const totalCompleted = await Job.countDocuments({ hirer: userId, status: 'completed' });
    return successResponse(res, 200, 'Statistics data retrieved', { totalOpenJobs, totalInProgress, totalCompleted });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Fetch upcoming appointments for the user as tasks
    const tasks = await Appointment.find({
      worker: userId,
      date: { $gte: new Date() }
    })
      .sort('date')
      .limit(10);
    return successResponse(res, 200, 'Tasks retrieved', tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/messages
 */
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Fetch recent conversations with last messages
    const convs = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .sort('-updatedAt')
      .limit(10);
    const messages = convs.map(c => ({
      conversationId: c._id,
      lastMessage: c.lastMessage,
      updatedAt: c.updatedAt
    }));
    return successResponse(res, 200, 'Recent messages retrieved', messages);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/performance
 */
exports.getPerformance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Count messages sent by user
    const messagesSent = await Message.countDocuments({ sender: userId });
    // Count completed appointments for user (as worker)
    const completedAppointments = await Appointment.countDocuments({ worker: userId, status: 'completed' });
    return successResponse(res, 200, 'Performance metrics retrieved', { messagesSent, completedAppointments });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/quick-actions
 */
exports.getQuickActions = async (req, res, next) => {
  try {
    // Provide a list of common user actions
    const actions = [
      { name: 'Create a new job', url: '/api/jobs/new' },
      { name: 'View proposals', url: '/api/proposals' },
      { name: 'Manage profile', url: '/api/profile' },
      { name: 'Notification settings', url: '/api/settings' }
    ];
    return successResponse(res, 200, 'Quick actions retrieved', actions);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/notifications-summary
 */
exports.getNotificationsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    return successResponse(res, 200, 'Notifications summary retrieved', { unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/stats
 */
exports.getRealTimeStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Global open jobs count
    const openJobs = await Job.countDocuments({ status: 'open' });
    // Unread notifications for user
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    // Unread messages count for user across conversations
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    return successResponse(res, 200, 'Real-time stats retrieved', { openJobs, unreadNotifications, unreadConversations });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    // Alias for overview metrics
    const userId = req.user.id;
    const totalJobs = await Job.countDocuments({ hirer: userId });
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const upcomingAppointments = await Appointment.countDocuments({ worker: userId, date: { $gte: new Date() } });
    const metrics = { totalJobs, unreadNotifications, unreadConversations, upcomingAppointments };
    return successResponse(res, 200, 'Metrics data retrieved', metrics);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/jobs
 */
exports.getRecentJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Recent jobs posted by user
    const jobs = await Job.find({ hirer: userId })
      .sort('-createdAt')
      .limit(10);
    return successResponse(res, 200, 'Recent jobs retrieved', jobs);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/workers
 */
exports.getWorkers = async (req, res, next) => {
  try {
    // Active worker list sorted by rating
    const workers = await User.find({ role: 'worker' })
      .sort('-rating')
      .select('id firstName lastName rating skills')
      .limit(10);
    return successResponse(res, 200, 'Active workers retrieved', workers);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/analytics
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    // Global platform analytics
    const totalJobs = await Job.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalHirers = await User.countDocuments({ role: 'hirer' });
    const analytics = { totalJobs, totalUsers, totalWorkers, totalHirers };
    return successResponse(res, 200, 'Analytics data retrieved', analytics);
  } catch (err) {
    next(err);
  }
}; 