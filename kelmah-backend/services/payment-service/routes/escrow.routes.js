/**
 * Escrow Routes
 * Defines the routes for escrow operations
 */

const express = require('express');
const { body } = require('express-validator');
const escrowController = require('../controllers/escrow.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all escrow routes
router.use(protect);

// All escrow routes require authentication
router.use(authenticate);

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ received: true });
});

// Create a new escrow
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('hirerId').notEmpty().withMessage('Hirer ID is required'),
  body('workerId').notEmpty().withMessage('Worker ID is required')
], escrowController.createEscrow);

// Get escrow by ID
router.get('/:id', escrowController.getEscrow);

// Get escrow by number
router.get('/by-number/:escrowNumber', escrowController.getEscrowByNumber);

// Fund an escrow
router.post('/:id/fund', escrowController.fundEscrow);

// Release funds from an escrow
router.post('/:id/release', escrowController.releaseEscrow);

// Refund an escrow
router.post('/:id/refund', escrowController.refundEscrow);

// Cancel an escrow
router.post('/:id/cancel', escrowController.cancelEscrow);

// Update an escrow (before funding)
router.patch('/:id', escrowController.updateEscrow);

// Create a dispute for an escrow
router.post('/:id/disputes', [
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('requestedBy').notEmpty().withMessage('Requester ID is required')
], escrowController.createDispute);

// Get disputes for an escrow
router.get('/:id/disputes', escrowController.getEscrowDisputes);

// Get escrows for entities
router.get('/job/:jobId', escrowController.getJobEscrows);
router.get('/contract/:contractId', escrowController.getContractEscrows);

// Get user escrows
router.get('/hirer/:hirerId', escrowController.getHirerEscrows);
router.get('/worker/:workerId', escrowController.getWorkerEscrows);

// Admin-only routes
router.use(restrictTo('admin'));
// Add admin-specific routes here if needed

module.exports = router; 