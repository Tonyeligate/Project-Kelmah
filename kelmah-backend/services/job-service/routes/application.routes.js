/**
 * Application Routes
 * API routes for job application operations
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const { roleCheck } = require('../../../middleware/roleCheck');
const applicationController = require('../controllers/application.controller');

// Public routes (none for applications)

// Protected routes for authenticated users
router.use(auth());

// Worker routes
router.get('/my', roleCheck(['worker']), applicationController.getMyApplications);
router.post('/jobs/:jobId/apply', roleCheck(['worker']), applicationController.createApplication);
router.put('/:id/withdraw', roleCheck(['worker']), applicationController.withdrawApplication);

// Hirer routes
router.get('/job/:jobId', roleCheck(['hirer']), applicationController.getJobApplications);
router.put('/:id/status', roleCheck(['hirer']), applicationController.updateApplicationStatus);

// Shared routes
router.get('/:id', roleCheck(['worker', 'hirer']), applicationController.getApplicationById);

module.exports = router; 