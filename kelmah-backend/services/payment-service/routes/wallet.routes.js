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
