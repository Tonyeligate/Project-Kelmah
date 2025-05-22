/**
 * Invoice Routes
 * Defines the routes for invoice operations
 */

const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, protect, restrictTo } = require('../../../shared');

const router = express.Router();

// Protect all invoice routes
router.use(protect);

// All invoice routes require authentication
router.use(authenticate);

// Test route
router.get('/test', (req, res) => {
  res.status(200).send({ received: true });
});

// Get invoice by ID
router.get('/:id', invoiceController.getInvoice);

// Get invoice by number
router.get('/by-number/:invoiceNumber', invoiceController.getInvoiceByNumber);

// Generate PDF for an invoice
router.get('/:id/pdf', invoiceController.generatePDF);

// Generate a new invoice for a payment
router.post('/payment/:paymentId', invoiceController.generateInvoice);

// Create a new invoice (manually)
router.post('/', [
  body('payerId').notEmpty().withMessage('Payer ID is required'),
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one invoice item is required'),
  body('total').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0')
], invoiceController.createInvoice);

// Update invoice status
router.patch('/:id/status', [
  body('status').isIn(['issued', 'sent', 'paid', 'cancelled', 'overdue']).withMessage('Invalid status')
], invoiceController.updateStatus);

// Mark invoice as sent
router.post('/:id/mark-sent', invoiceController.markAsSent);

// Mark invoice as paid
router.post('/:id/mark-paid', invoiceController.markAsPaid);

// Cancel an invoice
router.post('/:id/cancel', invoiceController.cancelInvoice);

// Send invoice by email
router.post('/:id/send-email', invoiceController.sendInvoiceByEmail);

// Get invoices for a user
router.get('/payer/:payerId', invoiceController.getPayerInvoices);
router.get('/recipient/:recipientId', invoiceController.getRecipientInvoices);

// Admin-only routes
router.use(restrictTo('admin'));

// Get all invoices (admin only)
router.get('/', invoiceController.getAllInvoices);

module.exports = router; 