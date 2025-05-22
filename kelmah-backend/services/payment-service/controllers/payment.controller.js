/**
 * Payment Controller
 * Handles payment-related operations for the Kelmah platform
 */

const { Payment, Transaction, PaymentMethod, Escrow } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const PaymentIntegrations = require('../integrations');

/**
 * Create a new payment
 */
exports.createPayment = async (req, res, next) => {
  try {
    const {
      amount,
      currency = 'GHS',
      payerId,
      recipientId,
      type,
      paymentMethodId,
      description,
      escrowId,
      jobId,
      contractId
    } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return next(new AppError('Payment amount must be greater than 0', 400));
    }
    
    // Validate payment type
    const validTypes = [
      'deposit', 'withdrawal', 'escrow_funding', 'escrow_release',
      'refund', 'subscription', 'service_fee', 'direct_payment', 'platform_fee'
    ];
    
    if (!validTypes.includes(type)) {
      return next(new AppError(`Invalid payment type: ${type}`, 400));
    }

    // Validate payer ID
    if (!payerId) {
      return next(new AppError('Payer ID is required', 400));
    }
    
    // Validate payment method if provided
    if (paymentMethodId) {
      const paymentMethod = await PaymentMethod.findByPk(paymentMethodId);
      if (!paymentMethod) {
        return next(new AppError('Invalid payment method', 400));
      }
      
      // Ensure payment method belongs to payer
      if (paymentMethod.userId !== payerId) {
        return next(new AppError('Payment method does not belong to payer', 403));
      }
    }

    // Calculate fees
    const fees = await Payment.calculateFees(amount, { currency, paymentType: type });
    
    // Create the payment
    const payment = await Payment.create({
      paymentNumber: `PMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount,
      currency,
      payerId,
      recipientId,
      type,
      status: 'pending',
      paymentMethodId,
      description,
      escrowId,
      jobId,
      contractId,
      platformFee: fees.platformFee,
      processingFee: fees.processingFee,
      tax: fees.tax,
      totalAmount: fees.totalAmount
    });

    logger.paymentProcessed({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });

    return res.status(201).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    logger.error('Error creating payment:', error);
    return next(new AppError('Failed to create payment', 500));
  }
};

/**
 * Get payment by ID
 */
exports.getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return next(new AppError('Failed to fetch payment', 500));
  }
};

/**
 * Get payment by payment number
 */
exports.getPaymentByNumber = async (req, res, next) => {
  try {
    const { paymentNumber } = req.params;
    
    const payment = await Payment.findByPaymentNumber(paymentNumber);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    logger.error('Error fetching payment by number:', error);
    return next(new AppError('Failed to fetch payment', 500));
    }
};

/**
 * Get payments for a user (as payer)
 */
exports.getUserPayments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, type, limit = 20, offset = 0 } = req.query;
    
    const payments = await Payment.findByPayerId(userId, {
      status,
      type,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Get total count for pagination
    const totalCount = await Payment.count({
      where: { payerId: userId }
    });
    
    return res.status(200).json({
      status: 'success',
      results: payments.length,
      totalCount,
      data: {
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching user payments:', error);
    return next(new AppError('Failed to fetch user payments', 500));
        }
};
      
/**
 * Get received payments for a user (as recipient)
 */
exports.getUserReceivedPayments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, type, limit = 20, offset = 0 } = req.query;
    
    const payments = await Payment.findByRecipientId(userId, {
      status,
      type,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Get total count for pagination
    const totalCount = await Payment.count({
      where: { recipientId: userId }
      });
    
    return res.status(200).json({
      status: 'success',
      results: payments.length,
      totalCount,
      data: {
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching user received payments:', error);
    return next(new AppError('Failed to fetch user received payments', 500));
  }
};

/**
 * Process a payment
 */
exports.processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'pending') {
      return next(new AppError(`Cannot process payment in ${payment.status} status`, 400));
    }
    
    // Update payment status to processing
    await payment.process();
    
    // In a real-world scenario, this would integrate with payment processors
    // For demonstration, we'll simulate a successful payment processing
    
    // Create a transaction record
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: payment.payerId,
      type: 'payment',
      amount: payment.totalAmount,
      currency: payment.currency,
      status: 'completed',
      description: payment.description || `Payment: ${payment.paymentNumber}`,
      paymentId: payment.id,
      paymentMethodId: payment.paymentMethodId
    });
    
    // Complete the payment
    await payment.complete(transaction.id, transaction.transactionId);
    
    // If this is an escrow payment, update the escrow
    if (payment.escrowId && payment.type === 'escrow_funding') {
      const escrow = await Escrow.findByPk(payment.escrowId);
      if (escrow) {
        await escrow.fund(transaction.id);
        logger.escrowAction('funded', escrow);
      }
    }
    
    logger.paymentProcessed({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment,
        transaction
      }
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    return next(new AppError('Failed to process payment', 500));
  }
};

/**
 * Capture payment details for external processing
 */
exports.capturePaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { providerData, providerTransactionId } = req.body;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    // Update payment with provider data
    payment.providerData = providerData;
    payment.paymentProviderTransactionId = providerTransactionId;
    
    await payment.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment
      }
      });
  } catch (error) {
    logger.error('Error capturing payment details:', error);
    return next(new AppError('Failed to capture payment details', 500));
  }
};

/**
 * Cancel a payment
 */
exports.cancelPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'pending' && payment.status !== 'processing') {
      return next(new AppError(`Cannot cancel payment in ${payment.status} status`, 400));
    }
    
    // Cancel the payment
    await payment.cancel(reason);
    
    logger.logPaymentActivity('cancelled', {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    logger.error('Error cancelling payment:', error);
    return next(new AppError('Failed to cancel payment', 500));
  }
};

/**
 * Mark a payment as failed
 */
exports.failPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { errorCode, errorMessage } = req.body;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    // Mark the payment as failed
    await payment.markAsFailed(errorCode, errorMessage);
    
    logger.paymentFailed({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      currency: payment.currency
    }, { code: errorCode, message: errorMessage });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    logger.error('Error marking payment as failed:', error);
    return next(new AppError('Failed to mark payment as failed', 500));
  }
};

/**
 * Issue a refund for a payment
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'completed') {
      return next(new AppError('Can only refund completed payments', 400));
    }
    
    // Validate refund amount
    if (!amount || amount <= 0) {
      return next(new AppError('Refund amount must be greater than 0', 400));
    }
    
    if (amount > payment.amount) {
      return next(new AppError('Refund amount cannot exceed payment amount', 400));
    }
    
    // Create a transaction for the refund
    const refundTransaction = await Transaction.create({
      transactionId: uuidv4(),
      userId: payment.payerId,
      type: 'refund',
      amount: amount,
      currency: payment.currency,
      status: 'completed',
      description: reason || `Refund for payment: ${payment.paymentNumber}`,
      paymentId: payment.id,
      paymentMethodId: payment.paymentMethodId
    });
    
    // Update the payment with refund information
    await payment.refund(amount, refundTransaction.id, reason);
    
    logger.logPaymentActivity('refunded', {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount,
      reason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment,
        refundTransaction
      }
    });
  } catch (error) {
    logger.error('Error refunding payment:', error);
    return next(new AppError('Failed to refund payment', 500));
  }
};

/**
 * Generate a receipt for a payment
 */
exports.generateReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'completed') {
      return next(new AppError('Can only generate receipts for completed payments', 400));
    }
    
    // Generate the receipt
    const receiptUrl = await Payment.generateReceipt(payment.id);
    
    return res.status(200).json({
      status: 'success',
      data: {
        receiptUrl
      }
    });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    return next(new AppError('Failed to generate receipt', 500));
  }
};

/**
 * Get payments for a specific escrow
 */
exports.getEscrowPayments = async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    
    const payments = await Payment.findByEscrowId(escrowId);
    
    return res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching escrow payments:', error);
    return next(new AppError('Failed to fetch escrow payments', 500));
    }
};

/**
 * Get payments for a specific job
 */
exports.getJobPayments = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const payments = await Payment.findByJobId(jobId);
    
    return res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching job payments:', error);
    return next(new AppError('Failed to fetch job payments', 500));
  }
};

/**
 * Get payments for a specific contract
 */
exports.getContractPayments = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    
    const payments = await Payment.findByContractId(contractId);
    
    return res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    logger.error('Error fetching contract payments:', error);
    return next(new AppError('Failed to fetch contract payments', 500));
  }
};

/**
 * Initialize a payment with external provider
 */
exports.initializePayment = async (req, res, next) => {
  try {
    const {
      amount,
      currency = 'GHS',
      provider,
      paymentMethodId,
      email,
      name,
      phone,
      description,
      returnUrl,
      metadata = {}
    } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return next(new AppError('Payment amount must be greater than 0', 400));
    }
    
    if (!provider) {
      return next(new AppError('Payment provider is required', 400));
    }
    
    // Get user info from authenticated user
    const userId = req.user.id;
    const userEmail = email || req.user.email;
    const userName = name || `${req.user.firstName} ${req.user.lastName}`;
    const userPhone = phone || req.user.phone;
    
    // Prepare data based on provider
    let paymentData = {};
    
    switch (provider.toLowerCase()) {
      case PaymentIntegrations.PROVIDERS.MOBILE_MONEY:
        if (!phone) {
          return next(new AppError('Phone number is required for mobile money payments', 400));
        }
        
        paymentData = {
          amount,
          currency,
          phone: userPhone,
          provider: req.body.momoProvider || 'mtn', // Default to MTN if not specified
          description: description || 'Payment to Kelmah Platform'
        };
        break;
        
      case PaymentIntegrations.PROVIDERS.PAYSTACK:
        if (!userEmail) {
          return next(new AppError('Email is required for Paystack payments', 400));
        }
        
        paymentData = {
          amount,
          email: userEmail,
          currency,
          callbackUrl: returnUrl,
          metadata: {
            user_id: userId,
            ...metadata
          }
        };
        break;
        
      case PaymentIntegrations.PROVIDERS.FLUTTERWAVE:
        if (!userEmail || !userName) {
          return next(new AppError('Email and name are required for Flutterwave payments', 400));
        }
        
        paymentData = {
          amount,
          currency,
          email: userEmail,
          name: userName,
          phone: userPhone,
          redirectUrl: returnUrl,
          meta: {
            user_id: userId,
            ...metadata
          }
        };
        break;
        
      default:
        return next(new AppError(`Unsupported payment provider: ${provider}`, 400));
    }
    
    // Initialize payment with the selected provider
    const paymentResponse = await PaymentIntegrations.initializePayment(provider, paymentData);
    
    if (!paymentResponse.success) {
      logger.error('Payment initialization failed:', paymentResponse);
      return next(new AppError(paymentResponse.message || 'Payment initialization failed', 400));
    }
    
    // Create a payment record in the database
    const payment = await Payment.create({
      paymentNumber: `PMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount,
      currency,
      payerId: userId,
      type: 'deposit', // Default type for initialized payments
      status: 'pending',
      paymentMethodId,
      description: description || 'Payment via ' + provider,
      providerName: provider,
      providerReference: paymentResponse.reference,
      providerResponse: JSON.stringify(paymentResponse),
      metadata: JSON.stringify(metadata)
    });
    
    logger.info(`Payment initialized: ${payment.id}, Provider: ${provider}, Reference: ${paymentResponse.reference}`);
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment,
        providerResponse: paymentResponse
      }
    });
  } catch (error) {
    logger.error('Error initializing payment:', error);
    return next(new AppError('Failed to initialize payment', 500));
  }
};

/**
 * Verify a payment with external provider
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { provider, reference } = req.body;
    
    // Validate required fields
    if (!provider || !reference) {
      return next(new AppError('Provider and reference are required', 400));
    }
    
    // Find payment by provider reference
    const payment = await Payment.findOne({ 
      where: { 
        providerReference: reference,
        providerName: provider
      } 
    });
    
    if (!payment) {
      return next(new AppError('Payment not found with the given reference', 404));
    }
    
    // Verify payment with the provider
    const verificationResponse = await PaymentIntegrations.verifyPayment(provider, reference);
    
    if (!verificationResponse.success) {
      logger.error('Payment verification failed:', verificationResponse);
      return next(new AppError(verificationResponse.message || 'Payment verification failed', 400));
    }
    
    // Update payment status based on verification response
    if (verificationResponse.verified) {
      // Update payment to successful
      payment.status = 'completed';
      payment.providerResponse = JSON.stringify(verificationResponse);
      payment.dateCompleted = new Date();
      await payment.save();
      
      // Create transaction record
      await Transaction.create({
        transactionNumber: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        type: 'deposit',
        status: 'completed',
        description: `Payment completed via ${provider}`,
        metadata: payment.metadata
      });
      
      logger.info(`Payment verified and completed: ${payment.id}, Provider: ${provider}, Reference: ${reference}`);
    } else {
      // Update payment with verification status
      payment.providerResponse = JSON.stringify(verificationResponse);
      await payment.save();
      
      logger.info(`Payment verification returned non-success status: ${payment.id}, Status: ${verificationResponse.status}`);
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        payment,
        verified: verificationResponse.verified,
        verificationResponse
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    return next(new AppError('Failed to verify payment', 500));
  }
};

/**
 * Process webhook from payment provider
 */
exports.processWebhook = async (req, res, next) => {
  try {
    const provider = req.params.provider;
    
    if (!provider) {
      return next(new AppError('Provider is required', 400));
    }
    
    // Process webhook with the provider
    const webhookResponse = await PaymentIntegrations.processWebhook(provider, req);
    
    if (!webhookResponse.success) {
      logger.error('Webhook processing failed:', webhookResponse);
      // Still return 200 to acknowledge receipt as per webhook best practices
      return res.status(200).json({
        status: 'error',
        message: webhookResponse.message || 'Webhook processing failed'
      });
    }
    
    // Handle the webhook based on the event type and provider
    const { reference, status, event, referenceType } = webhookResponse;
    
    if (reference && status === 'SUCCESS' && referenceType === 'payment') {
      // Find payment by provider reference
      const payment = await Payment.findOne({ 
        where: { 
          providerReference: reference,
          providerName: provider
        } 
      });
      
      if (payment) {
        // Update payment status
        payment.status = 'completed';
        payment.providerResponse = JSON.stringify(webhookResponse);
        payment.dateCompleted = new Date();
        await payment.save();
        
        // Create transaction record if it doesn't exist
        const existingTransaction = await Transaction.findOne({
          where: { paymentId: payment.id }
        });
        
        if (!existingTransaction) {
          await Transaction.create({
            transactionNumber: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            type: 'deposit',
            status: 'completed',
            description: `Payment completed via ${provider} webhook`,
            metadata: payment.metadata
          });
        }
        
        logger.info(`Payment completed via webhook: ${payment.id}, Provider: ${provider}, Reference: ${reference}`);
      } else {
        logger.warn(`Payment not found for webhook reference: ${reference}, Provider: ${provider}`);
      }
    }
    
    // Acknowledge receipt of webhook
    return res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    // Still return 200 to acknowledge receipt as per webhook best practices
    return res.status(200).json({
      status: 'error',
      message: 'Webhook acknowledged but processing failed'
    });
  }
}; 