/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const { authenticate } = require('../middlewares/auth');
const { createLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../utils/validation');
const passport = require('../config/passport');
const { logger } = require('../utils/logger');
const validationMiddleware = require('../middleware/validation.middleware');

const router = express.Router();

// Registration route with validation
router.post(
  '/register',
  createLimiter('register'),
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role')
      .optional()
      .isIn(['worker', 'hirer'])
      .withMessage('Role must be either worker or hirer'),
  ],
  validate,
  authController.register
);

// Login route with validation
router.post(
  '/login',
  createLimiter('login'),
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// Email verification route
router.get('/verify/:token', authController.verifyEmail);

// Resend verification email
router.post(
  '/resend-verification',
  createLimiter('emailVerification'),
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
  ],
  validate,
  authController.resendVerificationEmail
);

// Forgot password
router.post(
  '/forgot-password',
  createLimiter('forgotPassword'),
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
  ],
  validate,
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter'),
  ],
  validate,
  authController.resetPassword
);

// Logout route
router.post('/logout', authController.logout);

// Refresh token
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  validate,
  authController.refreshToken
);

// Change password (protected route)
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter'),
  ],
  validate,
  authController.changePassword
);

// Get current user profile
router.get('/me', authenticate, authController.getMe);

// Verify authentication token and get user data
router.get('/verify', authenticate, authController.verifyAuth);

// Google OAuth routes - only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  }));

  router.get('/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` 
    }),
    authController.oauthCallback
  );
} else {
  // Add a route to inform users that Google auth is not configured
  router.get('/google', (req, res) => {
    logger.warn('Google OAuth route accessed but not configured');
    return res.status(501).json({
      success: false,
      message: 'Google authentication is not configured on the server'
    });
  });

  router.get('/google/callback', (req, res) => {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  });
}

// Facebook OAuth routes - only if credentials are configured
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email'] 
  }));

  router.get('/facebook/callback', 
    passport.authenticate('facebook', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    }),
    authController.oauthCallback
  );
} else {
  // Add a route to inform users that Facebook auth is not configured
  router.get('/facebook', (req, res) => {
    logger.warn('Facebook OAuth route accessed but not configured');
    return res.status(501).json({
      success: false,
      message: 'Facebook authentication is not configured on the server'
    });
  });

  router.get('/facebook/callback', (req, res) => {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  });
}

// LinkedIn OAuth routes - only if credentials are configured
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  router.get('/linkedin', passport.authenticate('linkedin', { 
    scope: ['r_emailaddress', 'r_liteprofile'] 
  }));

  router.get('/linkedin/callback', 
    passport.authenticate('linkedin', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
    }),
    authController.oauthCallback
  );
} else {
  // Add a route to inform users that LinkedIn auth is not configured
  router.get('/linkedin', (req, res) => {
    logger.warn('LinkedIn OAuth route accessed but not configured');
    return res.status(501).json({
      success: false,
      message: 'LinkedIn authentication is not configured on the server'
    });
  });

  router.get('/linkedin/callback', (req, res) => {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  });
}

// MFA routes (protected by authentication)
router.post('/mfa/setup', authenticate, authController.mfaSetup);
router.post('/mfa/verify', authenticate, authController.verifyTwoFactor);
router.post('/mfa/disable', authenticate, authController.disableTwoFactor);

// Session management routes
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions', authenticate, authController.endAllSessions);
router.delete('/sessions/:sessionId', authenticate, authController.endSession);

// User account management routes
router.post('/account/deactivate', authenticate, authController.deactivateAccount);
router.post('/account/reactivate', authController.reactivateAccount);

// Health check route - useful for monitoring
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Auth service is up and running'
  });
});

module.exports = router; 