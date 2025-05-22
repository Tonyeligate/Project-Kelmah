const express = require('express');
const router = express.Router();

// Import API routes
const reviewRoutes = require('./api/review.routes');

// Set up API routes
router.use('/api/reviews', reviewRoutes);

module.exports = router;
