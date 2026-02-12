/**
 * Subscription Routes — Stub implementation
 *
 * The API Gateway exposes /api/payments/subscriptions CRUD endpoints and the
 * frontend Premium page shows upgrade tiers.  This file provides the route
 * skeleton so that proxied requests from the gateway receive proper responses
 * instead of 404s.  Full Paystack/Stripe subscription integration should
 * replace these stubs once the product requirements are finalized.
 */

const express = require("express");
const router = express.Router();
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");

// All subscription routes require authentication
router.use(verifyGatewayRequest);

// Available subscription tiers (matches PremiumPage UI)
const TIERS = {
  basic: { name: "Basic", priceGHS: 49.99, features: ["verified_badge", "priority_placement"] },
  pro: { name: "Pro", priceGHS: 99.99, features: ["verified_badge", "priority_placement", "unlimited_applications", "direct_messaging"] },
  business: { name: "Business", priceGHS: 199.99, features: ["verified_badge", "priority_placement", "unlimited_applications", "direct_messaging", "analytics_dashboard", "contract_templates"] },
};

// GET /api/payments/subscriptions — list user's subscriptions
router.get("/", async (req, res) => {
  // TODO: query Subscription model once created
  res.json({
    success: true,
    data: [],
    message: "No active subscriptions. Upgrade via the Premium page.",
    availableTiers: TIERS,
  });
});

// POST /api/payments/subscriptions — create a new subscription
router.post("/", async (req, res) => {
  const { tier } = req.body;

  if (!tier || !TIERS[tier]) {
    return res.status(400).json({
      success: false,
      message: `Invalid tier. Choose one of: ${Object.keys(TIERS).join(", ")}`,
    });
  }

  // TODO: integrate with Paystack/Stripe subscription creation
  res.status(501).json({
    success: false,
    message: "Subscription creation is not yet implemented. Coming soon!",
    tier: TIERS[tier],
  });
});

// PUT /api/payments/subscriptions/:subscriptionId — update subscription
router.put("/:subscriptionId", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Subscription update is not yet implemented.",
  });
});

// DELETE /api/payments/subscriptions/:subscriptionId — cancel subscription
router.delete("/:subscriptionId", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Subscription cancellation is not yet implemented.",
  });
});

module.exports = router;
