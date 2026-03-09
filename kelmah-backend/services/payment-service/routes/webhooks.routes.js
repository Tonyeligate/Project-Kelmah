const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const Stripe = require('stripe');
const PaystackService = require('../integrations/paystack');
const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const { WebhookEvent, Escrow, Transaction } = require('../models');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const paystack = new PaystackService();
const mtnMomo = new MTNMoMoService();
let vodafoneCash;
try { vodafoneCash = new VodafoneCashService(); } catch (e) { vodafoneCash = null; }

// Stripe webhook with signature verification and idempotency
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      return res.status(400).send('Webhook secret not configured');
    }
    // Idempotency guard
    const existing = await WebhookEvent.findOne({ provider: 'stripe', reference: event.id, eventType: event.type });
    if (existing) return res.json({ received: true, idempotent: true });
    // Persist webhook
    const stored = await WebhookEvent.create({
      provider: 'stripe',
      eventType: event.type,
      reference: event.id,
      payload: event,
      signature: sig,
      processed: false
    });

    // Process key events to update escrow/transactions
    if (event.type === 'charge.refunded' || event.type === 'payment_intent.succeeded') {
      try {
        const ref = event.data?.object?.metadata?.escrowReference || event.data?.object?.id;
        if (ref) {
          const escrow = await Escrow.findOne({ reference: ref });
          if (escrow) {
            if (event.type === 'payment_intent.succeeded' && escrow.status === 'pending') {
              escrow.status = 'active';
              await escrow.save();
            }
            if (event.type === 'charge.refunded' && escrow.status !== 'refunded') {
              escrow.status = 'refunded';
              escrow.refundedAt = new Date();
              await escrow.save();
            }
          }
        }
        stored.processed = true;
        stored.processedAt = new Date();
        await stored.save();
      } catch (e) {
        stored.error = e.message;
        await stored.save();
      }
    }

    return res.json({ received: true, type: event.type });
  } catch (err) {
    logger.error('Stripe webhook error:', err.message);
    return res.status(400).send('Webhook Error: Invalid webhook payload');
  }
});

// Paystack webhook with signature verification and idempotency
router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const payload = req.body.toString();
    const result = paystack.processWebhook(payload, signature);
    if (!result.success) return res.status(400).json(result);
    const event = result.data;
    // Idempotency guard
    const existing = await WebhookEvent.findOne({ provider: 'paystack', reference: event.data?.reference, eventType: event.event });
    if (existing) return res.json({ received: true, idempotent: true });
    const stored = await WebhookEvent.create({
      provider: 'paystack',
      eventType: event.event,
      reference: event.data?.reference,
      payload: event,
      signature,
      processed: false
    });

    // Update escrow based on event
    try {
      const ref = event.data?.metadata?.escrowReference || event.data?.reference;
      if (ref) {
        const escrow = await Escrow.findOne({ reference: ref });
        if (escrow) {
          if (event.event === 'charge.success' && escrow.status === 'pending') {
            escrow.status = 'active';
            await escrow.save();
          }
          if (event.event === 'refund.processed' && escrow.status !== 'refunded') {
            escrow.status = 'refunded';
            escrow.refundedAt = new Date();
            await escrow.save();
          }
        }
      }
      stored.processed = true;
      stored.processedAt = new Date();
      await stored.save();
    } catch (e) {
      stored.error = e.message;
      await stored.save();
    }

    return res.json({ received: true, event: event.event });
  } catch (err) {
    logger.error('Paystack webhook error:', err.message);
    return res.status(400).send('Webhook Error: Invalid webhook payload');
  }
});

// MTN MoMo webhook with signature verification and idempotency
router.post('/mtn-momo', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-mtn-signature'] || req.headers['x-callback-signature'] || '';
    const payload = req.body.toString();
    let webhookData;
    try { webhookData = JSON.parse(payload); } catch { return res.status(400).send('Invalid JSON'); }

    const result = mtnMomo.processWebhook(webhookData, signature);
    if (!result.success) return res.status(400).json(result);
    const event = result.data;

    // Idempotency guard
    const existing = await WebhookEvent.findOne({ provider: 'mtn_momo', reference: event.referenceId, eventType: event.status });
    if (existing) return res.json({ received: true, idempotent: true });

    const stored = await WebhookEvent.create({
      provider: 'mtn_momo',
      eventType: event.status,
      reference: event.referenceId,
      payload: webhookData,
      signature,
      processed: false
    });

    // Update escrow based on event
    try {
      const ref = event.externalId || event.referenceId;
      if (ref) {
        const escrow = await Escrow.findOne({ $or: [{ reference: ref }, { 'paymentDetails.referenceId': ref }] });
        if (escrow) {
          if (event.status === 'SUCCESSFUL' && escrow.status === 'pending') {
            escrow.status = 'active';
            await escrow.save();
          }
          if (event.status === 'FAILED' && escrow.status === 'pending') {
            escrow.status = 'failed';
            await escrow.save();
          }
        }
      }
      stored.processed = true;
      stored.processedAt = new Date();
      await stored.save();
    } catch (e) {
      stored.error = e.message;
      await stored.save();
    }

    return res.json({ received: true, status: event.status });
  } catch (err) {
    logger.error('MTN MoMo webhook error:', err.message);
    return res.status(400).send('Webhook Error: Invalid webhook payload');
  }
});

// Vodafone Cash webhook with signature verification and idempotency
router.post('/vodafone', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-vodafone-signature'] || req.headers['x-callback-signature'] || '';
    const payload = req.body.toString();
    let webhookData;
    try { webhookData = JSON.parse(payload); } catch { return res.status(400).send('Invalid JSON'); }

    // Verify signature
    if (vodafoneCash && !vodafoneCash.verifyWebhookSignature(webhookData, signature)) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const reference = webhookData.transactionId || webhookData.referenceId || webhookData.reference;
    const status = webhookData.status || webhookData.transactionStatus;

    // Idempotency guard
    const existing = await WebhookEvent.findOne({ provider: 'vodafone_cash', reference, eventType: status });
    if (existing) return res.json({ received: true, idempotent: true });

    const stored = await WebhookEvent.create({
      provider: 'vodafone_cash',
      eventType: status,
      reference,
      payload: webhookData,
      signature,
      processed: false
    });

    // Update escrow based on event
    try {
      if (reference) {
        const escrow = await Escrow.findOne({ $or: [{ reference }, { 'paymentDetails.referenceId': reference }] });
        if (escrow) {
          const successStatuses = ['SUCCESS', 'SUCCESSFUL', 'success', 'completed'];
          const failStatuses = ['FAILED', 'FAILURE', 'failed', 'declined'];
          if (successStatuses.includes(status) && escrow.status === 'pending') {
            escrow.status = 'active';
            await escrow.save();
          }
          if (failStatuses.includes(status) && escrow.status === 'pending') {
            escrow.status = 'failed';
            await escrow.save();
          }
        }
      }
      stored.processed = true;
      stored.processedAt = new Date();
      await stored.save();
    } catch (e) {
      stored.error = e.message;
      await stored.save();
    }

    return res.json({ received: true, status });
  } catch (err) {
    logger.error('Vodafone Cash webhook error:', err.message);
    return res.status(400).send('Webhook Error: Invalid webhook payload');
  }
});

// AirtelTigo webhook with signature verification and idempotency
router.post('/airtel-tigo', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-airteltigo-signature'] || req.headers['x-callback-signature'] || '';
    const payload = req.body.toString();
    let webhookData;
    try { webhookData = JSON.parse(payload); } catch { return res.status(400).send('Invalid JSON'); }

    // Verify HMAC signature
    const webhookSecret = process.env.AIRTELTIGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const crypto = require('crypto');
      const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature || '', 'hex'), Buffer.from(expected, 'hex'))) {
        return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      }
    } else {
      logger.error('SECURITY: AirtelTigo webhook secret not configured — rejecting webhook');
      return res.status(400).json({ success: false, error: 'Webhook verification not configured' });
    }

    const reference = webhookData.transactionId || webhookData.referenceId || webhookData.reference;
    const status = webhookData.status || webhookData.transactionStatus;

    // Idempotency guard
    const existing = await WebhookEvent.findOne({ provider: 'airtel_tigo', reference, eventType: status });
    if (existing) return res.json({ received: true, idempotent: true });

    const stored = await WebhookEvent.create({
      provider: 'airtel_tigo',
      eventType: status,
      reference,
      payload: webhookData,
      signature,
      processed: false
    });

    // Update escrow based on event
    try {
      if (reference) {
        const escrow = await Escrow.findOne({ $or: [{ reference }, { 'paymentDetails.referenceId': reference }] });
        if (escrow) {
          const successStatuses = ['SUCCESS', 'SUCCESSFUL', 'success', 'completed'];
          const failStatuses = ['FAILED', 'FAILURE', 'failed', 'declined'];
          if (successStatuses.includes(status) && escrow.status === 'pending') {
            escrow.status = 'active';
            await escrow.save();
          }
          if (failStatuses.includes(status) && escrow.status === 'pending') {
            escrow.status = 'failed';
            await escrow.save();
          }
        }
      }
      stored.processed = true;
      stored.processedAt = new Date();
      await stored.save();
    } catch (e) {
      stored.error = e.message;
      await stored.save();
    }

    return res.json({ received: true, status });
  } catch (err) {
    logger.error('AirtelTigo webhook error:', err.message);
    return res.status(400).send('Webhook Error: Invalid webhook payload');
  }
});

module.exports = router;



