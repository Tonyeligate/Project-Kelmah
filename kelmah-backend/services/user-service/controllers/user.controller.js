const initUserModel = require("../models/User");
const { sequelize } = require("../config/db");
const User = initUserModel(sequelize);

/**
 * Get all users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new user
 */
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard metrics
 */
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    // No mock metrics; return empty structure to indicate no data
    res.json({ totalUsers: 0, activeWorkers: 0, totalJobs: 0, completedJobs: 0, revenue: 0, growthRate: 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard workers
 */
exports.getDashboardWorkers = async (req, res, next) => {
  try {
    // No mock workers data
    res.json({ workers: [] });
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard analytics
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // No mock analytics
    res.json({ userGrowth: [], jobStats: { posted: 0, completed: 0, inProgress: 0, cancelled: 0 }, topCategories: [] });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user availability
 */
exports.getUserAvailability = async (req, res, next) => {
  try {
    // No mock availability
    res.json({ status: null, schedule: {}, nextAvailable: null });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user credentials
 */
exports.getUserCredentials = async (req, res, next) => {
  try {
    // No mock credentials
    res.json({ skills: [], licenses: [], certifications: [] });
  } catch (err) {
    next(err);
  }
};
