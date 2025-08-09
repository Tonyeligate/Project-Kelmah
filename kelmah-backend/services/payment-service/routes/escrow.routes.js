const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const escrowController = require("../controllers/escrow.controller");

// Protect all escrow endpoints
router.use(authenticate);

// List escrows for current user
router.get("/", escrowController.getEscrows);

// Get escrow details
router.get("/:escrowId", escrowController.getEscrowDetails);

// Fund an escrow (create)
router.post("/fund", escrowController.fundEscrow);

// Release escrow
router.post("/:escrowId/release", escrowController.releaseEscrow);

// Refund escrow
router.post("/:escrowId/refund", escrowController.refundEscrow);

module.exports = router;






