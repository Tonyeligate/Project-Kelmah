const crypto = require('crypto');
const { Transaction, Wallet, PaymentMethod, WebhookEvent } = require("../models");
const logger = require('../utils/logger');
const stripe = require("../services/stripe");
const paypal = require("../services/paypal");
const PaystackService = require('../integrations/paystack');
const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const AirtelTigoService = require('../integrations/airteltigo');
const { validateTransaction } = require('../utils/validation');
const { handleError, getUserId } = require('../utils/controllerUtils');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      amount,
      currency,
      type,
      paymentMethod,
      recipient,
      relatedTransaction,
      relatedContract,
      relatedJob,
      description,
    } = req.body;

    // Validate amount is a positive finite number
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount must be a positive number', code: 'INVALID_AMOUNT' }
      });
    }

    // Create transaction record (persist immediately for history consistency)
    const transaction = await new Transaction({
      transactionId: generateTransactionId(),
      amount,
      currency,
      type,
      paymentMethod,
      sender: getUserId(req),
      recipient,
      relatedTransaction,
      relatedContract,
      relatedJob,
      description,
    }).save();

    // Calculate fees
    await transaction.calculateFees();

    // Process payment based on type
    switch (type) {
      case "payment":
        await processPayment(transaction);
        break;
      case "withdrawal":
        await processWithdrawal(transaction);
        break;
      case "refund":
        await processRefund(transaction);
        break;
      default:
        throw new Error("Invalid transaction type");
    }

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get transaction details
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      transactionId,
      $or: [{ sender: getUserId(req) }, { recipient: getUserId(req) }],
    }).populate("sender recipient relatedContract relatedJob");

    if (!transaction) {
      return res.status(404).json({ success: false, error: { message: "Transaction not found" } });
    }

    return res.json({ success: true, data: transaction });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;

    const query = {
      $or: [{ sender: getUserId(req) }, { recipient: getUserId(req) }],
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const safePage = Math.max(1, parseInt(page));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("sender recipient relatedContract relatedJob");

    const total = await Transaction.countDocuments(query);

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Reconcile unprocessed webhook events to maintain state consistency
exports.reconcile = async (req, res) => {
  try {
    const sinceParam = req.query.since ? new Date(req.query.since) : null;
    const since = sinceParam && !isNaN(sinceParam.valueOf()) ? sinceParam : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '200')));
    const events = await WebhookEvent.find({ processed: false, createdAt: { $gt: since } }).limit(limit);
    let processed = 0;
    for (const evt of events) {
      try {
        // For now, mark processed to prevent repeated backlog; extend with exact re-processing if needed
        evt.processed = true;
        evt.processedAt = new Date();
        await evt.save();
        processed += 1;
      } catch (e) {
        evt.error = e.message;
        await evt.save();
      }
    }
    const remaining = await WebhookEvent.countDocuments({ processed: false });
    return res.json({ success: true, data: { processed, remaining, windowStart: since, batchSize: events.length } });
  } catch (error) {
    handleError(res, error);
  }
};

// Cancel transaction
exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      transactionId,
      sender: getUserId(req),
      status: "pending",
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or cannot be cancelled" });
    }

    await transaction.updateStatus("cancelled");

    return res.json({ success: true, message: "Transaction cancelled successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

// Helper functions
const generateTransactionId = () => {
  return `TRX-${Date.now()}-${crypto.randomUUID()}`;
};

const normalizeProviderName = (provider) => {
  const normalized = String(provider || '').trim().toLowerCase();
  if (normalized === 'airteltigo') return 'airtel_tigo';
  return normalized;
};

const ensureTrackingContainers = (transaction) => {
  transaction.metadata = transaction.metadata || {};
  transaction.gatewayData = transaction.gatewayData || {};
};

const persistProviderTracking = (transaction, provider, data, providerTransactionId) => {
  const normalizedProvider = normalizeProviderName(provider);
  ensureTrackingContainers(transaction);
  transaction.metadata.paymentProvider = normalizedProvider;
  if (providerTransactionId) {
    transaction.metadata.paymentProviderTransactionId = providerTransactionId;
  }
  transaction.gatewayData[normalizedProvider] = data;
  transaction.markModified('metadata');
  transaction.markModified('gatewayData');
};

const resolveStoredPaymentMethod = async (transaction) => {
  if (!transaction?.paymentMethod) {
    return null;
  }
  return PaymentMethod.findById(transaction.paymentMethod);
};

const resolveProviderReference = (transaction, provider) => {
  if (!transaction) {
    return undefined;
  }

  const normalizedProvider = normalizeProviderName(provider || transaction.metadata?.paymentProvider);
  const metadataReference = transaction.metadata?.paymentProviderTransactionId;
  if (metadataReference) {
    return metadataReference;
  }

  const gatewayData = transaction.gatewayData || {};
  const providerData = gatewayData[normalizedProvider]
    || gatewayData.vodafone
    || gatewayData.airteltigo
    || gatewayData.momo;

  if (!providerData) {
    return undefined;
  }

  switch (normalizedProvider) {
    case 'paystack':
      return providerData.reference || providerData.transfer_code;
    case 'mtn_momo':
      return providerData.referenceId;
    case 'vodafone_cash':
      return providerData.paymentId || providerData.referenceId;
    case 'airtel_tigo':
      return providerData.referenceId;
    default:
      return providerData.reference || providerData.id || providerData.referenceId;
  }
};

const processPayment = async (transaction) => {
  try {
    const paymentMethod = await resolveStoredPaymentMethod(transaction);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const provider = normalizeProviderName(paymentMethod.metadata?.provider);

    switch (provider) {
      case "stripe":
        await stripe.processPayment(transaction, paymentMethod);
        break;
      case "paypal":
        await paypal.processPayment(transaction, paymentMethod);
        break;
      case "paystack": {
        const paystack = new PaystackService();
        const resp = await paystack.initializePayment({
          email: (paymentMethod.metadata && paymentMethod.metadata.email) || undefined,
          amount: transaction.amount,
          currency: transaction.currency || 'GHS',
          escrowReference: transaction.relatedContract || transaction.relatedJob,
        });
        if (!resp.success) throw new Error(resp.error?.message || 'Paystack init failed: missing email?');
        persistProviderTracking(transaction, provider, resp.data, resp.data.reference);
        break;
      }
      case "mtn_momo": {
        const momo = new MTNMoMoService();
        const resp = await momo.requestToPay({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata.phoneNumber,
          externalId: transaction.transactionId,
          payerMessage: transaction.description,
          payeeNote: 'Kelmah payment',
        });
        if (!resp.success) throw new Error(resp.error?.message || 'MoMo R2P failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.referenceId);
        break;
      }
      case "vodafone_cash": {
        const voda = new VodafoneCashService();
        const resp = await voda.initiatePayment({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata?.phoneNumber,
          externalId: transaction.transactionId,
          description: transaction.description,
        });
        if (!resp.success) throw new Error(resp.error?.message || 'Vodafone payment failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.paymentId || resp.data.referenceId);
        break;
      }
      case "airtel_tigo": {
        const at = new AirtelTigoService();
        const resp = await at.requestToPay({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata?.phoneNumber,
          externalId: transaction.transactionId,
          description: transaction.description,
        });
        if (!resp.success) throw new Error(resp.error?.message || 'AirtelTigo payment failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.referenceId);
        break;
      }
      default:
        throw new Error("Unsupported payment provider");
    }

    // CRIT-01 FIX: Do NOT credit wallet here — payment is only *initiated*.
    // The wallet should be credited only after a webhook confirms the provider
    // actually collected and settled the funds.  Mark as pending_confirmation
    // so the webhook handler knows to finalise the transfer.
    await transaction.save(); // persist gatewayData
    await transaction.updateStatus("pending_confirmation");
  } catch (error) {
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

const processWithdrawal = async (transaction) => {
  try {
    // CRIT-02 FIX: Deduct wallet balance FIRST with an atomic operation,
    // then send to the external provider.  If the provider call fails we
    // roll back by re-crediting the wallet.
    const deductResult = await Wallet.findOneAndUpdate(
      { user: transaction.sender, balance: { $gte: transaction.amount } },
      { $inc: { balance: -transaction.amount } },
      { new: true }
    );
    if (!deductResult) {
      throw new Error("Insufficient funds");
    }

    const paymentMethod = await resolveStoredPaymentMethod(transaction);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const provider = normalizeProviderName(paymentMethod.metadata?.provider);

    switch (provider) {
      case "stripe":
        await stripe.processWithdrawal(transaction, paymentMethod);
        break;
      case "paypal":
        await paypal.processWithdrawal(transaction, paymentMethod);
        break;
      case "paystack": {
        const paystack = new PaystackService();
        const rec = await paystack.createTransferRecipient({
          type: paymentMethod.metadata.type || 'mobile_money',
          name: paymentMethod.metadata?.accountName || 'Kelmah User',
          account_number: paymentMethod.metadata.accountNumber,
          bank_code: paymentMethod.metadata.bankCode,
          currency: transaction.currency || 'GHS',
        });
        if (!rec.success) throw new Error(rec.error?.message || 'Paystack recipient failed');
        const init = await paystack.initiateTransfer({
          amount: transaction.amount,
          recipient: rec.data.recipient_code,
          reason: transaction.description || 'Kelmah payout',
          currency: transaction.currency || 'GHS',
        });
        if (!init.success) throw new Error(init.error?.message || 'Paystack transfer failed');
        persistProviderTracking(transaction, provider, init.data, init.data.reference || init.data.transfer_code);
        break;
      }
      case "mtn_momo": {
        const momo = new MTNMoMoService();
        const resp = await momo.transfer({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata.phoneNumber,
          externalId: transaction.transactionId,
          payerMessage: 'Kelmah payout',
          payeeNote: transaction.description || 'Payout',
        });
        if (!resp.success) throw new Error(resp.error?.message || 'MoMo payout failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.referenceId);
        break;
      }
      case "vodafone_cash": {
        const voda = new VodafoneCashService();
        const resp = await voda.initiatePayout({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata?.phoneNumber,
          externalId: transaction.transactionId,
          description: transaction.description,
        });
        if (!resp.success) throw new Error(resp.error?.message || 'Vodafone payout failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.payoutId || resp.data.referenceId);
        break;
      }
      case "airtel_tigo": {
        const at = new AirtelTigoService();
        const resp = await at.transfer({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata?.phoneNumber,
          externalId: transaction.transactionId,
          description: transaction.description,
        });
        if (!resp.success) throw new Error(resp.error?.message || 'AirtelTigo payout failed');
        persistProviderTracking(transaction, provider, resp.data, resp.data.referenceId);
        break;
      }
      default:
        throw new Error("Unsupported payment provider");
    }

    // Balance was already deducted atomically above — mark processing until provider confirms
    await transaction.updateStatus("processing");
  } catch (error) {
    // CRIT-02 FIX: Roll back the wallet deduction if the provider call failed
    // (balance was deducted atomically before the provider call)
    try {
      await Wallet.findOneAndUpdate(
        { user: transaction.sender },
        { $inc: { balance: transaction.amount } }
      );
    } catch (rollbackErr) {
      logger.error('CRITICAL: Wallet rollback failed after provider error:', rollbackErr);
      // Log for manual reconciliation — the user lost funds
    }
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

const processRefund = async (transaction) => {
  try {
    const originalTransaction = await Transaction.findOne({
      transactionId: transaction.relatedTransaction,
    });

    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    const paymentMethod = await resolveStoredPaymentMethod(originalTransaction);
    const provider = normalizeProviderName(
      paymentMethod?.metadata?.provider || originalTransaction.metadata?.paymentProvider,
    );
    const providerReference = resolveProviderReference(originalTransaction, provider);

    transaction.paymentMethod = originalTransaction.paymentMethod;

    switch (provider) {
      case "stripe":
        await stripe.processRefund(transaction, originalTransaction);
        persistProviderTracking(
          transaction,
          provider,
          { originalTransactionId: originalTransaction.transactionId },
          providerReference || originalTransaction.transactionId,
        );
        break;
      case "paypal":
        await paypal.processRefund(transaction, originalTransaction);
        persistProviderTracking(
          transaction,
          provider,
          { originalTransactionId: originalTransaction.transactionId },
          providerReference || originalTransaction.transactionId,
        );
        break;
      case 'paystack': {
        if (!providerReference) {
          throw new Error('Original Paystack reference not found');
        }
        const paystack = new PaystackService();
        const refundResult = await paystack.refundPayment(providerReference, {
          amount: transaction.amount,
          currency: originalTransaction.currency || transaction.currency,
          reason: transaction.description || `Refund for ${originalTransaction.transactionId}`,
        });
        if (!refundResult.success) {
          throw new Error(refundResult.error?.message || refundResult.error || 'Paystack refund failed');
        }
        persistProviderTracking(
          transaction,
          provider,
          refundResult.data,
          refundResult.data.refundId || refundResult.data.reference || providerReference,
        );
        break;
      }
      case 'vodafone_cash': {
        if (!providerReference) {
          throw new Error('Original Vodafone reference not found');
        }
        const voda = new VodafoneCashService();
        const refundResult = await voda.refundPayment(providerReference, {
          amount: transaction.amount,
          reason: transaction.description || `Refund for ${originalTransaction.transactionId}`,
        });
        if (!refundResult.success) {
          throw new Error(refundResult.error?.message || refundResult.error || 'Vodafone refund failed');
        }
        persistProviderTracking(
          transaction,
          provider,
          refundResult.data,
          refundResult.data.refundId || refundResult.data.paymentId || providerReference,
        );
        break;
      }
      case 'mtn_momo': {
        if (!paymentMethod?.metadata?.phoneNumber) {
          throw new Error('Refund phone number not available for MTN MoMo payment method');
        }
        const momo = new MTNMoMoService();
        const refundResult = await momo.refundPayment({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata.phoneNumber,
          externalId: transaction.transactionId,
          payerMessage: 'Kelmah refund',
          payeeNote: transaction.description || `Refund for ${originalTransaction.transactionId}`,
          originalReferenceId: providerReference,
        });
        if (!refundResult.success) {
          throw new Error(refundResult.error?.message || refundResult.error || 'MTN MoMo refund failed');
        }
        persistProviderTracking(
          transaction,
          provider,
          refundResult.data,
          refundResult.data.referenceId || providerReference || transaction.transactionId,
        );
        break;
      }
      case 'airtel_tigo': {
        if (!paymentMethod?.metadata?.phoneNumber) {
          throw new Error('Refund phone number not available for AirtelTigo payment method');
        }
        const airtel = new AirtelTigoService();
        const refundResult = await airtel.refundPayment({
          amount: transaction.amount,
          phoneNumber: paymentMethod.metadata.phoneNumber,
          externalId: transaction.transactionId,
          description: transaction.description || `Refund for ${originalTransaction.transactionId}`,
          originalReferenceId: providerReference,
        });
        if (!refundResult.success) {
          throw new Error(refundResult.error?.message || refundResult.error || 'AirtelTigo refund failed');
        }
        persistProviderTracking(
          transaction,
          provider,
          refundResult.data,
          refundResult.data.referenceId || providerReference || transaction.transactionId,
        );
        break;
      }
      default:
        throw new Error("Unsupported payment provider");
    }

    // Update wallets atomically
    const senderUpdate = await Wallet.findOneAndUpdate(
      { user: transaction.sender },
      { $inc: { balance: transaction.amount } },
      { new: true }
    );
    if (!senderUpdate) {
      throw new Error('Sender wallet not found');
    }
    const recipientUpdate = await Wallet.findOneAndUpdate(
      { user: transaction.recipient, balance: { $gte: transaction.amount } },
      { $inc: { balance: -transaction.amount } },
      { new: true }
    );
    if (!recipientUpdate) {
      // Rollback sender credit
      await Wallet.findOneAndUpdate(
        { user: transaction.sender },
        { $inc: { balance: -transaction.amount } }
      );
      throw new Error('Recipient has insufficient funds for refund deduction');
    }

    await transaction.updateStatus("completed");
  } catch (error) {
    await transaction.updateStatus("failed", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }
};

// Internal export for admin batch processor
exports._processWithdrawal = processWithdrawal;
