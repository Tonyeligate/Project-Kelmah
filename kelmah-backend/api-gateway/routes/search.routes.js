/**
 * Search Routes
 * Proxy minimal search endpoints to the job-service until dedicated search-service exists.
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');

const getJobServiceUrl = (req) => req.app.get('serviceUrls').JOB_SERVICE;

const publicJobSearchProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getJobServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: false,
    pathRewrite: (path) => {
      let normalized = path;
      while (normalized.includes('//')) {
        normalized = normalized.replace('//', '/');
      }
      if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
      }
      if (normalized.includes('?') && !normalized.includes('/?')) {
        normalized = normalized.replace('?', '/?');
      }
      return normalized;
    }
  });
  return proxy(req, res, next);
};

router.get('/suggestions', publicJobSearchProxy);

module.exports = router;
