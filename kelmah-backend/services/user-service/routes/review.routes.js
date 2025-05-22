const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all reviews for a worker
router.get('/:workerId/reviews', reviewController.getWorkerReviews);

// Create a new review
router.post('/:workerId/reviews', reviewController.createReview);

// Update a review
router.put('/reviews/:reviewId', reviewController.updateReview);

// Delete a review
router.delete('/reviews/:reviewId', reviewController.deleteReview);

module.exports = router; 