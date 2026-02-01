/**
 * QuickJob Payment Controller
 * Handles escrow payment operations for quick jobs
 */

const paystackService = require('../services/paystackService');
const { QuickJob } = require('../models');
const logger = require('../utils/logger');

/**
 * Initialize escrow payment for a QuickJob
 * POST /api/quick-jobs/:id/pay
 */
const initializePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found', code: 'NOT_FOUND' }
      });
    }

    // Verify ownership
    if (quickJob.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only the job owner can make payment', code: 'FORBIDDEN' }
      });
    }

    // Check status
    if (quickJob.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment can only be made after accepting a quote', code: 'INVALID_STATUS' }
      });
    }

    // Get amount from accepted quote
    const amount = quickJob.acceptedQuote?.amount;
    if (!amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'No accepted quote amount found', code: 'INVALID_STATE' }
      });
    }

    const result = await paystackService.initializeEscrowPayment({
      quickJobId: id,
      email: req.user.email,
      amount,
      paymentMethod: paymentMethod || 'card',
      callbackUrl: `${process.env.FRONTEND_URL}/quick-job/${id}/payment-callback`
    });

    logger.info(`Payment initialized for QuickJob ${id}`, { amount });

    res.json({
      success: true,
      data: result.data,
      message: 'Payment initialized. Redirect to complete payment.'
    });
  } catch (error) {
    logger.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Payment initialization failed', code: 'PAYMENT_ERROR' }
    });
  }
};

/**
 * Verify payment callback
 * GET /api/quick-jobs/payment/verify/:reference
 */
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const result = await paystackService.verifyPayment(reference);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Payment verified! Worker will be notified.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message || 'Payment verification failed', code: 'VERIFICATION_FAILED' }
      });
    }
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Payment verification failed', code: 'PAYMENT_ERROR' }
    });
  }
};

/**
 * Get payment status for a QuickJob
 * GET /api/quick-jobs/:id/payment-status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await paystackService.getPaymentStatus(id);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get payment status', code: 'SERVER_ERROR' }
    });
  }
};

/**
 * Handle Paystack webhook
 * POST /api/quick-jobs/payment/webhook
 */
const handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing signature', code: 'INVALID_WEBHOOK' }
      });
    }

    const result = await paystackService.handleWebhook(req.body, signature);

    logger.info('Paystack webhook processed:', { event: req.body.event });

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    // Always return 200 to Paystack to prevent retries
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * Request payout to worker (called when client approves or auto-release)
 * POST /api/quick-jobs/:id/release-payment
 */
const releasePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found', code: 'NOT_FOUND' }
      });
    }

    // Only allow release if approved or if client is manually releasing
    const isClient = quickJob.client.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to release payment', code: 'FORBIDDEN' }
      });
    }

    if (!['completed', 'approved'].includes(quickJob.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Work must be completed before releasing payment', code: 'INVALID_STATUS' }
      });
    }

    const result = await paystackService.releaseEscrowToWorker(id);

    // Update job status to approved if not already
    if (quickJob.status === 'completed') {
      quickJob.status = 'approved';
      quickJob.tracking.clientApproved = {
        timestamp: new Date()
      };
      await quickJob.save();
    }

    logger.info(`Payment released for QuickJob ${id}`);

    res.json({
      success: true,
      data: result.data,
      message: `Payment of GH₵${result.data.amount} released to worker!`
    });
  } catch (error) {
    logger.error('Error releasing payment:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to release payment', code: 'PAYMENT_ERROR' }
    });
  }
};

/**
 * Request refund for cancelled job
 * POST /api/quick-jobs/:id/refund
 */
const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage } = req.body;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job not found', code: 'NOT_FOUND' }
      });
    }

    // Verify permissions
    const isClient = quickJob.client.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to request refund', code: 'FORBIDDEN' }
      });
    }

    if (quickJob.status !== 'cancelled' && quickJob.status !== 'disputed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Refund only available for cancelled or disputed jobs', code: 'INVALID_STATUS' }
      });
    }

    const refundPercentage = percentage || 100;
    const result = await paystackService.processRefund(id, refundPercentage);

    logger.info(`Refund processed for QuickJob ${id}`, { amount: result.data.refundAmount });

    res.json({
      success: true,
      data: result.data,
      message: `Refund of GH₵${result.data.refundAmount} processed!`
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to process refund', code: 'PAYMENT_ERROR' }
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
  handlePaystackWebhook,
  releasePayment,
  requestRefund
};
