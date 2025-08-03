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
  getUserCredentials
} = require("../controllers/user.controller");

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createUser);

// Dashboard routes
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/workers", getDashboardWorkers);
router.get("/dashboard/analytics", getDashboardAnalytics);

// User profile routes
router.get("/me/availability", getUserAvailability);
router.get("/me/credentials", getUserCredentials);

module.exports = router;
