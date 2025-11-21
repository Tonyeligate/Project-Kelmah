/**
 * Job Service Routes
 * Direct axios calls to bypass proxy body handling issues
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middlewares/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').JOB_SERVICE;

// Helper to forward requests directly to job service
const forwardToJobService = async (req, res, path, method = 'GET') => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}${path}`;

    console.log(`[JOB DIRECT] ${method} ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id || '',
        'User-Agent': 'kelmah-api-gateway',
      },
      timeout: 30000,
      validateStatus: () => true,
    };

    // Add authentication headers if user is authenticated
    if (req.user) {
      config.headers['x-authenticated-user'] = JSON.stringify(req.user);
      config.headers['x-auth-source'] = 'api-gateway';
    }

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      config.data = req.body;
    }

    const response = await axios(config);
    
    console.log(`[JOB DIRECT] Response: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[JOB DIRECT] Error:`, error.message);
    res.status(504).json({
      success: false,
      message: 'Job service temporarily unavailable',
      error: error.message
    });
  }
};

// POST /api/jobs - Create job (protected)
router.post('/', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs', 'POST');
});

// GET /api/jobs - List jobs (public)
router.get('/', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/search - Search jobs (public)
router.get('/search', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/search${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/categories - Get categories (public)
router.get('/categories', async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/categories', 'GET');
});

// GET /api/jobs/my-jobs - Get user's jobs (protected)
router.get('/my-jobs', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/my-jobs', 'GET');
});

// GET /api/jobs/:id - Get job details (public)
router.get('/:id', async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}`, 'GET');
});

// PUT /api/jobs/:id - Update job (protected)
router.put('/:id', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}`, 'PUT');
});

// DELETE /api/jobs/:id - Delete job (protected)
router.delete('/:id', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}`, 'DELETE');
});

// POST /api/jobs/:id/apply - Apply to job (protected)
router.post('/:id/apply', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/apply`, 'POST');
});

// PUT /api/jobs/:id/status - Update job status (protected)
router.put('/:id/status', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/status`, 'PUT');
});

// POST /api/jobs/:id/publish - Publish job (protected)
router.post('/:id/publish', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/publish`, 'POST');
});

// GET /api/jobs/:id/applications - Get applications (protected)
router.get('/:id/applications', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/applications`, 'GET');
});

module.exports = router;
router.post('/:jobId/save', jobProxy); // Save job
router.delete('/:jobId/save', jobProxy); // Unsave job

// Job recommendations
router.get('/recommendations', jobProxy); // Get recommended jobs

module.exports = router;