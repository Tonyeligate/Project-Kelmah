/**
 * Job Service Routes
 * Proxy configuration for job-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middlewares/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').JOB_SERVICE;

// Job proxy middleware
const jobProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: true,
    pathRewrite: (path) => {
      console.log(`[JOB PROXY] Original path: ${path}`);
      // Remove double slashes
      let normalized = path.replace(/\/\/+/g, '/');
      console.log(`[JOB PROXY] After double slash removal: ${normalized}`);
      // ADD slash before query string if missing!
      // Frontend sends: /api/jobs?query
      // We need: /api/jobs/?query
      // So Express strips /api/jobs and leaves /?query (with leading slash for route matching)
      if (normalized.includes('?') && !normalized.includes('/?')) {
        normalized = normalized.replace('?', '/?');
      }
      console.log(`[JOB PROXY] Final path: ${normalized}`);
      return normalized;
    }
  });
  return proxy(req, res, next);
};

// Public job routes (browsing without auth)
const publicJobProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: false,
    pathRewrite: (path) => {
      console.log(`[PUBLIC JOB PROXY] Original path: ${path}`);
      // Remove double slashes
      let normalized = path.replace(/\/\/+/g, '/');
      console.log(`[PUBLIC JOB PROXY] After double slash removal: ${normalized}`);
      // ADD slash before query string if missing!
      // Frontend sends: /api/jobs?query
      // We need: /api/jobs/?query
      // So Express strips /api/jobs and leaves /?query (with leading slash for route matching)
      if (normalized.includes('?') && !normalized.includes('/?')) {
        normalized = normalized.replace('?', '/?');
      }
      console.log(`[PUBLIC JOB PROXY] Final path: ${normalized}`);
      return normalized;
    }
  });
  return proxy(req, res, next);
};

<<<<<<< Updated upstream
// Public routes - job browsing (NO AUTH REQUIRED)
router.get('', publicJobProxy); // Handle /api/jobs without trailing slash
router.get('/public', publicJobProxy); // Browse jobs without login (legacy)
router.get('/public/:jobId', publicJobProxy); // View job details without login (legacy)
router.get('/categories', publicJobProxy); // Get job categories
router.get('/search', publicJobProxy); // Search jobs
router.get('/', publicJobProxy); // ⚠️ FIX: Browse jobs list publicly (main homepage)
router.get('/:jobId([0-9a-fA-F]{24})', publicJobProxy); // ⚠️ FIX: View job details publicly (MongoDB ObjectId pattern)
=======
// Public routes - job browsing
router.get('/', publicJobProxy); // Browse jobs without login
router.get('/search', publicJobProxy); // Search jobs
router.get('/categories', publicJobProxy); // Get job categories
router.get('/public', publicJobProxy); // Legacy alias for browsing without login
router.get('/public/:jobId', publicJobProxy); // Legacy alias for viewing job details without login
router.get('/:jobId([a-fA-F0-9]{24})', publicJobProxy); // View job details without login
>>>>>>> Stashed changes

// All other routes require authentication
router.use(authenticate);

// Job CRUD operations (PROTECTED)
router.post('/', jobProxy); // Create new job
router.get('/my-jobs', jobProxy); // Hirer: my jobs
router.put('/:jobId', jobProxy); // Update job
router.delete('/:jobId', jobProxy); // Delete job

// Job status management
router.put('/:jobId/status', jobProxy); // Backward-compat: Update job status
router.patch('/:jobId/status', jobProxy); // Canonical: Update job status
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

// Contracts (ensure present for hirer flow)
router.get('/:jobId/contract', jobProxy);
router.post('/:jobId/contract', jobProxy);
router.put('/:jobId/contract', jobProxy);

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