const express = require("express");
const router = express.Router();

// Service trust middleware - verify requests from API Gateway
const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');
const { validateAvailabilityPayload } = require('../middlewares/auth');
// Rate limiter - simple implementation for user service
const createLimiter = (options) => (req, res, next) => next(); // Simplified for containerized deployment

// Import controllers for user operations
const {
  getAllUsers,
  createUser,
  getDashboardMetrics,
  getDashboardWorkers,
  getDashboardAnalytics,
  getUserAvailability,
  getUserCredentials,
  toggleBookmark,
  getEarnings,
  getBookmarks,
  cleanupDatabase,
} = require("../controllers/user.controller");
const WorkerController = require('../controllers/worker.controller');

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createLimiter('admin'), createUser);

// Dashboard routes
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/workers", getDashboardWorkers);
router.get("/dashboard/analytics", getDashboardAnalytics);

// Database cleanup endpoint (development/admin use)
router.post("/database/cleanup", cleanupDatabase);

// 🔥 FIX: Recent jobs route MUST come BEFORE parameterized routes
// to prevent "/workers/jobs" being matched as "/workers/:id" where id="jobs"
router.get("/workers/jobs/recent", WorkerController.getRecentJobs);

// Worker-specific routes that need to be under /api/users path
router.get("/workers/:id/availability", WorkerController.getWorkerAvailability);
router.get("/workers/:id/completeness", WorkerController.getProfileCompletion);

// User profile routes
router.get("/me/availability", getUserAvailability);
router.get("/me/credentials", getUserCredentials);

// Worker search & bookmarks (Phase 2)
router.get('/workers/search', WorkerController.searchWorkers);
router.get('/workers', WorkerController.getAllWorkers);

// Duplicate routes (cleanup) — already defined above; keeping single source of truth

// Placeholder bookmark toggle (requires controller/DB impl)
router.post('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.delete('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.get('/bookmarks', verifyGatewayRequest, getBookmarks);
router.get('/workers/:workerId/earnings', verifyGatewayRequest, getEarnings);

module.exports = router;
