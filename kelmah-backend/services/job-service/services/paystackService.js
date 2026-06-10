/**
 * Paystack Payment Service for QuickJobs
 * Handles escrow payments, mobile money, and card transactions
 * 
 * Supported Payment Methods:
 * - MTN Mobile Money (mtn_momo)
 * - Vodafone Cash (vodafone_cash)
 * - AirtelTigo Money (airtel_money)
 * - Debit/Credit Cards (card)
 * - Bank Transfer (bank_transfer)
 */

const axios = require('axios');
const crypto = require('crypto');
const { QuickJob, User } = require('../models');
const logger = require('../utils/logger');

// Paystack configuration
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Platform fee (15%)
const PLATFORM_FEE_RATE = 0.15;

// Paystack API client
const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Initialize a payment for escrow
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Payment initialization response
 */
const initializeEscrowPayment = async ({ quickJobId, email, amount, paymentMethod, callbackUrl }) => {
  try {
    const quickJob = await QuickJob.findById(quickJobId)
      .populate('client', 'email phoneNumber firstName lastName');

    if (!quickJob) {
      throw new Error('QuickJob not found');
    }

    if (quickJob.status !== 'accepted') {
      throw new Error('Job must be in accepted status to make payment');
    }

    // Calculate amounts in pesewas (Paystack uses smallest currency unit)
    const amountInPesewas = Math.round(amount * 100);

    // Build metadata for tracking
    const metadata = {
      quickJobId: quickJob._id.toString(),
      clientId: quickJob.client._id.toString(),
      workerId: quickJob.acceptedQuote?.worker?.toString(),
      paymentType: 'escrow',
      platformFee: Math.round(amount * PLATFORM_FEE_RATE * 100) / 100,
      workerPayout: Math.round(amount * (1 - PLATFORM_FEE_RATE) * 100) / 100
    };

    // Build channels based on payment method
    let channels = ['card', 'mobile_money', 'bank_transfer'];
    if (paymentMethod === 'mtn_momo') {
      channels = ['mobile_money'];
      metadata.mobileMoneyProvider = 'mtn';
    } else if (paymentMethod === 'vodafone_cash') {
      channels = ['mobile_money'];
      metadata.mobileMoneyProvider = 'vod';
    } else if (paymentMethod === 'airtel_money') {
      channels = ['mobile_money'];
      metadata.mobileMoneyProvider = 'tgo';
    } else if (paymentMethod === 'card') {
      channels = ['card'];
    }

    // Initialize transaction with Paystack
    const response = await paystackApi.post('/transaction/initialize', {
      email: email || quickJob.client.email,
      amount: amountInPesewas,
      currency: 'GHS',
      callback_url: callbackUrl || `${process.env.FRONTEND_URL}/quick-job/${quickJobId}/payment-complete`,
      metadata,
      channels
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Payment initialization failed');
    }

    // Store reference in quickJob
    quickJob.escrow.paymentReference = response.data.data.reference;
    quickJob.escrow.status = 'pending';
    await quickJob.save();

    logger.info(`Escrow payment initialized for QuickJob ${quickJobId}`, {
      reference: response.data.data.reference,
      amount: amount
    });

    return {
      success: true,
      data: {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference
      }
    };
  } catch (error) {
    logger.error('Error initializing escrow payment:', error);
    throw error;
  }
};

/**
 * Verify a payment from Paystack webhook or callback
 * @param {string} reference - Payment reference
 * @returns {Promise<Object>} Verification result
 */
const verifyPayment = async (reference) => {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);

    if (!response.data.status) {
      throw new Error(response.data.message || 'Payment verification failed');
    }

    const data = response.data.data;
    
    if (data.status !== 'success') {
      return {
        success: false,
        status: data.status,
        message: 'Payment was not successful'
      };
    }

    // Find and update QuickJob
    const quickJob = await QuickJob.findOne({ 'escrow.paymentReference': reference });

    if (!quickJob) {
      logger.warn(`QuickJob not found for payment reference: ${reference}`);
      return {
        success: false,
        message: 'Job not found for this payment'
      };
    }

    // Update escrow status
    quickJob.escrow.status = 'held';
    quickJob.escrow.transactionId = data.id.toString();
    quickJob.escrow.paidAt = new Date();
    quickJob.escrow.paymentMethod = data.channel === 'mobile_money' 
      ? `${data.authorization?.bank}_momo` 
      : data.channel;
    
    // Update job status to funded
    quickJob.status = 'funded';

    await quickJob.save();

    logger.info(`Escrow payment verified and held for QuickJob ${quickJob._id}`, {
      reference,
      transactionId: data.id
    });

    // TODO: Notify worker that payment is secured

    return {
      success: true,
      data: {
        quickJobId: quickJob._id,
        status: 'funded',
        amount: data.amount / 100,
        channel: data.channel
      }
    };
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Release escrow payment to worker
 * @param {string} quickJobId - QuickJob ID
 * @returns {Promise<Object>} Transfer result
 */
const releaseEscrowToWorker = async (quickJobId) => {
  try {
    const quickJob = await QuickJob.findById(quickJobId)
      .populate('acceptedQuote.worker', 'email phoneNumber bankDetails');

    if (!quickJob) {
      throw new Error('QuickJob not found');
    }

    if (quickJob.escrow.status !== 'held') {
      throw new Error('Escrow is not in held status');
    }

    const worker = quickJob.acceptedQuote?.worker;
    if (!worker) {
      throw new Error('Worker not found');
    }

    // For mobile money payout
    const workerPayout = quickJob.escrow.workerPayout;
    const payoutInPesewas = Math.round(workerPayout * 100);

    // Check if worker has a transfer recipient
    let recipientCode = worker.paystackRecipientCode;

    if (!recipientCode) {
      // Create transfer recipient for worker
      const recipientResponse = await createTransferRecipient(worker);
      recipientCode = recipientResponse.recipientCode;
      
      // Save to worker profile
      await User.findByIdAndUpdate(worker._id, {
        paystackRecipientCode: recipientCode
      });
    }

    // Initiate transfer
    const transferResponse = await paystackApi.post('/transfer', {
      source: 'balance',
      amount: payoutInPesewas,
      recipient: recipientCode,
      reason: `Payout for QuickJob ${quickJobId}`,
      reference: `payout_${quickJobId}_${Date.now()}`
    });

    if (!transferResponse.data.status) {
      throw new Error(transferResponse.data.message || 'Transfer failed');
    }

    // Update escrow status
    quickJob.escrow.status = 'released';
    quickJob.escrow.releasedAt = new Date();
    await quickJob.save();

    logger.info(`Escrow released to worker for QuickJob ${quickJobId}`, {
      amount: workerPayout,
      transferCode: transferResponse.data.data.transfer_code
    });

    return {
      success: true,
      data: {
        amount: workerPayout,
        transferCode: transferResponse.data.data.transfer_code,
        status: 'released'
      }
    };
  } catch (error) {
    logger.error('Error releasing escrow:', error);
    throw error;
  }
};

/**
 * Process refund for cancelled job
 * @param {string} quickJobId - QuickJob ID
 * @param {number} refundPercentage - Percentage to refund (0-100)
 * @returns {Promise<Object>} Refund result
 */
const processRefund = async (quickJobId, refundPercentage = 100) => {
  try {
    const quickJob = await QuickJob.findById(quickJobId);

    if (!quickJob) {
      throw new Error('QuickJob not found');
    }

    if (!['held', 'pending'].includes(quickJob.escrow.status)) {
      throw new Error('Cannot refund - escrow not in refundable status');
    }

    if (!quickJob.escrow.transactionId) {
      throw new Error('No transaction to refund');
    }

    const refundAmount = Math.round(quickJob.escrow.amount * (refundPercentage / 100) * 100); // in pesewas

    const response = await paystackApi.post('/refund', {
      transaction: quickJob.escrow.transactionId,
      amount: refundAmount
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Refund failed');
    }

    // Update escrow
    const isFullRefund = refundPercentage === 100;
    quickJob.escrow.status = isFullRefund ? 'refunded' : 'partial_refund';
    quickJob.escrow.refundedAt = new Date();
    quickJob.escrow.refundAmount = refundAmount / 100;
    quickJob.escrow.refundReason = quickJob.cancellation?.reason || 'Job cancelled';
    
    await quickJob.save();

    logger.info(`Refund processed for QuickJob ${quickJobId}`, {
      refundAmount: refundAmount / 100,
      percentage: refundPercentage
    });

    return {
      success: true,
      data: {
        refundAmount: refundAmount / 100,
        refundId: response.data.data.id,
        status: quickJob.escrow.status
      }
    };
  } catch (error) {
    logger.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Create a transfer recipient for worker payouts
 * @param {Object} worker - Worker user object
 * @returns {Promise<Object>} Recipient details
 */
const createTransferRecipient = async (worker) => {
  try {
    // Default to mobile money for Ghana
    const recipientData = {
      type: 'mobile_money',
      name: `${worker.firstName} ${worker.lastName}`,
      account_number: worker.phoneNumber?.replace('+233', '0') || worker.bankDetails?.accountNumber,
      bank_code: worker.bankDetails?.mobileMoneyProvider || 'MTN', // MTN, VOD, ATL for Ghana
      currency: 'GHS'
    };

    const response = await paystackApi.post('/transferrecipient', recipientData);

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to create transfer recipient');
    }

    return {
      recipientCode: response.data.data.recipient_code,
      recipientId: response.data.data.id
    };
  } catch (error) {
    logger.error('Error creating transfer recipient:', error);
    throw error;
  }
};

/**
 * Handle Paystack webhook
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Paystack signature
 * @returns {Promise<Object>} Handling result
 */
const handleWebhook = async (payload, signature) => {
  try {
    // Verify webhook signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    switch (event) {
      case 'charge.success':
        return await verifyPayment(data.reference);

      case 'transfer.success':
        logger.info('Transfer successful:', data);
        return { success: true, event: 'transfer.success' };

      case 'transfer.failed':
        logger.error('Transfer failed:', data);
        // TODO: Handle failed transfer - notify admin
        return { success: false, event: 'transfer.failed', data };

      case 'refund.processed':
        logger.info('Refund processed:', data);
        return { success: true, event: 'refund.processed' };

      default:
        logger.info(`Unhandled Paystack event: ${event}`);
        return { success: true, event: 'unhandled' };
    }
  } catch (error) {
    logger.error('Error handling webhook:', error);
    throw error;
  }
};

/**
 * Get payment status for a QuickJob
 * @param {string} quickJobId - QuickJob ID
 * @returns {Promise<Object>} Payment status
 */
const getPaymentStatus = async (quickJobId) => {
  try {
    const quickJob = await QuickJob.findById(quickJobId)
      .select('escrow status');

    if (!quickJob) {
      throw new Error('QuickJob not found');
    }

    return {
      success: true,
      data: {
        escrowStatus: quickJob.escrow?.status || 'pending',
        jobStatus: quickJob.status,
        amount: quickJob.escrow?.amount,
        platformFee: quickJob.escrow?.platformFee,
        workerPayout: quickJob.escrow?.workerPayout,
        paidAt: quickJob.escrow?.paidAt,
        releasedAt: quickJob.escrow?.releasedAt
      }
    };
  } catch (error) {
    logger.error('Error getting payment status:', error);
    throw error;
  }
};

module.exports = {
  initializeEscrowPayment,
  verifyPayment,
  releaseEscrowToWorker,
  processRefund,
  createTransferRecipient,
  handleWebhook,
  getPaymentStatus,
  PLATFORM_FEE_RATE
};
