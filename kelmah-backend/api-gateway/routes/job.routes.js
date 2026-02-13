/**
 * Job Service Routes
 * Direct axios calls to bypass proxy body handling issues
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, optionalAuth } = require('../middlewares/auth');

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

// GET /api/jobs/dashboard - Get dashboard jobs (protected)
router.get('/dashboard', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/dashboard', 'GET');
});

// GET /api/jobs/stats - Get platform stats (public)
router.get('/stats', async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/stats', 'GET');
});

// GET /api/jobs/suggestions - Get search suggestions (public)
router.get('/suggestions', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/suggestions${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/saved - Get saved jobs (protected)
router.get('/saved', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/saved', 'GET');
});

// GET /api/jobs/search/location - Get jobs by location (public geo-search)
router.get('/search/location', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/location${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/location - Get jobs by location (alias, public)
router.get('/location', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/location${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/contracts - Get contracts (public)
// GET /api/jobs/contracts - Get contracts (public)
router.get('/contracts', async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/contracts', 'GET');
});

// GET /api/jobs/contracts/:id - Get contract details (public)
router.get('/contracts/:id', async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/contracts/${req.params.id}`, 'GET');
});

// PUT /api/jobs/contracts/:id - Update contract (protected)
router.put('/contracts/:id', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/contracts/${req.params.id}`, 'PUT');
});

// POST /api/jobs/contracts/:id/disputes - Create dispute (protected)
router.post('/contracts/:id/disputes', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/contracts/${req.params.id}/disputes`, 'POST');
});

// PUT /api/jobs/contracts/:contractId/milestones/:milestoneId/approve - Approve milestone (protected)
router.put('/contracts/:contractId/milestones/:milestoneId/approve', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/contracts/${req.params.contractId}/milestones/${req.params.milestoneId}/approve`, 'PUT');
});

// GET /api/jobs/assigned - Get worker's assigned jobs (protected)
router.get('/assigned', authenticate, async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/assigned${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/applications/me - Get worker's own applications (protected)
router.get('/applications/me', authenticate, async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const path = `/api/jobs/applications/me${queryString ? '?' + queryString : ''}`;
  await forwardToJobService(req, res, path, 'GET');
});

// GET /api/jobs/proposals - Get hirer's proposals (protected)
router.get('/proposals', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/proposals', 'GET');
});

// GET /api/jobs/analytics - Get job analytics (protected, admin)
router.get('/analytics', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/analytics', 'GET');
});

// GET /api/jobs/recommendations - Get recommended jobs (protected)
router.get('/recommendations', authenticate, async (req, res) => {
  await forwardToJobService(req, res, '/api/jobs/recommendations', 'GET');
});

// ===== PARAMETERIZED ROUTES BELOW — /:id must be LAST to avoid shadowing =====

// GET /api/jobs/:id - Get job details (public)
router.get('/:id', optionalAuth, async (req, res) => {
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

// PATCH /api/jobs/:id/status - Update job status (protected)
// ⚠️ Must use PATCH to match job-service handler (not PUT)
router.patch('/:id/status', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/status`, 'PATCH');
});

// POST /api/jobs/:id/publish - Publish job (protected)
router.post('/:id/publish', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/publish`, 'POST');
});

// GET /api/jobs/:id/applications - Get applications for specific job (protected)
router.get('/:id/applications', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/applications`, 'GET');
});

// POST /api/jobs/:id/save - Save job (protected)
router.post('/:id/save', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/save`, 'POST');
});

// DELETE /api/jobs/:id/save - Unsave job (protected)
router.delete('/:id/save', authenticate, async (req, res) => {
  await forwardToJobService(req, res, `/api/jobs/${req.params.id}/save`, 'DELETE');
});

module.exports = router;