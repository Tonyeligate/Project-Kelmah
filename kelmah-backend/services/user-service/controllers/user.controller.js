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

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // Mock user profile data
    const profile = {
      id: req.user?.id || "user-kwame-asante-001",
      email: "kwame.asante1@kelmah.test",
      firstName: "Kwame",
      lastName: "Asante",
      fullName: "Kwame Asante",
      role: "worker",
      phone: "+233244123456",
      location: {
        country: "Ghana",
        region: "Greater Accra",
        city: "Accra"
      },
      profileImage: "/images/avatars/kwame-asante.jpg",
      bio: "Experienced electrician with 8+ years in residential and commercial electrical work.",
      isVerified: true,
      joinedDate: "2023-01-15",
      lastActive: new Date()
    };
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Mock profile update
    const updatedProfile = {
      ...req.body,
      id: req.user?.id || "user-kwame-asante-001",
      updatedAt: new Date()
    };
    res.json(updatedProfile);
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker profile by ID
 */
exports.getWorkerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Mock worker profile data
    const worker = {
      id,
      email: "kwame.asante1@kelmah.test",
      firstName: "Kwame",
      lastName: "Asante",
      fullName: "Kwame Asante",
      role: "worker",
      phone: "+233244123456",
      location: {
        country: "Ghana",
        region: "Greater Accra",
        city: "Accra",
        address: "123 Independence Avenue"
      },
      profileImage: "/images/avatars/kwame-asante.jpg",
      bio: "Experienced electrician with 8+ years in residential and commercial electrical work.",
      skills: ["Electrical Installation", "Circuit Repair", "Solar Panel Installation"],
      experience: "8+ years",
      hourlyRate: 50,
      rating: 4.8,
      completedJobs: 156,
      responseTime: "2 hours",
      isVerified: true,
      isAvailable: true,
      joinedDate: "2023-01-15",
      lastActive: new Date()
    };
    res.json(worker);
  } catch (err) {
    next(err);
  }
};

/**
 * Get workers list
 */
exports.getWorkers = async (req, res, next) => {
  try {
    // Mock workers data
    const workers = [
      {
        id: "user-kwame-asante-001",
        firstName: "Kwame",
        lastName: "Asante",
        profession: "Electrician",
        rating: 4.8,
        hourlyRate: 50,
        location: "Accra, Ghana",
        profileImage: "/images/avatars/kwame-asante.jpg",
        isAvailable: true,
        skills: ["Electrical Installation", "Circuit Repair"]
      },
      {
        id: "user-ama-osei-002",
        firstName: "Ama",
        lastName: "Osei",
        profession: "Plumber",
        rating: 4.6,
        hourlyRate: 45,
        location: "Kumasi, Ghana",
        profileImage: "/images/avatars/ama-osei.jpg",
        isAvailable: true,
        skills: ["Pipe Installation", "Drain Cleaning"]
      }
    ];
    res.json({ workers, total: workers.length });
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker skills
 */
exports.getWorkerSkills = async (req, res, next) => {
  try {
    const skills = [
      { name: "Electrical Installation", level: "Expert", years: 8 },
      { name: "Circuit Repair", level: "Advanced", years: 6 },
      { name: "Solar Panel Installation", level: "Intermediate", years: 3 }
    ];
    res.json(skills);
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker portfolio
 */
exports.getWorkerPortfolio = async (req, res, next) => {
  try {
    const portfolio = [
      {
        id: "project-1",
        title: "Residential Electrical Installation",
        description: "Complete electrical wiring for 3-bedroom house",
        images: ["/images/portfolio/project1-1.jpg", "/images/portfolio/project1-2.jpg"],
        completedDate: "2023-08-15",
        client: "Sarah M."
      },
      {
        id: "project-2",
        title: "Office Building Electrical Upgrade",
        description: "Upgraded electrical systems for commercial office",
        images: ["/images/portfolio/project2-1.jpg"],
        completedDate: "2023-09-20",
        client: "Tech Solutions Ltd"
      }
    ];
    res.json(portfolio);
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker certificates
 */
exports.getWorkerCertificates = async (req, res, next) => {
  try {
    const certificates = [
      {
        id: "cert-1",
        name: "Certified Electrician",
        issuer: "Ghana Institute of Engineers",
        issueDate: "2022-08-20",
        expiryDate: "2024-08-20",
        image: "/images/certificates/cert1.jpg"
      }
    ];
    res.json(certificates);
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker reviews
 */
exports.getWorkerReviews = async (req, res, next) => {
  try {
    const reviews = [
      {
        id: "review-1",
        client: "Sarah Mitchell",
        rating: 5,
        comment: "Excellent work! Very professional and completed on time.",
        date: "2023-09-25",
        project: "Kitchen Electrical Work"
      },
      {
        id: "review-2",
        client: "John Doe",
        rating: 4,
        comment: "Good service, would recommend.",
        date: "2023-08-30",
        project: "Living Room Outlets"
      }
    ];
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

/**
 * Get work history
 */
exports.getWorkHistory = async (req, res, next) => {
  try {
    const history = [
      {
        id: "job-1",
        title: "Kitchen Electrical Installation",
        client: "Sarah Mitchell",
        status: "completed",
        completedDate: "2023-09-25",
        amount: 1200,
        rating: 5
      },
      {
        id: "job-2",
        title: "Office Outlet Installation",
        client: "Tech Solutions Ltd",
        status: "completed",
        completedDate: "2023-08-15",
        amount: 800,
        rating: 4
      }
    ];
    res.json(history);
  } catch (err) {
    next(err);
  }
};

/**
 * Get worker stats
 */
exports.getWorkerStats = async (req, res, next) => {
  try {
    const stats = {
      totalJobs: 156,
      completedJobs: 142,
      inProgressJobs: 2,
      cancelledJobs: 12,
      avgRating: 4.8,
      totalEarnings: 125400,
      responseRate: 95,
      onTimeDelivery: 98
    };
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * Search workers
 */
exports.searchWorkers = async (req, res, next) => {
  try {
    const { q, skills, location, minRating } = req.query;
    
    // Mock search results
    const results = [
      {
        id: "user-kwame-asante-001",
        firstName: "Kwame",
        lastName: "Asante",
        profession: "Electrician",
        rating: 4.8,
        hourlyRate: 50,
        location: "Accra, Ghana",
        profileImage: "/images/avatars/kwame-asante.jpg",
        isAvailable: true,
        skills: ["Electrical Installation", "Circuit Repair"]
      }
    ];
    
    res.json({ workers: results, total: results.length });
  } catch (err) {
    next(err);
  }
};
