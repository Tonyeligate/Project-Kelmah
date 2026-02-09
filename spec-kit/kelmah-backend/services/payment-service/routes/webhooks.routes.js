const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const PaystackService = require('../integrations/paystack');
const WebhookEvent = require('../models/WebhookEvent');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const paystack = new PaystackService();

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
    const existing = await WebhookEvent.findOne({ provider: 'stripe', reference: event.id });
    if (existing) return res.json({ received: true, idempotent: true });
    // Persist webhook
    const stored = await WebhookEvent.create({
      provider: 'stripe',
      eventType: event.type,
      reference: event.data?.object?.id,
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
    console.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
    const existing = await WebhookEvent.findOne({ provider: 'paystack', reference: event.data?.reference });
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
    console.error('Paystack webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;



