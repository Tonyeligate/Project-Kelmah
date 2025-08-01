const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateUser);

// Dashboard endpoints
router.get('/overview', dashboardController.getOverview);
router.get('/activity', dashboardController.getActivity);
router.get('/statistics', dashboardController.getStatistics);
router.get('/tasks', dashboardController.getTasks);
router.get('/messages', dashboardController.getMessages);
router.get('/performance', dashboardController.getPerformance);
router.get('/quick-actions', dashboardController.getQuickActions);
router.get('/notifications-summary', dashboardController.getNotificationsSummary);
router.get('/stats', dashboardController.getRealTimeStats);

// New endpoints for front-end fetchDashboardData
router.get('/metrics', dashboardController.getMetrics);
router.get('/jobs', dashboardController.getRecentJobs);
router.get('/workers', dashboardController.getWorkers);
router.get('/analytics', dashboardController.getAnalytics);

// Job matching and recommendations
router.get('/job-matches', dashboardController.getJobMatches);
router.get('/recommendations', dashboardController.getRecommendations);

module.exports = router; 