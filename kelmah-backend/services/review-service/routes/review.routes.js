const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const ratingController = require('../controllers/rating.controller');
const analyticsController = require('../controllers/analytics.controller');
const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');

// ==================== REVIEW ROUTES ====================

// Submit a new review (authenticated)
router.post('/', verifyGatewayRequest, reviewController.submitReview);

// Get reviews for a specific worker (public)
router.get('/worker/:workerId', reviewController.getWorkerReviews);

// Get reviews for a specific job (public)
router.get('/job/:jobId', reviewController.getJobReviews);

// Get reviews authored by a specific user (public)
router.get('/user/:userId', reviewController.getUserReviews);

// Get specific review details (public)
router.get('/:reviewId', reviewController.getReview);

// Worker response to a review (authenticated)
router.put('/:reviewId/response', verifyGatewayRequest, reviewController.addReviewResponse);

// Vote review as helpful (authenticated)
router.post('/:reviewId/helpful', verifyGatewayRequest, reviewController.voteHelpful);

// Report review (authenticated)
router.post('/:reviewId/report', verifyGatewayRequest, reviewController.reportReview);

// ==================== RATING ROUTES ====================

// Get worker rating summary (public)
router.get('/ratings/worker/:workerId', ratingController.getWorkerRating);

// Lightweight ranking signals endpoint (public, for search service)
router.get('/ratings/worker/:workerId/signals', ratingController.getWorkerRankSignals);

// ==================== ANALYTICS ROUTES ====================

// Get review analytics (admin only)
router.get('/analytics', verifyGatewayRequest, analyticsController.getReviewAnalytics);

// Admin: Moderate review
router.put('/:reviewId/moderate', verifyGatewayRequest, analyticsController.moderateReview);

module.exports = router;