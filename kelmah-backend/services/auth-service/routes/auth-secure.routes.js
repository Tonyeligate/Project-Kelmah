/**
 * Secure Authentication Routes
 * Enhanced security routes for Kelmah platform
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const SecureAuthController = require('../controllers/auth-secure.controller');
const SecureAuthMiddleware = require('../middleware/auth-secure');
const { validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array()
    });
  }
  next();
};

// Apply security headers to all routes
router.use(SecureAuthMiddleware.securityHeaders());

// Rate limiting for auth endpoints
const authRateLimit = SecureAuthMiddleware.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later'
});

const generalRateLimit = SecureAuthMiddleware.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  authRateLimit,
  [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters'),
    
    body('password')
      .isLength({ min: 12, max: 128 })
      .withMessage('Password must be between 12 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('phone')
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('role')
      .optional()
      .isIn(['worker', 'hirer'])
      .withMessage('Role must be either worker or hirer'),
    
    body('acceptTerms')
      .isBoolean()
      .custom(value => {
        if (value !== true) {
          throw new Error('You must accept the terms and conditions');
        }
        return true;
      })
  ],
  handleValidationErrors,
  SecureAuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean value')
  ],
  handleValidationErrors,
  SecureAuthController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token',
  authRateLimit,
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
      .isLength({ min: 100 })
      .withMessage('Invalid refresh token format')
  ],
  handleValidationErrors,
  SecureAuthController.refreshToken
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token',
  generalRateLimit,
  [
    param('token')
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid verification token format')
      .matches(/^[a-f0-9]+$/)
      .withMessage('Invalid verification token format')
  ],
  handleValidationErrors,
  SecureAuthController.verifyEmail
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    // Implementation for forgot password
    try {
      const { email } = req.body;
      const { User } = require('../models');
      const SecurityUtils = require('../utils/security');
      const emailService = require('../services/email.service');
      
      const user = await User.findByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, you will receive a password reset link.',
          code: 'RESET_EMAIL_SENT'
        });
      }
      
      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();
      
      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordResetEmail({
        name: user.getFullName(),
        email: user.email,
        resetUrl
      });
      
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link.',
        code: 'RESET_EMAIL_SENT'
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Password reset service error',
        code: 'RESET_SERVICE_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  authRateLimit,
  [
    body('token')
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid reset token format')
      .matches(/^[a-f0-9]+$/)
      .withMessage('Invalid reset token format'),
    
    body('password')
      .isLength({ min: 12, max: 128 })
      .withMessage('Password must be between 12 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    // Implementation for reset password
    try {
      const { token, password } = req.body;
      const { User } = require('../models');
      
      const user = await User.findByPasswordResetToken(token);
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }
      
      // Update password
      await user.updatePassword(password);
      user.clearPasswordResetToken();
      await user.save();
      
      // Send confirmation email
      const emailService = require('../services/email.service');
      await emailService.sendPasswordChangedEmail({
        name: user.getFullName(),
        email: user.email
      });
      
      return res.status(200).json({
        success: true,
        message: 'Password reset successful',
        code: 'PASSWORD_RESET_SUCCESS'
      });
      
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Password reset failed',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }
);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  generalRateLimit,
  SecureAuthMiddleware.authenticate(),
  [
    body('refreshToken')
      .optional()
      .notEmpty()
      .withMessage('Refresh token must not be empty if provided'),
    
    body('logoutAll')
      .optional()
      .isBoolean()
      .withMessage('Logout all must be a boolean value')
  ],
  handleValidationErrors,
  SecureAuthController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  generalRateLimit,
  SecureAuthMiddleware.authenticate(),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        code: 'PROFILE_RETRIEVED',
        data: {
          user: user.getSafeProfile(),
          security: user.getSecurityStatus()
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        code: 'PROFILE_ERROR'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authRateLimit,
  SecureAuthMiddleware.authenticate(),
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 12, max: 128 })
      .withMessage('New password must be between 12 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const { User } = require('../models');
      
      const user = await User.unscoped().findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }
      
      // Check if new password is different
      const isSamePassword = await user.validatePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        });
      }
      
      // Update password
      await user.updatePassword(newPassword);
      
      // Send confirmation email
      const emailService = require('../services/email.service');
      await emailService.sendPasswordChangedEmail({
        name: user.getFullName(),
        email: user.email
      });
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        code: 'PASSWORD_CHANGED'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change password',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/sessions',
  generalRateLimit,
  SecureAuthMiddleware.authenticate(),
  async (req, res) => {
    try {
      const { RefreshToken } = require('../models');
      
      const activeSessions = await RefreshToken.getActiveTokensForUser(req.user.id);
      
      const sessions = activeSessions.map(token => ({
        id: token.tokenId,
        deviceInfo: token.getParsedDeviceInfo(),
        ipAddress: token.ipAddress,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        isCurrent: token.tokenId === req.auth?.jti
      }));
      
      return res.status(200).json({
        success: true,
        message: 'Active sessions retrieved successfully',
        code: 'SESSIONS_RETRIEVED',
        data: { sessions }
      });
      
    } catch (error) {
      console.error('Get sessions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions',
        code: 'SESSIONS_ERROR'
      });
    }
  }
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  generalRateLimit,
  SecureAuthMiddleware.authenticate(),
  [
    param('sessionId')
      .isUUID()
      .withMessage('Invalid session ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { RefreshToken } = require('../models');
      
      const token = await RefreshToken.findOne({
        where: {
          tokenId: sessionId,
          userId: req.user.id,
          isRevoked: false
        }
      });
      
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      await token.revoke('Manual revocation by user');
      
      return res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
        code: 'SESSION_REVOKED'
      });
      
    } catch (error) {
      console.error('Revoke session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke session',
        code: 'SESSION_REVOKE_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-verification',
  authRateLimit,
  SecureAuthMiddleware.authenticate({ requireEmailVerification: false }),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        });
      }
      
      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // Send verification email
      const emailService = require('../services/email.service');
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      await emailService.sendVerificationEmail({
        name: user.getFullName(),
        email: user.email,
        verificationUrl
      });
      
      return res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
        code: 'VERIFICATION_EMAIL_SENT'
      });
      
    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        code: 'VERIFICATION_EMAIL_ERROR'
      });
    }
  }
);

module.exports = router;