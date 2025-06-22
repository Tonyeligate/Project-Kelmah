const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const axios = require('axios');

const router = express.Router();

// Protect payment routes
router.use(authenticateUser);

// Payment-service base URL
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005';

// Create payment intent
router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/create-payment-intent`,
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

// Confirm payment
router.post('/confirm-payment', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/confirm-payment`,
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

module.exports = router; 