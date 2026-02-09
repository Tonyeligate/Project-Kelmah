const express = require("express");
const router = express.Router();
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");
const escrowController = require("../controllers/escrow.controller");

// Protect all escrow endpoints
router.use(verifyGatewayRequest);

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

// Milestone management routes
router.post("/:escrowId/milestones", escrowController.addMilestone);
router.post("/:escrowId/milestones/:milestoneId/complete", escrowController.completeMilestone);
router.post("/:escrowId/milestones/:milestoneId/release", escrowController.releaseMilestonePayment);
// Stub escrow notifications endpoint (unprotected and non-blocking placeholder)
router.post('/:escrowId/notify', async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { event } = req.body || {};
    if (!event) return res.status(400).json({ success: false, message: 'event is required' });
    return res.json({ success: true, message: 'Notification enqueued', data: { escrowId, event } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;






