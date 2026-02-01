/**
 * QuickJob Routes - Protected Quick-Hire System
 * Routes for quick job operations
 */

const express = require('express');
const router = express.Router();
const quickJobController = require('../controllers/quickJobController');
const quickJobPaymentController = require('../controllers/quickJobPaymentController');
const disputeController = require('../controllers/disputeController');
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');

// ============================================
// PUBLIC ROUTES (webhook - no auth)
// ============================================

// Paystack webhook (must be before auth middleware)
router.post('/payment/webhook', quickJobPaymentController.handlePaystackWebhook);

// ============================================
// AUTHENTICATED ROUTES (via API Gateway)
// ============================================

// ---- Specific literal routes FIRST ----

// Get jobs nearby (workers)
router.get('/nearby', verifyGatewayRequest, quickJobController.getNearbyQuickJobs);

// Get client's own jobs
router.get('/my-jobs', verifyGatewayRequest, quickJobController.getMyQuickJobs);

// Get jobs where worker has quoted
router.get('/my-quotes', verifyGatewayRequest, quickJobController.getMyQuotedJobs);

// Payment verification (specific route)
router.get('/payment/verify/:reference', verifyGatewayRequest, quickJobPaymentController.verifyPayment);

// Dispute routes (admin - specific routes first)
router.get('/disputes', verifyGatewayRequest, disputeController.getAllDisputes);
router.get('/disputes/stats', verifyGatewayRequest, disputeController.getDisputeStats);

// Create new QuickJob
router.post('/', verifyGatewayRequest, quickJobController.createQuickJob);

// ---- Parameterized routes LAST ----

// Get single QuickJob
router.get('/:id', verifyGatewayRequest, quickJobController.getQuickJob);

// Payment routes
router.get('/:id/payment-status', verifyGatewayRequest, quickJobPaymentController.getPaymentStatus);
router.post('/:id/pay', verifyGatewayRequest, quickJobPaymentController.initializePayment);
router.post('/:id/release-payment', verifyGatewayRequest, quickJobPaymentController.releasePayment);
router.post('/:id/refund', verifyGatewayRequest, quickJobPaymentController.requestRefund);

// Submit a quote (workers)
router.post('/:id/quote', verifyGatewayRequest, quickJobController.submitQuote);

// Accept a quote (clients)
router.post('/:id/accept-quote', verifyGatewayRequest, quickJobController.acceptQuote);

// Worker actions (status updates)
router.post('/:id/on-way', verifyGatewayRequest, quickJobController.markOnWay);
router.post('/:id/arrived', verifyGatewayRequest, quickJobController.markArrived);
router.post('/:id/start', verifyGatewayRequest, quickJobController.startWork);
router.post('/:id/complete', verifyGatewayRequest, quickJobController.markComplete);

// Client actions
router.post('/:id/approve', verifyGatewayRequest, quickJobController.approveWork);

// Dispute
router.post('/:id/dispute', verifyGatewayRequest, quickJobController.raiseDispute);
router.get('/:id/dispute', verifyGatewayRequest, disputeController.getDispute);
router.post('/:id/dispute/evidence', verifyGatewayRequest, disputeController.addEvidence);
router.post('/:id/dispute/resolve', verifyGatewayRequest, disputeController.resolveDispute);

// Cancellation
router.post('/:id/cancel', verifyGatewayRequest, quickJobController.cancelQuickJob);

module.exports = router;
