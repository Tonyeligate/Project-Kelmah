const express = require("express");
const { authenticate } = require("../middlewares/auth");
const stripeService = require("../services/stripe");
const paypalService = require("../services/paypal");
const ghanaPayments = require("../controllers/ghana.controller");
const router = express.Router();
const payoutAdminController = require('../controllers/payoutAdmin.controller');
const PaystackService = require("../integrations/paystack");
const paystack = new PaystackService();

// Protect all payment endpoints
router.use(authenticate);
// Per-route policies
const { createLimiter } = require('../../auth-service/middlewares/rateLimiter');

// Create a new payment intent/order
// Durable idempotency store (MongoDB model, optionally Redis)
const IdempotencyKey = require('../models/IdempotencyKey');
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
    res.status(201).json(response);
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
    res.json(result);
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

module.exports = router;

// ---------------------------------------------
// 🇬🇭 Ghana Mobile Money Endpoints (frontend expects these)
// Apply auth to these routes as well
router.use(authenticate);

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
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await paystack.verifyPayment(reference);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin payout queue endpoints
router.post('/admin/payouts/queue', payoutAdminController.enqueuePayout);
router.post('/admin/payouts/process', payoutAdminController.processBatch);
router.get('/admin/payouts', payoutAdminController.listPayouts);
