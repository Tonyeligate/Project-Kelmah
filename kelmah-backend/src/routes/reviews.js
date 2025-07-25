const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const reviewController = require('../controllers/review.controller');

// All review routes require authentication
router.use(authenticateUser);

// Create a review (worker or hirer)
router.post('/', authorizeRoles(['worker','hirer','admin']), reviewController.createReview);

// List all reviews (admin only)
router.get('/', authorizeRoles(['admin']), reviewController.getReviews);

// Get review by ID (participants or admin)
router.get('/:id', authorizeRoles(['worker','hirer','admin']), reviewController.getReviewById);

// Update review by ID (admin only)
router.put('/:id', authorizeRoles(['admin']), reviewController.updateReview);

// Delete review by ID (admin only)
router.delete('/:id', authorizeRoles(['admin']), reviewController.deleteReview);

module.exports = router; 