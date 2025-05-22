const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/review.controller');
const { authenticateUser } = require('../../middlewares/auth');
const asyncHandler = require('../../middlewares/asyncHandler');

// Create a new review
router.post(
  '/',
  authenticateUser,
  asyncHandler(reviewController.createReview)
);

// Get reviews for a specific user
router.get(
  '/user/:userId',
  asyncHandler(reviewController.getUserReviews)
);

// Get reviews for a specific job
router.get(
  '/job/:jobId',
  asyncHandler(reviewController.getJobReviews)
);

// Get review statistics for a user
router.get(
  '/stats/user/:userId',
  asyncHandler(reviewController.getUserReviewStats)
);

// Update a review
router.put(
  '/:reviewId',
  authenticateUser,
  asyncHandler(reviewController.updateReview)
);

// Delete a review
router.delete(
  '/:reviewId',
  authenticateUser,
  asyncHandler(reviewController.deleteReview)
);

module.exports = router;
