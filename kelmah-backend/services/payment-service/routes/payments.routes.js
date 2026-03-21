const express = require("express");
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");
const stripeService = require("../services/stripe");
const paypalService = require("../services/paypal");
const ghanaPayments = require("../controllers/ghana.controller");
const router = express.Router();
const payoutAdminController = require('../controllers/payoutAdmin.controller');
const PaystackService = require("../integrations/paystack");
const paymentController = require('../controllers/payment.controller');
const { Wallet, Payment, Transaction } = require('../models');
const paystack = new PaystackService();
const smsVerificationStore = new Map();

// Protect all payment endpoints
router.use(verifyGatewayRequest);
// Per-route policies
const { createLimiter } = require('../../../shared/middlewares/rateLimiter');

// Create a new payment intent/order
// Durable idempotency store (MongoDB model, optionally Redis)
const { IdempotencyKey } = require('../models');
let redisClient = null;
try {
  const Redis = require('ioredis');
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
} catch (_) {}

router.post("/create-payment-intent", createLimiter('payments'), async (req, res, next) => {
  try {
    const { amount, currency, provider = "stripe", idempotencyKey, ...options } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey is required' });
    }
    // Redis fast-path check
    if (redisClient) {
      const exists = await redisClient.get(`idemp:${idempotencyKey}`);
      if (exists) return res.status(200).json(JSON.parse(exists));
    }
    // Mongo durable guard
    const found = await IdempotencyKey.findOne({ key: idempotencyKey, scope: 'payment_intent' });
    if (found && found.status === 'completed' && found.response) {
      return res.status(200).json(found.response);
    }
    if (!found) {
      await IdempotencyKey.create({ key: idempotencyKey, scope: 'payment_intent', status: 'processing', ttl: new Date(Date.now() + 7*24*60*60*1000) });
    }
    let intent;
    switch (provider) {
      case "stripe":
        intent = await stripeService.createPaymentIntent(
          amount,
          (currency || "usd").toLowerCase(),
          { ...options, idempotencyKey },
        );
        break;
      case "paypal":
        intent = await paypalService.createPaymentIntent(amount, currency);
        break;
      default:
        throw new Error("Unsupported payment provider");
    }
    const response = {
      success: true,
      clientSecret: intent.client_secret || intent.id,
      ...intent,
    };
    await IdempotencyKey.findOneAndUpdate(
      { key: idempotencyKey, scope: 'payment_intent' },
      { status: 'completed', response },
      { upsert: true }
    );
    if (redisClient) await redisClient.setex(`idemp:${idempotencyKey}`, 3600, JSON.stringify(response));
    return res.status(201).json(response);
  } catch (error) {
    if (req.body?.idempotencyKey) {
      await IdempotencyKey.findOneAndUpdate(
        { key: req.body.idempotencyKey, scope: 'payment_intent' },
        { status: 'failed', error: error.message }
      );
    }
    next(error);
  }
});

// Confirm an existing payment intent/order
router.post("/confirm-payment", createLimiter('payments'), async (req, res, next) => {
  try {
    const { paymentIntentId, provider = "stripe" } = req.body;
    let result;
    switch (provider) {
      case "stripe":
        result = await stripeService.confirmPayment(paymentIntentId);
        break;
      case "paypal":
        result = await paypalService.confirmPayment(paymentIntentId);
        break;
      default:
        throw new Error("Unsupported payment provider");
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get("/history", async (req, res, next) => {
  try {
    const transactionController = require("../controllers/transaction.controller");
    return transactionController.getTransactionHistory(req, res);
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// 🇬🇭 Ghana Mobile Money Endpoints (frontend expects these)

// MTN MoMo
router.post('/mtn-momo/request-to-pay', createLimiter('payments'), ghanaPayments.mtnRequestToPay);
router.get('/mtn-momo/status/:referenceId', ghanaPayments.mtnStatus);
router.post('/mtn-momo/validate', ghanaPayments.mtnValidate);

// Vodafone Cash
router.post('/vodafone-cash/request-to-pay', createLimiter('payments'), ghanaPayments.vodafoneRequestToPay);
router.get('/vodafone-cash/status/:referenceId', ghanaPayments.vodafoneStatus);

// AirtelTigo Money
router.post('/airteltigo/request-to-pay', createLimiter('payments'), ghanaPayments.airtelRequestToPay);
router.get('/airteltigo/status/:referenceId', ghanaPayments.airtelStatus);

// Paystack initialize and verify (card/bank)
router.post('/paystack/initialize', createLimiter('payments'), async (req, res) => {
  try {
    const { email, amount, currency = 'GHS', reference, metadata = {}, channels } = req.body;
    if (!email || !amount) return res.status(400).json({ success: false, message: 'email and amount are required' });
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const result = await paystack.initializePayment({ email, amount, currency, reference, metadata, channels });
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await paystack.verifyPayment(reference);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// Admin payout queue endpoints — require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Admin access required', code: 'FORBIDDEN' } });
  }
  next();
};
router.post('/admin/payouts/queue', requireAdmin, payoutAdminController.enqueuePayout);
router.post('/admin/payouts/process', requireAdmin, payoutAdminController.processBatch);
router.get('/admin/payouts', requireAdmin, payoutAdminController.listPayouts);

// Frontend compatibility aliases
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const [payments, transactions] = await Promise.all([
      Payment.find({ userId }).lean(),
      Transaction.find({ $or: [{ sender: userId }, { recipient: userId }] }).lean(),
    ]);

    const totalPaid = payments
      .filter((p) => p.type !== 'PAYOUT' && p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalPayouts = payments
      .filter((p) => p.type === 'PAYOUT' && ['PROCESSING', 'COMPLETED'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        totalPaid,
        totalPayouts,
        paymentCount: payments.length,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to load payment analytics', code: 'ANALYTICS_FETCH_FAILED' },
    });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const wallet = await Wallet.findOne({ user: userId }).lean();
    const settings = wallet?.metadata?.paymentSettings || {
      autoReleaseEscrow: false,
      smsNotifications: true,
      defaultCurrency: wallet?.currency || 'GHS',
    };
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payment settings', code: 'SETTINGS_FETCH_FAILED' },
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const settings = req.body || {};
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: { user: userId, balance: 0, currency: 'GHS' },
        $set: { 'metadata.paymentSettings': settings },
      },
      { new: true, upsert: true },
    ).lean();

    return res.json({ success: true, data: wallet?.metadata?.paymentSettings || settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update payment settings', code: 'SETTINGS_UPDATE_FAILED' },
    });
  }
});

router.post('/payout/worker', createLimiter('payments'), (req, res) => {
  const { provider, method, phoneNumber, amount, description, bankCode, accountNumber, accountName } = req.body || {};
  const normalizedMethod = method
    || (provider === 'mtn' ? 'mtn_momo'
      : provider === 'vodafone' ? 'vodafone_cash'
        : provider === 'airteltigo' ? 'airtel_tigo'
          : provider === 'bank' ? 'paystack_bank'
            : 'mtn_momo');

  req.body = {
    ...req.body,
    method: normalizedMethod,
    phoneNumber,
    amount,
    description,
    bankCode,
    accountNumber,
    accountName,
  };

  return paymentController.processPayout(req, res);
});

router.get('/payout/status/:payoutId', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { payoutId } = req.params;
    const payout = await Payment.findOne({
      userId,
      $or: [
        { _id: payoutId },
        { providerTransactionId: payoutId },
      ],
    }).lean();

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payout not found', code: 'PAYOUT_NOT_FOUND' },
      });
    }

    return res.json({
      success: true,
      data: {
        payoutId: payout._id,
        status: payout.status,
        amount: payout.amount,
        method: payout.method,
        providerTransactionId: payout.providerTransactionId,
        updatedAt: payout.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payout status', code: 'PAYOUT_STATUS_FAILED' },
    });
  }
});

router.post('/sms-verification/send', createLimiter('payments'), async (req, res) => {
  const { phoneNumber, purpose = 'payment', amount } = req.body || {};
  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      error: { message: 'phoneNumber is required', code: 'PHONE_REQUIRED' },
    });
  }

  const verificationId = `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  smsVerificationStore.set(verificationId, {
    code,
    phoneNumber,
    purpose,
    amount,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    data: {
      verificationId,
      expiresInSeconds: 300,
      // Exposed in non-production for local QA; production should use real SMS delivery.
      code: process.env.NODE_ENV === 'production' ? undefined : code,
    },
  });
});

router.post('/sms-verification/verify', createLimiter('payments'), async (req, res) => {
  const { verificationId, code } = req.body || {};
  const record = smsVerificationStore.get(verificationId);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: { message: 'Verification not found', code: 'VERIFICATION_NOT_FOUND' },
    });
  }

  if (Date.now() > record.expiresAt) {
    smsVerificationStore.delete(verificationId);
    return res.status(410).json({
      success: false,
      error: { message: 'Verification expired', code: 'VERIFICATION_EXPIRED' },
    });
  }

  if (String(record.code) !== String(code || '')) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid verification code', code: 'INVALID_VERIFICATION_CODE' },
    });
  }

  smsVerificationStore.delete(verificationId);
  return res.json({ success: true, data: { verified: true } });
});

module.exports = router;
