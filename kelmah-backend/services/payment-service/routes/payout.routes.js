/**
 * Payout Routes
 * Defines the routes for payout operations
 */

const express = require('express');
const { body } = require('express-validator');
const payoutController = require('../controllers/payout.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all payout routes
router.use(protect);

// All payout routes require authentication
router.use(authenticate);

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ received: true });
});

// Create a new payout request
router.post('/', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('withdrawalMethod').notEmpty().withMessage('Withdrawal method is required'),
  body('withdrawalDetails').notEmpty().withMessage('Withdrawal details are required')
], payoutController.createPayoutRequest);

// Get payout by ID
router.get('/:id', payoutController.getPayout);

// Get payout by reference
router.get('/by-reference/:payoutReference', payoutController.getPayoutByReference);

// Get all payout requests for a user
router.get('/user/:userId', payoutController.getUserPayouts);

// Get available payout methods for a user
router.get('/methods/:userId', payoutController.getPayoutMethods);

// Cancel a payout request (user can only cancel their own pending requests)
router.post('/:id/cancel', payoutController.cancelPayout);

// Admin-only routes
router.use(restrictTo('admin', 'staff'));

// Get all payouts (admin only)
router.get('/', payoutController.getAllPayouts);

// Approve a payout request (admin/staff only)
router.post('/:id/approve', [
  body('approverId').notEmpty().withMessage('Approver ID is required')
], payoutController.approvePayout);

// Process a payout (admin/staff only)
router.post('/:id/process', [
  body('processedBy').notEmpty().withMessage('Processor ID is required')
], payoutController.processPayout);

// Reject a payout request (admin/staff only)
router.post('/:id/reject', [
  body('rejectedBy').notEmpty().withMessage('Rejector ID is required'),
  body('reason').notEmpty().withMessage('Rejection reason is required')
], payoutController.rejectPayout);

// Mark payout as failed (admin/staff only)
router.post('/:id/fail', [
  body('processedBy').notEmpty().withMessage('Processor ID is required'),
  body('failureReason').notEmpty().withMessage('Failure reason is required')
], payoutController.markPayoutAsFailed);

module.exports = router; 