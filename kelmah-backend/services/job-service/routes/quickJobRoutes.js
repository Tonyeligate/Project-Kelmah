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

// Signed-upload semantics for completion photos
router.post('/photos/upload-url', verifyGatewayRequest, async (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'quickjobs/completions';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';

  if (!cloudName || !uploadPreset) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Signed upload is not configured. Use image URLs from your existing media flow.',
        code: 'UPLOAD_NOT_CONFIGURED',
      },
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      provider: 'cloudinary',
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      fields: {
        upload_preset: uploadPreset,
        folder,
        timestamp,
      },
      expiresInSeconds: 300,
    },
  });
});

// Payment verification (specific route)
router.get('/payment/verify/:reference', verifyGatewayRequest, quickJobPaymentController.verifyPayment);

// Dispute routes (admin only - specific routes first)
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
  next();
};
router.get('/disputes', verifyGatewayRequest, requireAdmin, disputeController.getAllDisputes);
router.get('/disputes/stats', verifyGatewayRequest, requireAdmin, disputeController.getDisputeStats);

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
