const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");

// Apply authentication middleware to all routes
router.use(verifyGatewayRequest);

// Wallet routes
router.get("/", walletController.getWallet);
router.get("/balance", walletController.getBalance);
router.post("/", walletController.createOrUpdateWallet);
router.post("/deposit", walletController.deposit);
router.post("/withdraw", walletController.withdraw);
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
