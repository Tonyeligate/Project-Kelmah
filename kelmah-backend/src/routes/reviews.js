const express = require('express');
const { validate } = require('../middlewares/validator');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const reviewController = require('../controllers/review.controller');
const reviewValidation = require('../validations/review.validation');

const router = express.Router();

// Protected route: create review (hirer only)
router.post(
  '/',
  authenticateUser,
  authorizeRoles('hirer'),
  validate(reviewValidation.createReview),
  reviewController.createReview
);

// Public route: get reviews for a worker
router.get(
  '/worker/:id',
  reviewController.getReviewsForWorker
);

// Protected route: get my reviews
router.get(
  '/me',
  authenticateUser,
  reviewController.getMyReviews
);

module.exports = router; 