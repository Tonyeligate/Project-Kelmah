/**
 * User Performance Routes - Manage user performance tracking and tier management
 */

const express = require("express");
const { validate } = require("../middlewares/validator");
const { verifyGatewayRequest, optionalGatewayVerification } = require("../../../shared/middlewares/serviceTrust");
const { errorResponse } = require("../utils/response");

const userPerformanceController = require("../controllers/userPerformance.controller");

// Authorization helper function
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return errorResponse(res, 401, "Not authenticated", "NOT_AUTHENTICATED");
  }
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 403, "Forbidden: insufficient role", "FORBIDDEN");
  }
  next();
};

const router = express.Router();

// All routes require authentication
router.use(verifyGatewayRequest);

// Analytics and reporting (admin only) - literal routes BEFORE parameterized routes
router.get(
  "/top-performers",
  authorizeRoles("admin"),
  userPerformanceController.getTopPerformers
);

router.get(
  "/analytics",
  authorizeRoles("admin"),
  userPerformanceController.getPerformanceAnalytics
);

router.patch(
  "/recalculate-tiers",
  authorizeRoles("admin"),
  userPerformanceController.recalculateAllTiers
);

router.get(
  "/tier/:tier",
  authorizeRoles("admin"),
  userPerformanceController.getUsersByTier
);

router.get(
  "/location/:region",
  authorizeRoles("admin"),
  userPerformanceController.getUsersByLocation
);

router.get(
  "/skill/:skill",
  authorizeRoles("admin"),
  userPerformanceController.getUsersBySkill
);

// User performance management - parameterized routes LAST
router.get(
  "/:userId",
  userPerformanceController.getUserPerformance
);

router.patch(
  "/:userId",
  userPerformanceController.updateUserPerformance
);

router.patch(
  "/:userId/location-preferences",
  userPerformanceController.updateLocationPreferences
);

// Skill verification (admin only)
router.patch(
  "/:userId/verify-skill",
  authorizeRoles("admin"),
  userPerformanceController.verifySkill
);

// Tier management (admin only)
router.patch(
  "/:userId/tier",
  authorizeRoles("admin"),
  userPerformanceController.updateUserTier
);

module.exports = router;
