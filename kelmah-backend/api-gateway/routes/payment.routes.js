/**
 * Payment Service Routes
 * Proxy configuration for payment-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middleware/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').PAYMENT_SERVICE;

// Payment proxy middleware
const paymentProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/payments',
    requireAuth: true
  });
  return proxy(req, res, next);
};

// All payment routes require authentication
router.use(authenticate);

// Wallet routes
router.get('/wallet', paymentProxy); // Get user wallet
router.get('/wallet/balance', paymentProxy); // Get wallet balance
router.post('/wallet/deposit', paymentProxy); // Deposit to wallet
router.post('/wallet/withdraw', paymentProxy); // Withdraw from wallet

// Payment methods
router.get('/methods', paymentProxy); // Get user's payment methods
router.post('/methods', paymentProxy); // Add payment method
router.put('/methods/:methodId', paymentProxy); // Update payment method
router.delete('/methods/:methodId', paymentProxy); // Delete payment method
router.put('/methods/:methodId/default', paymentProxy); // Set default payment method

// Transaction routes
router.get('/transactions', paymentProxy); // Get user transactions
router.get('/transactions/:transactionId', paymentProxy); // Get specific transaction
router.post('/transactions', paymentProxy); // Create transaction

// Job payments
router.post('/jobs/:jobId/pay', paymentProxy); // Pay for job
router.post('/jobs/:jobId/escrow', paymentProxy); // Create escrow for job
router.post('/jobs/:jobId/release', paymentProxy); // Release escrow payment
router.post('/jobs/:jobId/refund', paymentProxy); // Refund job payment

// Milestone payments
router.post('/jobs/:jobId/milestones/:milestoneId/pay', paymentProxy); // Pay milestone
router.post('/jobs/:jobId/milestones/:milestoneId/release', paymentProxy); // Release milestone payment

// Stripe integration
router.post('/stripe/payment-intent', paymentProxy); // Create Stripe payment intent
router.post('/stripe/setup-intent', paymentProxy); // Create Stripe setup intent
router.post('/stripe/webhook', paymentProxy); // Handle Stripe webhooks

// PayPal integration
router.post('/paypal/create-order', paymentProxy); // Create PayPal order
router.post('/paypal/capture-order', paymentProxy); // Capture PayPal order
router.post('/paypal/webhook', paymentProxy); // Handle PayPal webhooks

// Escrow management
// Canonical singular
router.get('/escrow', paymentProxy);
router.get('/escrow/:escrowId', paymentProxy);
router.post('/escrow/:escrowId/dispute', paymentProxy);
router.put('/escrow/:escrowId/resolve', paymentProxy);
// Aliases (plural) for FE compatibility
router.get('/escrows', paymentProxy);
router.get('/escrows/:escrowId', paymentProxy);
router.post('/escrows/:escrowId/dispute', paymentProxy);
router.post('/escrows/:escrowId/release', paymentProxy);
router.post('/escrows/:escrowId/refund', paymentProxy);

// Subscription payments
router.get('/subscriptions', paymentProxy); // Get user subscriptions
router.post('/subscriptions', paymentProxy); // Create subscription
router.put('/subscriptions/:subscriptionId', paymentProxy); // Update subscription
router.delete('/subscriptions/:subscriptionId', paymentProxy); // Cancel subscription

// Payment analytics (for admins)
router.get('/analytics/revenue', paymentProxy); // Get revenue analytics
router.get('/analytics/transactions', paymentProxy); // Get transaction analytics

// Fee management
router.get('/fees', paymentProxy); // Get fee structure
router.post('/fees/calculate', paymentProxy); // Calculate fees for amount

// Payment disputes
router.get('/disputes', paymentProxy); // Get user disputes
router.post('/disputes', paymentProxy); // Create dispute
router.put('/disputes/:disputeId', paymentProxy); // Update dispute
router.get('/disputes/:disputeId', paymentProxy); // Get dispute details

// Admin payout queue
// Bills (aliases expected by FE)
router.get('/bills', paymentProxy);
router.post('/bills/:billId/pay', paymentProxy);

// Transaction history alias expected by FE
router.get('/transactions/history', paymentProxy);
router.post('/admin/payouts/queue', paymentProxy);
router.post('/admin/payouts/process', paymentProxy);
router.get('/admin/payouts', paymentProxy);

module.exports = router;