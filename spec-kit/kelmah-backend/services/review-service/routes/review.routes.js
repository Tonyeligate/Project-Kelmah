const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const ratingController = require('../controllers/rating.controller');
const analyticsController = require('../controllers/analytics.controller');

// Import middleware (will be added when server.js is refactored)
// const { verifyGatewayRequest } = require('../middlewares/auth');
// const { reviewRateLimit, adminLimiter } = require('../middlewares/rateLimit');

// ==================== REVIEW ROUTES ====================

// Submit a new review
router.post('/', /* reviewRateLimit, verifyGatewayRequest, */ reviewController.submitReview);

// Get reviews for a specific worker
router.get('/worker/:workerId', reviewController.getWorkerReviews);

// Get reviews for a specific job
router.get('/job/:jobId', reviewController.getJobReviews);

// Get reviews authored by a specific user
router.get('/user/:userId', reviewController.getUserReviews);

// Get specific review details
router.get('/:reviewId', reviewController.getReview);

// Worker response to a review
router.put('/:reviewId/response', /* verifyGatewayRequest, */ reviewController.addReviewResponse);

// Vote review as helpful
router.post('/:reviewId/helpful', /* verifyGatewayRequest, */ reviewController.voteHelpful);

// Report review
router.post('/:reviewId/report', /* verifyGatewayRequest, */ reviewController.reportReview);

// ==================== RATING ROUTES ====================

// Get worker rating summary
router.get('/ratings/worker/:workerId', ratingController.getWorkerRating);

// Lightweight ranking signals endpoint (for search service)
router.get('/ratings/worker/:workerId/signals', ratingController.getWorkerRankSignals);

// ==================== ANALYTICS ROUTES ====================

// Get review analytics (admin only)
router.get('/analytics', /* verifyGatewayRequest, */ analyticsController.getReviewAnalytics);

// Admin: Moderate review
router.put('/:reviewId/moderate', /* verifyGatewayRequest, adminLimiter, */ analyticsController.moderateReview);

module.exports = router;