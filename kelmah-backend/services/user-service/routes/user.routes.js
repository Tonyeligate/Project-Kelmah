const express = require("express");
const router = express.Router();

// Minimal auth (trust gateway) – verify presence of Bearer for protected ops
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
};

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
router.post("/", createUser);

// Dashboard routes
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/workers", getDashboardWorkers);
router.get("/dashboard/analytics", getDashboardAnalytics);

// User profile routes
router.get("/me/availability", getUserAvailability);
router.get("/me/credentials", getUserCredentials);

// Worker search & bookmarks (Phase 2)
router.get('/workers/search', WorkerController.searchWorkers);
router.get('/workers', WorkerController.getAllWorkers);

// Placeholder bookmark toggle (requires controller/DB impl)
router.post('/workers/:id/bookmark', authenticate, toggleBookmark);
router.get('/bookmarks', authenticate, getBookmarks);
router.get('/workers/:workerId/earnings', authenticate, getEarnings);

module.exports = router;
