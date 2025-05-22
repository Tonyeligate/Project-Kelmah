const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analytics.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Job view tracking
router.post('/job-views/:jobId', analyticsController.trackJobView);
router.put('/job-views/:viewId/duration', analyticsController.updateViewDuration);

// Analytics endpoints (require authentication)
router.get('/job-views/:jobId', authMiddleware, analyticsController.getJobViewAnalytics);
router.get('/popular-skills', analyticsController.getPopularJobSkills);

module.exports = router; 