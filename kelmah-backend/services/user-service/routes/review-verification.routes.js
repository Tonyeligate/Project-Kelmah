const express = require('express');
const router = express.Router();
const reviewVerificationController = require('../controllers/review-verification.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin-auth');

/**
 * @route POST /api/reviews/verify/:reviewId
 * @desc Create verification for a review (automatically triggered when review is created)
 * @access Private
 */
router.post('/verify/:reviewId', auth, reviewVerificationController.verifyReview);

/**
 * @route GET /api/reviews/verify/:reviewId
 * @desc Get verification details for a review
 * @access Private
 */
router.get('/verify/:reviewId', auth, reviewVerificationController.getVerificationDetails);

/**
 * @route GET /api/admin/reviews/verification
 * @desc Get reviews requiring verification (admin dashboard)
 * @access Admin
 */
router.get('/admin/verification', adminAuth, reviewVerificationController.getReviewsRequiringVerification);

/**
 * @route PUT /api/admin/reviews/verification/:verificationId
 * @desc Manually verify or reject a review (admin action)
 * @access Admin
 */
router.put('/admin/verification/:verificationId', adminAuth, reviewVerificationController.manuallyVerifyReview);

/**
 * @route GET /api/admin/reviews/verification/stats
 * @desc Get verification stats for admin dashboard
 * @access Admin
 */
router.get('/admin/verification/stats', adminAuth, reviewVerificationController.getVerificationStats);

module.exports = router; 