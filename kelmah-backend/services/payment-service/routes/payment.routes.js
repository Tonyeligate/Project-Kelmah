/**
 * Payment Routes
 * Defines the routes for payment operations
 */

const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all payment routes
router.use(protect);

// All payment routes require authentication
router.use(authenticate);

// Initialize payment
router.post(
  '/initialize',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('provider').isIn(['mobile_money', 'paystack', 'flutterwave']).withMessage('Valid payment provider is required')
  ],
  paymentController.initializePayment
);

// Verify payment
router.post(
  '/verify',
  [
    body('reference').notEmpty().withMessage('Payment reference is required'),
    body('provider').isIn(['mobile_money', 'paystack', 'flutterwave']).withMessage('Valid payment provider is required')
  ],
  paymentController.verifyPayment
);

// Process payment
router.post(
  '/process',
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('provider').isIn(['mobile_money', 'paystack', 'flutterwave']).withMessage('Valid payment provider is required')
  ],
  paymentController.processPayment
);

// Save payment method
router.post(
  '/methods',
  [
    body('type').isIn(['card', 'bank_account', 'mobile_money']).withMessage('Valid payment method type is required'),
    body('provider').isIn(['mobile_money', 'paystack', 'flutterwave']).withMessage('Valid payment provider is required'),
    body('details').isObject().withMessage('Payment method details are required')
  ],
  paymentController.savePaymentMethod
);

// Get payment methods
router.get('/methods', paymentController.getPaymentMethods);

// Delete payment method
router.delete('/methods/:id', paymentController.deletePaymentMethod);

// Webhook endpoints for payment providers don't need authentication
router.use('/webhook', express.raw({ type: 'application/json' }));
router.use('/webhook', (req, res, next) => {
  // Parse the raw body for webhook endpoints
  if (req.body.length) {
    req.body = JSON.parse(req.body.toString());
  }
  next();
});

// Webhooks should be publicly accessible without authentication
router.post('/webhook/mobile-money', (req, res, next) => {
  req.params.provider = 'mobile_money';
  paymentController.processWebhook(req, res, next);
});

router.post('/webhook/paystack', (req, res, next) => {
  req.params.provider = 'paystack';
  paymentController.processWebhook(req, res, next);
});

router.post('/webhook/flutterwave', (req, res, next) => {
  req.params.provider = 'flutterwave';
  paymentController.processWebhook(req, res, next);
});

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ success: true, message: 'Payment service is working' });
});

// Payment operations
router.post('/', paymentController.createPayment);
router.get('/:id', paymentController.getPayment);
router.get('/by-number/:paymentNumber', paymentController.getPaymentByNumber);
router.post('/:id/process', paymentController.processPayment);
router.post('/:id/capture-details', paymentController.capturePaymentDetails);
router.post('/:id/cancel', paymentController.cancelPayment);
router.post('/:id/fail', paymentController.failPayment);
router.post('/:id/refund', paymentController.refundPayment);
router.get('/:id/receipt', paymentController.generateReceipt);

// User payment history routes
router.get('/user/:userId/made', paymentController.getUserPayments);
router.get('/user/:userId/received', paymentController.getUserReceivedPayments);

// Entity-specific payment routes
router.get('/escrow/:escrowId/payments', paymentController.getEscrowPayments);
router.get('/job/:jobId/payments', paymentController.getJobPayments);
router.get('/contract/:contractId/payments', paymentController.getContractPayments);

// Admin-only routes
router.use(restrictTo('admin'));
// Add admin-specific routes here if needed

module.exports = router; 