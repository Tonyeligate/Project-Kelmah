const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all assessments
router.get('/assessments', assessmentController.getAssessments);

// Start a new assessment
router.post('/assessments/start', assessmentController.startAssessment);

// Submit assessment answers
router.post('/assessments/submit', assessmentController.submitAssessment);

module.exports = router; 