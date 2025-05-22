const express = require('express');
const walletRoutes = require('./wallet.routes');
const paymentRoutes = require('./payment.routes');
const escrowRoutes = require('./escrow.routes');
const disputeRoutes = require('./dispute.routes');
const invoiceRoutes = require('./invoice.routes');
const receiptRoutes = require('./receipt.routes');
const payoutRoutes = require('./payout.routes');

const router = express.Router();

// Mount routes
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/escrows', escrowRoutes);
router.use('/disputes', disputeRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/receipts', receiptRoutes);
router.use('/payouts', payoutRoutes);

module.exports = router; 