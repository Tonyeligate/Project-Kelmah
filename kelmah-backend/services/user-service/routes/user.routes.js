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
  getUserProfile,
  updateUserProfile,
  toggleBookmark,
  getEarnings,
  getBookmarks,
  cleanupDatabase,
} = require("../controllers/user.controller");
const WorkerController = require('../controllers/worker.controller');

// User CRUD routes
router.get("/", getAllUsers);
router.post("/", createLimiter('admin'), createUser);

// Dashboard routes - Protected with gateway authentication
router.get("/dashboard/metrics", verifyGatewayRequest, getDashboardMetrics);
router.get("/dashboard/workers", verifyGatewayRequest, getDashboardWorkers);
router.get("/dashboard/analytics", verifyGatewayRequest, getDashboardAnalytics);

// Database cleanup endpoint (development/admin use)
router.post("/database/cleanup", cleanupDatabase);

// 🔥 FIX: Recent jobs route MUST come BEFORE parameterized routes
// to prevent "/workers/jobs" being matched as "/workers/:id" where id="jobs"
router.get("/workers/jobs/recent", verifyGatewayRequest, (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/jobs/recent route hit:', {
    query: req.query,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getRecentJobs);

// 🔥 FIX: Worker search and list routes MUST come BEFORE parameterized /:id routes
// to prevent "/workers/search" being matched as "/workers/:id" where id="search"
router.get('/workers/search', (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/search route hit:', {
    query: req.query,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.searchWorkers);

router.get('/workers', (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers route hit:', {
    query: req.query,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getAllWorkers);

router.get('/workers/:id', (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/:id route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getWorkerById);

// Worker-specific parameterized routes (MUST be after specific routes like /search)
router.get("/workers/debug/models", verifyGatewayRequest, (req, res) => {
  const modelsModule = require('../models');
  res.json({
    success: true,
    debug: {
      User: !!modelsModule.User,
      WorkerProfile: !!modelsModule.WorkerProfile,
      Portfolio: !!modelsModule.Portfolio,
      Availability: !!modelsModule.Availability,
      Certificate: !!modelsModule.Certificate,
      Bookmark: !!modelsModule.Bookmark,
      connectionState: require('mongoose').connection.readyState,
      connectionStates: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }
    }
  });
});

router.get("/workers/:id/availability", verifyGatewayRequest, (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/:id/availability route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getWorkerAvailability);

router.get("/workers/:id/completeness", verifyGatewayRequest, (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/:id/completeness route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getProfileCompletion);
router.post('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.delete('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.get('/workers/:workerId/earnings', verifyGatewayRequest, getEarnings);

// User profile routes
router.get('/profile', verifyGatewayRequest, getUserProfile);
router.put('/profile', verifyGatewayRequest, updateUserProfile);
router.get("/me/availability", verifyGatewayRequest, getUserAvailability);
router.get("/me/credentials", verifyGatewayRequest, getUserCredentials);

// User bookmarks
router.get('/bookmarks', verifyGatewayRequest, getBookmarks);

module.exports = router;
