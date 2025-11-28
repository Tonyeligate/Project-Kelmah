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
  getProfileStatistics,
  getProfileActivity,
  getProfilePreferences,
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
const workerDetailRouter = require('./worker-detail.routes');

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

// 🔥 FIX: Add PUT route for worker profile updates
router.put('/workers/:id', verifyGatewayRequest, (req, res, next) => {
  console.log('✅ [USER-ROUTES] PUT /workers/:id route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.updateWorkerProfile);

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

router.get("/workers/:id/availability", optionalGatewayVerification, (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/:id/availability route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getWorkerAvailability);

router.get("/workers/:id/completeness", optionalGatewayVerification, (req, res, next) => {
  console.log('✅ [USER-ROUTES] /workers/:id/completeness route hit:', {
    workerId: req.params.id,
    fullPath: req.originalUrl
  });
  next();
}, WorkerController.getProfileCompletion);

// Worker sub-resource routes (public reads, protected mutations)
router.get('/workers/:workerId/skills', optionalGatewayVerification, WorkerController.getWorkerSkills);
router.post('/workers/:workerId/skills', verifyGatewayRequest, createLimiter('default'), WorkerController.createWorkerSkill);
router.put('/workers/:workerId/skills/:skillId', verifyGatewayRequest, createLimiter('default'), WorkerController.updateWorkerSkill);
router.delete('/workers/:workerId/skills/:skillId', verifyGatewayRequest, createLimiter('default'), WorkerController.deleteWorkerSkill);

router.get('/workers/:workerId/work-history', optionalGatewayVerification, WorkerController.getWorkerWorkHistory);
router.post('/workers/:workerId/work-history', verifyGatewayRequest, createLimiter('default'), WorkerController.addWorkHistoryEntry);
router.put('/workers/:workerId/work-history/:entryId', verifyGatewayRequest, createLimiter('default'), WorkerController.updateWorkHistoryEntry);
router.delete('/workers/:workerId/work-history/:entryId', verifyGatewayRequest, createLimiter('default'), WorkerController.deleteWorkHistoryEntry);

router.get('/workers/:workerId/portfolio', optionalGatewayVerification, WorkerController.getWorkerPortfolio);
router.post(
  '/workers/:workerId/portfolio',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.createWorkerPortfolioItem,
);
router.put(
  '/workers/:workerId/portfolio/:portfolioId',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.updateWorkerPortfolioItem,
);
router.delete(
  '/workers/:workerId/portfolio/:portfolioId',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.deleteWorkerPortfolioItem,
);

router.get('/workers/:workerId/certificates', optionalGatewayVerification, WorkerController.getWorkerCertificates);
router.post(
  '/workers/:workerId/certificates',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.addWorkerCertificate,
);
router.put(
  '/workers/:workerId/certificates/:certificateId',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.updateWorkerCertificate,
);
router.delete(
  '/workers/:workerId/certificates/:certificateId',
  verifyGatewayRequest,
  createLimiter('default'),
  WorkerController.deleteWorkerCertificate,
);

router.post('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.delete('/workers/:id/bookmark', verifyGatewayRequest, createLimiter('default'), toggleBookmark);
router.get('/workers/:workerId/earnings', verifyGatewayRequest, getEarnings);

// Worker nested resources (skills, certificates, work history, portfolio, analytics)
router.use('/workers/:workerId', workerDetailRouter);

// User profile routes
router.get('/profile', verifyGatewayRequest, getUserProfile);
router.put('/profile', verifyGatewayRequest, updateUserProfile);
router.get('/profile/statistics', verifyGatewayRequest, getProfileStatistics);
router.get('/profile/activity', verifyGatewayRequest, getProfileActivity);
router.get('/profile/preferences', verifyGatewayRequest, getProfilePreferences);
router.get("/me/availability", verifyGatewayRequest, getUserAvailability);
router.get("/me/credentials", verifyGatewayRequest, getUserCredentials);

// User bookmarks
router.get('/bookmarks', verifyGatewayRequest, getBookmarks);

module.exports = router;
