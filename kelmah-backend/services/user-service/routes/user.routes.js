const express = require("express");
const router = express.Router();

// Minimal auth (trust gateway) – verify presence of Bearer for protected ops
const { authenticate, validateAvailabilityPayload } = require('../middlewares/auth');
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
} = require("../controllers/user.controller");
const WorkerController = require('../controllers/worker.controller');

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createLimiter('admin'), createUser);

// Dashboard routes
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/workers", getDashboardWorkers);
router.get("/dashboard/analytics", getDashboardAnalytics);

// User profile routes
router.get("/me/availability", getUserAvailability);
router.get("/me/credentials", getUserCredentials);

// Worker search & bookmarks (Phase 2)
router.get('/workers/search', WorkerController.searchWorkers);
// Nearby workers using 2dsphere if available (MVP via job service-style bounds fallback)
router.post('/workers/nearby', WorkerController.getNearbyWorkers);
router.get('/workers', WorkerController.getAllWorkers);
router.get('/workers/:id', WorkerController.getWorkerById);
router.put('/workers/:id', authenticate, createLimiter('reviews'), WorkerController.createOrUpdateProfile);
router.get('/workers/:id/availability', WorkerController.getAvailability);
router.put('/workers/:id/availability', authenticate, createLimiter('messaging'), validateAvailabilityPayload, WorkerController.updateAvailability);
router.get('/workers/:id/completeness', authenticate, WorkerController.getProfileCompleteness);
router.get('/workers/:id/skills', WorkerController.getSkills);
router.post('/workers/:id/skills', authenticate, createLimiter('reviews'), WorkerController.addSkill);
router.put('/workers/:id/skills/:skillId', authenticate, createLimiter('reviews'), WorkerController.updateSkill);
router.delete('/workers/:id/skills/:skillId', authenticate, createLimiter('reviews'), WorkerController.deleteSkill);
router.get('/workers/:workerId/stats', WorkerController.getStats);

// Duplicate routes (cleanup) — already defined above; keeping single source of truth

// Placeholder bookmark toggle (requires controller/DB impl)
router.post('/workers/:id/bookmark', authenticate, createLimiter('default'), toggleBookmark);
router.delete('/workers/:id/bookmark', authenticate, createLimiter('default'), toggleBookmark);
router.get('/bookmarks', authenticate, getBookmarks);
router.get('/workers/:workerId/earnings', authenticate, getEarnings);

module.exports = router;
