const express = require('express');
const router = express.Router();

// Temporary 200s to avoid frontend 404s while backend is implemented
router.get('/', async (req, res) => {
  return res.json({ balance: 0, currency: 'GHS' });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { authenticate } = require("../middlewares/auth");

// Apply authentication middleware to all routes
router.use(authenticate);

// Wallet routes
router.get("/", walletController.getWallet);
router.post("/", walletController.createOrUpdateWallet);
router.post("/payment-methods", walletController.addPaymentMethod);
router.delete(
  "/payment-methods/:paymentMethodId",
  walletController.removePaymentMethod,
);
router.patch(
  "/payment-methods/:paymentMethodId/default",
  walletController.setDefaultPaymentMethod,
);
router.get("/transactions", walletController.getTransactionHistory);

module.exports = router;
