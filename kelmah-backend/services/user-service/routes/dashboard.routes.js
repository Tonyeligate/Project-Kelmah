/**
 * Dashboard Routes
 * Handles API routes for the worker dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const jobApplicationController = require('../controllers/job-application.controller');
const skillAssessmentController = require('../controllers/skill-assessment.controller');

// Authentication middleware
// In production, this would verify the JWT token
// For development, we're using a simple middleware that adds a mock user to the request
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.query.userId || req.body.userId || 'development-user-id' };
    next();
  }
};

// Dashboard overview
router.get('/stats', authMiddleware.authenticate, dashboardController.getDashboardStats);

// Job applications routes
router.get('/job-applications/worker', authMiddleware.authenticate, jobApplicationController.getWorkerApplications);
router.get('/job-applications/:id', authMiddleware.authenticate, jobApplicationController.getApplicationById);
router.post('/job-applications', authMiddleware.authenticate, jobApplicationController.createApplication);
router.put('/job-applications/:id', authMiddleware.authenticate, jobApplicationController.updateApplication);
router.delete('/job-applications/:id', authMiddleware.authenticate, jobApplicationController.withdrawApplication);
router.get('/job-applications/stats', authMiddleware.authenticate, jobApplicationController.getApplicationStats);

// Worker profile routes
router.get('/worker-profile/skills', authMiddleware.authenticate, dashboardController.getWorkerSkills);
router.get('/worker-profile/assessments', authMiddleware.authenticate, skillAssessmentController.getWorkerAssessments);

// Skill assessments routes
router.get('/assessments', authMiddleware.authenticate, skillAssessmentController.getWorkerAssessments);
router.get('/assessments/:id', authMiddleware.authenticate, skillAssessmentController.getAssessmentById);
router.post('/assessments', authMiddleware.authenticate, skillAssessmentController.scheduleAssessment);
router.put('/assessments/:id/reschedule', authMiddleware.authenticate, skillAssessmentController.rescheduleAssessment);
router.delete('/assessments/:id', authMiddleware.authenticate, skillAssessmentController.cancelAssessment);
router.get('/assessments/stats', authMiddleware.authenticate, skillAssessmentController.getAssessmentStats);

module.exports = router; 