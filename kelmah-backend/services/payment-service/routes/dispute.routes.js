/**
 * Dispute Routes
 * Defines the routes for dispute operations
 */

const express = require('express');
const { body } = require('express-validator');
const disputeController = require('../controllers/dispute.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all dispute routes
router.use(protect);

// All dispute routes require authentication
router.use(authenticate);

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ received: true });
});

// Get dispute by ID
router.get('/:id', disputeController.getDispute);

// Get dispute by number
router.get('/by-number/:disputeNumber', disputeController.getDisputeByNumber);

// Add evidence to a dispute
router.post('/:id/evidence', [
  body('evidence').notEmpty().withMessage('Evidence is required'),
  body('submittedBy').notEmpty().withMessage('Submitter ID is required')
], disputeController.addEvidence);

// Add comment to a dispute
router.post('/:id/comments', [
  body('comment').notEmpty().withMessage('Comment is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userType').isIn(['hirer', 'worker', 'moderator', 'admin']).withMessage('Valid user type is required')
], disputeController.addComment);

// Cancel a dispute (can only be done by the creator before it's in review)
router.post('/:id/cancel', [
  body('cancelledBy').notEmpty().withMessage('Canceller ID is required')
], disputeController.cancelDispute);

// Get disputes for users
router.get('/hirer/:hirerId', disputeController.getHirerDisputes);
router.get('/worker/:workerId', disputeController.getWorkerDisputes);

// Admin/moderator-only routes
router.use(restrictTo('admin', 'moderator'));

// Get all disputes (admin/moderator only)
router.get('/', disputeController.getAllDisputes);

// Accept a dispute for review (admin/moderator only)
router.post('/:id/accept', [
  body('moderatorId').notEmpty().withMessage('Moderator ID is required')
], disputeController.acceptDispute);

// Resolve a dispute (admin/moderator only)
router.post('/:id/resolve', [
  body('resolution').isIn(['hirer_favor', 'worker_favor', 'split']).withMessage('Valid resolution type is required'),
  body('moderatorId').notEmpty().withMessage('Moderator ID is required')
], disputeController.resolveDispute);

module.exports = router; 