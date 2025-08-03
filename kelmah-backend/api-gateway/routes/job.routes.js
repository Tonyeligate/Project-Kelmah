/**
 * Job Service Routes
 * Proxy configuration for job-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const authenticate = require('../middlewares/auth.middleware');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').JOB_SERVICE;

// Job proxy middleware
const jobProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: true
  });
  return proxy(req, res, next);
};

// Public job routes (browsing without auth)
const publicJobProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: false
  });
  return proxy(req, res, next);
};

// Public routes - job browsing
router.get('/public', publicJobProxy); // Browse jobs without login
router.get('/public/:jobId', publicJobProxy); // View job details without login
router.get('/categories', publicJobProxy); // Get job categories
router.get('/search', publicJobProxy); // Search jobs

// All other routes require authentication
router.use(authenticate);

// Job CRUD operations
router.get('/', jobProxy); // Get jobs (with filters)
router.post('/', jobProxy); // Create new job
router.get('/:jobId', jobProxy); // Get specific job
router.put('/:jobId', jobProxy); // Update job
router.delete('/:jobId', jobProxy); // Delete job

// Job status management
router.put('/:jobId/status', jobProxy); // Update job status
router.post('/:jobId/publish', jobProxy); // Publish job
router.post('/:jobId/close', jobProxy); // Close job
router.post('/:jobId/reopen', jobProxy); // Reopen job

// Job applications
router.get('/:jobId/applications', jobProxy); // Get job applications
router.post('/:jobId/apply', jobProxy); // Apply to job
router.put('/:jobId/applications/:applicationId', jobProxy); // Update application status
router.delete('/:jobId/applications/:applicationId', jobProxy); // Withdraw application

// Job assignments
router.post('/:jobId/assign', jobProxy); // Assign job to worker
router.delete('/:jobId/assign', jobProxy); // Unassign job

// Job milestones
router.get('/:jobId/milestones', jobProxy); // Get job milestones
router.post('/:jobId/milestones', jobProxy); // Create milestone
router.put('/:jobId/milestones/:milestoneId', jobProxy); // Update milestone
router.delete('/:jobId/milestones/:milestoneId', jobProxy); // Delete milestone

// Job contracts
router.get('/:jobId/contract', jobProxy); // Get job contract
router.post('/:jobId/contract', jobProxy); // Create contract
router.put('/:jobId/contract', jobProxy); // Update contract

// Job reviews
router.get('/:jobId/reviews', jobProxy); // Get job reviews
router.post('/:jobId/reviews', jobProxy); // Create review

// Saved jobs (for workers)
router.get('/saved', jobProxy); // Get saved jobs
router.post('/:jobId/save', jobProxy); // Save job
router.delete('/:jobId/save', jobProxy); // Unsave job

// Job recommendations
router.get('/recommendations', jobProxy); // Get recommended jobs

module.exports = router;