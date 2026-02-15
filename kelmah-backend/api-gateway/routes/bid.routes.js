/**
 * Bid Service Routes — Gateway proxy to job-service bid endpoints
 * Follows the same direct-forwarding pattern as job.routes.js
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middlewares/auth');

const getServiceUrl = (req) => req.app.get('serviceUrls').JOB_SERVICE;

/**
 * Forward requests to job-service /api/bids/* endpoints
 */
const forwardToBidService = async (req, res, path, method = 'GET') => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}${path}`;

    console.log(`[BID DIRECT] ${method} ${url}`);

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

    if (req.user) {
      config.headers['x-authenticated-user'] = JSON.stringify(req.user);
      config.headers['x-auth-source'] = 'api-gateway';
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      config.data = req.body;
    }

    const response = await axios(config);
    console.log(`[BID DIRECT] Response: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[BID DIRECT] Error:`, error.message);
    res.status(504).json({
      success: false,
      message: 'Bid service temporarily unavailable',
      error: error.message,
    });
  }
};

// POST /api/bids — Create a new bid (worker only)
router.post('/', authenticate, async (req, res) => {
  await forwardToBidService(req, res, '/api/bids', 'POST');
});

// GET /api/bids/job/:jobId — List all bids for a job (hirer/admin)
router.get('/job/:jobId', authenticate, async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const path = `/api/bids/job/${req.params.jobId}${qs ? '?' + qs : ''}`;
  await forwardToBidService(req, res, path, 'GET');
});

// GET /api/bids/worker/:workerId — List bids by a worker (own/admin)
router.get('/worker/:workerId', authenticate, async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const path = `/api/bids/worker/${req.params.workerId}${qs ? '?' + qs : ''}`;
  await forwardToBidService(req, res, path, 'GET');
});

// GET /api/bids/stats/worker/:workerId — Worker bid stats (own/admin)
router.get('/stats/worker/:workerId', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/stats/worker/${req.params.workerId}`, 'GET');
});

// GET /api/bids/expired — List expired bids (admin)
router.get('/expired', authenticate, async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  await forwardToBidService(req, res, `/api/bids/expired${qs ? '?' + qs : ''}`, 'GET');
});

// GET /api/bids/:bidId — Get a single bid by ID
router.get('/:bidId', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/${req.params.bidId}`, 'GET');
});

// PATCH /api/bids/:bidId/accept — Accept a bid (hirer)
router.patch('/:bidId/accept', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/${req.params.bidId}/accept`, 'PATCH');
});

// PATCH /api/bids/:bidId/reject — Reject a bid (hirer)
router.patch('/:bidId/reject', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/${req.params.bidId}/reject`, 'PATCH');
});

// PATCH /api/bids/:bidId/withdraw — Withdraw own bid (worker)
router.patch('/:bidId/withdraw', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/${req.params.bidId}/withdraw`, 'PATCH');
});

// PATCH /api/bids/:bidId/modify — Modify a pending bid (worker)
router.patch('/:bidId/modify', authenticate, async (req, res) => {
  await forwardToBidService(req, res, `/api/bids/${req.params.bidId}/modify`, 'PATCH');
});

// PATCH /api/bids/cleanup/expired — Mark expired bids (admin)
router.patch('/cleanup/expired', authenticate, async (req, res) => {
  await forwardToBidService(req, res, '/api/bids/cleanup/expired', 'PATCH');
});

module.exports = router;
