/**
 * Bid Routes - Enhanced Application Routes with Bidding System
 */

const express = require("express");
const { validate } = require("../middlewares/validator");
const { authenticateUser, authorizeRoles } = require("../middlewares/auth");
let createLimiter;
try {
  ({ createLimiter } = require('../../auth-service/middlewares/rateLimiter'));
} catch (_) {
  // Fallback: no-op limiter to avoid crashing when shared limiter isn't available
  createLimiter = () => (req, res, next) => next();
}

const bidController = require("../controllers/bid.controller");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Bid management routes
router.post(
  "/",
  authorizeRoles("worker"),
  createLimiter('default'),
  bidController.createBid
);

router.get(
  "/job/:jobId",
  authorizeRoles("hirer"),
  bidController.getJobBids
);

router.get(
  "/worker/:workerId",
  bidController.getWorkerBids
);

router.get(
  "/:bidId",
  bidController.getBidById
);

// Bid actions
router.patch(
  "/:bidId/accept",
  authorizeRoles("hirer"),
  bidController.acceptBid
);

router.patch(
  "/:bidId/reject",
  authorizeRoles("hirer"),
  bidController.rejectBid
);

router.patch(
  "/:bidId/withdraw",
  authorizeRoles("worker"),
  bidController.withdrawBid
);

router.patch(
  "/:bidId/modify",
  authorizeRoles("worker"),
  bidController.modifyBid
);

// Statistics and analytics
router.get(
  "/stats/worker/:workerId",
  bidController.getWorkerBidStats
);

// Admin routes
router.get(
  "/expired",
  authorizeRoles("admin"),
  bidController.getExpiredBids
);

router.patch(
  "/cleanup/expired",
  authorizeRoles("admin"),
  bidController.cleanupExpiredBids
);

module.exports = router;
