const express = require('express');
const { authenticate } = require('../middlewares/auth');
const stripeService = require('../services/stripe');
const paypalService = require('../services/paypal');
const router = express.Router();

// Protect all payment endpoints
router.use(authenticate);

// Create a new payment intent/order
router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { amount, currency, provider = 'stripe', ...options } = req.body;
    let intent;
    switch (provider) {
      case 'stripe':
        intent = await stripeService.createPaymentIntent(amount, (currency || 'usd').toLowerCase(), options);
        break;
      case 'paypal':
        intent = await paypalService.createPaymentIntent(amount, currency);
        break;
      default:
        throw new Error('Unsupported payment provider');
    }
    res.status(201).json({
      clientSecret: intent.client_secret || intent.id,
      ...intent
    });
  } catch (error) {
    next(error);
  }
});

// Confirm an existing payment intent/order
router.post('/confirm-payment', async (req, res, next) => {
  try {
    const { paymentIntentId, provider = 'stripe' } = req.body;
    let result;
    switch (provider) {
      case 'stripe':
        result = await stripeService.confirmPayment(paymentIntentId);
        break;
      case 'paypal':
        result = await paypalService.confirmPayment(paymentIntentId);
        break;
      default:
        throw new Error('Unsupported payment provider');
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/history', async (req, res, next) => {
  try {
    const transactionController = require('../controllers/transaction.controller');
    return transactionController.getTransactionHistory(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 