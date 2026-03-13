/**
 * Authentication Routes
 */

const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { verifyGatewayRequest } = require("../../../shared/middlewares/serviceTrust");
const { createLimiter } = require("../middlewares/rateLimiter");
const SecurityUtils = require("../utils/security");
const { validate } = require("../utils/validation");
const passport = require("../config/passport");
const { logger } = require("../utils/logger");

const router = express.Router();

const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || 'kelmah_refresh_token';

const hydrateRefreshTokenFromCookie = (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }

  if (req.body.refreshToken) {
    return next();
  }

  const cookieToken = req.cookies?.[refreshCookieName];
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    req.body.refreshToken = cookieToken;
  }

  return next();
};

const buildStrictPasswordValidation = (fieldName) =>
  body(fieldName).custom((value) => {
    const passwordValidation = SecurityUtils.validatePassword(value);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    return true;
  });

// Registration route with validation
router.post(
  "/register",
  createLimiter("register"),
  [
    body("email").isEmail().withMessage("Please enter a valid email address"),
    buildStrictPasswordValidation("password"),
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("role")
      .optional()
      .isIn(["worker", "hirer"])
      .withMessage("Role must be either worker or hirer"),
  ],
  validate,
  authController.register,
);

// Login route with validation
router.post(
  "/login",
  createLimiter("login"),
  [
    body("email").isEmail().withMessage("Please enter a valid email address"),
    body("password").notEmpty().withMessage("Password is required").isLength({ max: 128 }).withMessage("Password too long"),
  ],
  validate,
  authController.login,
);

// Email verification route (matches frontend call)
router.get("/verify-email/:token", createLimiter("verificationToken"), authController.verifyEmail);

// Resend verification email (matches frontend call)
router.post(
  "/resend-verification-email",
  createLimiter("emailVerification"),
  [body("email").isEmail().withMessage("Please enter a valid email address")],
  validate,
  authController.resendVerificationEmail,
);

// Forgot password
router.post(
  "/forgot-password",
  createLimiter("forgotPassword"),
  [body("email").isEmail().withMessage("Please enter a valid email address")],
  validate,
  authController.forgotPassword,
);

// Reset password
router.post(
  "/reset-password/:token",
  createLimiter("forgotPassword"),
  [
    buildStrictPasswordValidation("password"),
  ],
  validate,
  authController.resetPassword,
);

// Backward-compatible reset route that accepts token in body
router.post(
  "/reset-password",
  createLimiter("forgotPassword"),
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    buildStrictPasswordValidation("password"),
  ],
  validate,
  (req, res, next) => {
    // Map body token to params to reuse controller logic
    req.params.token = req.body.token;
    return authController.resetPassword(req, res, next);
  }
);

// Logout route
router.post("/logout", verifyGatewayRequest, authController.logout);

// Refresh token
router.post(
  "/refresh-token",
  createLimiter("auth"),
  hydrateRefreshTokenFromCookie,
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  authController.refreshToken,
);

router.post(
  "/refresh",
  createLimiter("auth"),
  hydrateRefreshTokenFromCookie,
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  authController.refreshToken,
);

// Exchange short-lived OAuth auth code for tokens (CRIT-04 fix)
router.post(
  "/oauth/exchange",
  createLimiter("login"),
  [body("code").notEmpty().withMessage("Authorization code is required")],
  validate,
  authController.exchangeOAuthCode,
);

// Change password (protected route)
router.post(
  "/change-password",
  verifyGatewayRequest,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    buildStrictPasswordValidation("newPassword"),
  ],
  validate,
  authController.changePassword,
);

// Get current user profile
router.get("/me", verifyGatewayRequest, authController.getMe);

// Verify authentication token and get user data
router.get("/verify", verifyGatewayRequest, authController.verifyAuth);
router.post("/validate", createLimiter("validateToken"), authController.validateAuthToken);

// Google OAuth routes - only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    }),
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    }),
    authController.googleCallback,
  );
} else {
  // Add a route to inform users that Google auth is not configured
  router.get("/google", (req, res) => {
    logger.warn("Google OAuth route accessed but not configured");
    return res.status(501).json({
      success: false,
      message: "Google authentication is not configured on the server",
    });
  });

  router.get("/google/callback", (req, res) => {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_not_configured`,
    );
  });
}

// Facebook OAuth routes - only if credentials are configured
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get(
    "/facebook",
    passport.authenticate("facebook", {
      scope: ["email"],
    }),
  );

  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    }),
    authController.facebookCallback,
  );
} else {
  // Add a route to inform users that Facebook auth is not configured
  router.get("/facebook", (req, res) => {
    logger.warn("Facebook OAuth route accessed but not configured");
    return res.status(501).json({
      success: false,
      message: "Facebook authentication is not configured on the server",
    });
  });

  router.get("/facebook/callback", (req, res) => {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_not_configured`,
    );
  });
}

// LinkedIn OAuth routes - only if credentials are configured
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  router.get(
    "/linkedin",
    passport.authenticate("linkedin", {
      scope: ["r_emailaddress", "r_liteprofile"],
    }),
  );

  router.get(
    "/linkedin/callback",
    passport.authenticate("linkedin", {
      failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    }),
    authController.linkedinCallback,
  );
} else {
  // Add a route to inform users that LinkedIn auth is not configured
  router.get("/linkedin", (req, res) => {
    logger.warn("LinkedIn OAuth route accessed but not configured");
    return res.status(501).json({
      success: false,
      message: "LinkedIn authentication is not configured on the server",
    });
  });

  router.get("/linkedin/callback", (req, res) => {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_not_configured`,
    );
  });
}

// MFA routes (protected by authentication + rate limiting to prevent brute force - H7)
router.post("/mfa/setup", verifyGatewayRequest, createLimiter("mfaSetup"), authController.mfaSetup);
router.post("/mfa/verify", verifyGatewayRequest, createLimiter("mfaVerify"), authController.verifyTwoFactor);
router.post("/mfa/disable", verifyGatewayRequest, createLimiter("mfaDisable"), authController.disableTwoFactor);

// Session management routes
router.get("/sessions", verifyGatewayRequest, authController.getSessions);
router.delete("/sessions", verifyGatewayRequest, authController.endAllSessions);
router.delete("/sessions/:sessionId", verifyGatewayRequest, authController.endSession);

// User account management routes
router.post(
  "/account/deactivate",
  verifyGatewayRequest,
  authController.deactivateAccount,
);
router.post("/account/reactivate", createLimiter("reactivateAccount"), authController.reactivateAccount);

// Health check route - useful for monitoring
router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Auth service is up and running",
  });
});

// Admin/monitoring routes
const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
router.get("/stats", verifyGatewayRequest, requireAdmin, authController.getAuthStats);

module.exports = router;
