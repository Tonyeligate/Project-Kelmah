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

// Release escrow
router.post("/:escrowId/release", escrowController.releaseEscrow);

module.exports = router;






