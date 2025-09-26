const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");

// Apply authentication middleware to all routes
router.use(verifyGatewayRequest);

// Transaction routes
router.post("/", transactionController.createTransaction);
router.get("/:transactionId", transactionController.getTransaction);
router.get("/history", transactionController.getTransactionHistory);
router.patch("/:transactionId/cancel", transactionController.cancelTransaction);

module.exports = router;
