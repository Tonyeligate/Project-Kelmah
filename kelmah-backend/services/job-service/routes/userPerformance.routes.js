/**
 * User Performance Routes - Manage user performance tracking and tier management
 */

const express = require("express");
const { validate } = require("../middlewares/validator");
const { authenticateUser, authorizeRoles } = require("../middlewares/auth");

const userPerformanceController = require("../controllers/userPerformance.controller");

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// User performance management
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

// Analytics and reporting (admin only)
router.get(
  "/tier/:tier",
  authorizeRoles("admin"),
  userPerformanceController.getUsersByTier
);

router.get(
  "/top-performers",
  authorizeRoles("admin"),
  userPerformanceController.getTopPerformers
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

module.exports = router;
