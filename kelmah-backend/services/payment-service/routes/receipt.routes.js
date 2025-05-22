/**
 * Receipt Routes
 * Defines the routes for receipt operations
 */

const express = require('express');
const { body } = require('express-validator');
const receiptController = require('../controllers/receipt.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all receipt routes
router.use(protect);

// All receipt routes require authentication
router.use(authenticate);

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ received: true });
});

// Get receipt by ID
router.get('/:id', receiptController.getReceipt);

// Get receipt by number
router.get('/by-number/:receiptNumber', receiptController.getReceiptByNumber);

// Generate PDF for a receipt
router.get('/:id/pdf', receiptController.generatePDF);

// Generate a new receipt for a payment
router.post('/payment/:paymentId', receiptController.generateReceipt);

// Send receipt by email
router.post('/:id/send-email', receiptController.sendReceiptByEmail);

// Get receipts for a user
router.get('/payer/:payerId', receiptController.getPayerReceipts);
router.get('/recipient/:recipientId', receiptController.getRecipientReceipts);

// Admin-only routes
router.use(restrictTo('admin'));

// Get all receipts (admin only)
router.get('/', receiptController.getAllReceipts);

module.exports = router; 