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
    // Mock metrics data
    const metrics = {
      totalUsers: 1250,
      activeWorkers: 89,
      totalJobs: 156,
      completedJobs: 142,
      revenue: 45600,
      growthRate: 12.5
    };
    res.json(metrics);
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard workers
 */
exports.getDashboardWorkers = async (req, res, next) => {
  try {
    // Mock workers data
    const workers = [
      {
        id: 1,
        name: "Kwame Asante",
        profession: "Electrician",
        rating: 4.8,
        availability: "available",
        location: "Accra, Ghana"
      },
      {
        id: 2,
        name: "Ama Osei",
        profession: "Plumber",
        rating: 4.6,
        availability: "busy",
        location: "Kumasi, Ghana"
      }
    ];
    res.json({ workers });
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard analytics
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // Mock analytics data
    const analytics = {
      userGrowth: [
        { month: "Jan", users: 100 },
        { month: "Feb", users: 120 },
        { month: "Mar", users: 150 },
        { month: "Apr", users: 180 },
        { month: "May", users: 220 },
        { month: "Jun", users: 250 }
      ],
      jobStats: {
        posted: 156,
        completed: 142,
        inProgress: 14,
        cancelled: 8
      },
      topCategories: [
        { name: "Electrical", count: 45 },
        { name: "Plumbing", count: 38 },
        { name: "Carpentry", count: 32 },
        { name: "Painting", count: 28 }
      ]
    };
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

/**
 * Get user availability
 */
exports.getUserAvailability = async (req, res, next) => {
  try {
    // Mock availability data
    const availability = {
      status: "available",
      schedule: {
        monday: { start: "08:00", end: "17:00", available: true },
        tuesday: { start: "08:00", end: "17:00", available: true },
        wednesday: { start: "08:00", end: "17:00", available: true },
        thursday: { start: "08:00", end: "17:00", available: true },
        friday: { start: "08:00", end: "17:00", available: true },
        saturday: { start: "09:00", end: "15:00", available: true },
        sunday: { available: false }
      },
      nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };
    res.json(availability);
  } catch (err) {
    next(err);
  }
};

/**
 * Get user credentials
 */
exports.getUserCredentials = async (req, res, next) => {
  try {
    // Mock credentials data
    const credentials = {
      skills: [
        { name: "Electrical Installation", level: "Expert", certified: true },
        { name: "Circuit Repair", level: "Advanced", certified: true },
        { name: "Solar Panel Installation", level: "Intermediate", certified: false }
      ],
      licenses: [
        { 
          type: "Electrical License", 
          issuer: "Ghana Standards Authority",
          number: "EL-2023-001234",
          issueDate: "2023-01-15",
          expiryDate: "2025-01-15",
          status: "active"
        }
      ],
      certifications: [
        {
          name: "Certified Electrician",
          issuer: "Ghana Institute of Engineers",
          issueDate: "2022-08-20",
          validUntil: "2024-08-20"
        }
      ]
    };
    res.json(credentials);
  } catch (err) {
    next(err);
  }
};
