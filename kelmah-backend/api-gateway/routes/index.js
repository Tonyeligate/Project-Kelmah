const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Review Service routes
const reviewServiceProxy = createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
  changeOrigin: true,
  pathRewrite: {
    "^/api/reviews": "/api/reviews"
  }
});

// Register Review Service routes
router.use("/api/reviews", reviewServiceProxy);

module.exports = router;
