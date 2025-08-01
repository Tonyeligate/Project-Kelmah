const express = require("express");
const router = express.Router();

// Import controllers for user operations
const { 
  getAllUsers, 
  createUser,
  getDashboardMetrics,
  getDashboardWorkers,
  getDashboardAnalytics,
  getUserAvailability,
  getUserCredentials,
  getUserProfile,
  updateUserProfile,
  getWorkerProfile,
  getWorkers,
  getWorkerSkills,
  getWorkerPortfolio,
  getWorkerCertificates,
  getWorkerReviews,
  getWorkHistory,
  getWorkerStats,
  searchWorkers
} = require("../controllers/user.controller");

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createUser);

// Dashboard routes
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/workers", getDashboardWorkers);
router.get("/dashboard/analytics", getDashboardAnalytics);

// User profile routes
router.get("/me", getUserProfile);
router.put("/me", updateUserProfile);
router.get("/me/availability", getUserAvailability);
router.get("/me/credentials", getUserCredentials);

// Worker-specific routes
router.get("/workers", getWorkers);
router.get("/workers/search", searchWorkers);
router.get("/workers/:id", getWorkerProfile);
router.get("/workers/:id/skills", getWorkerSkills);
router.get("/workers/:id/portfolio", getWorkerPortfolio);
router.get("/workers/:id/certificates", getWorkerCertificates);
router.get("/workers/:id/reviews", getWorkerReviews);
router.get("/workers/:id/history", getWorkHistory);
router.get("/workers/:id/availability", getUserAvailability);
router.get("/workers/:id/stats", getWorkerStats);

// Generic user routes
router.get("/:id", getWorkerProfile);

module.exports = router;
