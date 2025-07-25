const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Protect payment routes
router.use(authenticateUser);

// Stripe integration: ensure STRIPE_SECRET_KEY is set in your .env

// Create payment intent
router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { amount, currency = 'USD', ...options } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      ...options
    });
    res.status(201).json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (error) {
    next(error);
  }
});

// Confirm payment
router.post('/confirm-payment', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId);
    res.json(confirmed);
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/history', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/history`,
      { headers: { Authorization: req.headers.authorization }, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get all payment methods
router.get('/methods', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/methods`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Add a new payment method
router.post('/methods', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/methods`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Delete a payment method
router.delete('/methods/:methodId', async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const response = await axios.delete(
      `${PAYMENT_SERVICE_URL}/api/payments/methods/${methodId}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Set default payment method
router.put('/methods/:methodId/default', async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const response = await axios.put(
      `${PAYMENT_SERVICE_URL}/api/payments/methods/${methodId}/default`,
      null,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get wallet details
router.get('/wallet', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/wallet`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get bills for current user
router.get('/bills', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/bills`,
      { headers: { Authorization: req.headers.authorization }, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Pay a specific bill
router.post('/bills/:billId/pay', async (req, res, next) => {
  try {
    const { billId } = req.params;
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/bills/${billId}/pay`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get transaction history
router.get('/transactions', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/transactions`,
      { headers: { Authorization: req.headers.authorization }, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Create a new transaction (deposit/withdrawal)
router.post('/transactions', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/transactions`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get a specific transaction
router.get('/transactions/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/transactions/${transactionId}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Make a job payment
router.post('/job', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/job`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get escrow contracts for current user
router.get('/escrows', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/escrows`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Release an escrow contract
router.post('/escrows/:escrowId/release', async (req, res, next) => {
  try {
    const { escrowId } = req.params;
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/escrows/${escrowId}/release`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// NEW: Payment settings
router.get('/settings', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/settings`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.put('/settings', async (req, res, next) => {
  try {
    const response = await axios.put(
      `${PAYMENT_SERVICE_URL}/api/payments/settings`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// NEW: Payout methods
router.get('/payout-methods', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/payout-methods`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.post('/payout-methods', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/payout-methods`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.delete('/payout-methods/:methodId', async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const response = await axios.delete(
      `${PAYMENT_SERVICE_URL}/api/payments/payout-methods/${methodId}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.put('/payout-methods/:methodId/default', async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const response = await axios.put(
      `${PAYMENT_SERVICE_URL}/api/payments/payout-methods/${methodId}/default`,
      null,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// NEW: Payout requests
router.post('/payouts', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/payouts`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.get('/payouts', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/payouts`,
      { headers: { Authorization: req.headers.authorization }, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// NEW: Refund requests
router.post('/refunds', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/refunds`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});
router.get('/refunds', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE_URL}/api/payments/refunds`,
      { headers: { Authorization: req.headers.authorization }, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

module.exports = router; 