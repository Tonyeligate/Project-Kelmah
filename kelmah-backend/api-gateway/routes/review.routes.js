/**
 * @deprecated CRIT-11: This file is NOT imported by server.js. All review-service
 * routing is handled via inline proxy config in server.js.  Do NOT edit
 * this file expecting changes to take effect. Scheduled for deletion.
 *
 * Review Service Routes (DEAD CODE)
 * Proxy configuration for review-service endpoints
 */
const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middlewares/auth');

const getServiceUrl = (req) => req.app.get('serviceUrls').REVIEW_SERVICE;

const reviewProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api',
    requireAuth: true,
  });
  return proxy(req, res, next);
};

router.use(authenticate);

// Ratings and reviews proxy
router.get('/ratings/worker/:workerId', reviewProxy);
router.get('/reviews/worker/:workerId', reviewProxy);
router.get('/reviews/:reviewId', reviewProxy);
router.post('/reviews', reviewProxy);

module.exports = router;


