/**
 * Auth Controller
 * Handles authentication-related operations for the Kelmah platform
 */

const mongoose = require('mongoose');
const models = require("../models");
const { User, RefreshToken, RevokedToken, WorkerProfile, AuthChallenge } = models;
const { AppError } = require("../utils/errorTypes");
const jwtUtils = require("../../../shared/utils/jwt");
const { buildAuthSessionUser } = require('../../../shared/utils/canonicalWorker');
const emailService = require("../services/email.service");
const crypto = require("crypto");
const secure = require('../utils/jwt-secure');
// MongoDB operators used directly in queries (no Op import needed)
const config = require("../config");
const { reconcileAuthIndexes } = require("../config/db");
const { generateOTP } = require("../utils/otp");
const deviceUtil = require("../utils/device");
const sessionUtil = require("../utils/session");
const { logger } = require("../utils/logger");
const SecurityUtils = require("../utils/security");
// MFA dependencies
let speakeasy, QRCode;
try {
  speakeasy = require('speakeasy');
  QRCode = require('qrcode');
} catch (_) {
  // Optional; controller methods will guard usage
}

const BLANK_PHONE_SENTINELS = new Set(['', 'null', 'undefined', 'n/a', 'na', 'none']);
const AUTH_CHALLENGE_TYPES = Object.freeze({
  TWO_FACTOR: 'two_factor',
  OAUTH: 'oauth',
});

const parsePositiveIntegerEnv = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const AUTH_CHALLENGE_LIMITS = Object.freeze({
  [AUTH_CHALLENGE_TYPES.TWO_FACTOR]: parsePositiveIntegerEnv(process.env.AUTH_TWO_FACTOR_CHALLENGE_LIMIT, 10000),
  [AUTH_CHALLENGE_TYPES.OAUTH]: parsePositiveIntegerEnv(process.env.AUTH_OAUTH_CODE_LIMIT, 5000),
});

const AUTH_CHALLENGE_PRUNE_BATCH = parsePositiveIntegerEnv(process.env.AUTH_CHALLENGE_PRUNE_BATCH, 250);
const EMAIL_DELIVERY_UNAVAILABLE_CODE = 'EMAIL_DELIVERY_UNAVAILABLE';
const EMAIL_VERIFICATION_UNAVAILABLE_MESSAGE = 'Verification email delivery is temporarily unavailable. Please try again later.';
const REGISTRATION_UNAVAILABLE_MESSAGE = 'Registration is temporarily unavailable because verification email delivery is unavailable.';
const PASSWORD_RESET_DELIVERY_UNAVAILABLE_MESSAGE = 'Password reset email delivery is temporarily unavailable. Please try again later.';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';
const REGISTRATION_FAILURE_MESSAGE = 'Registration failed. Please try again later.';
const LOGIN_FAILURE_MESSAGE = 'Login temporarily unavailable. Please try again later.';
const EMAIL_VERIFICATION_FAILURE_MESSAGE = 'Email verification failed. Please try again later.';
const RESEND_VERIFICATION_FAILURE_MESSAGE = 'Failed to resend verification email. Please try again later.';
const FORGOT_PASSWORD_FAILURE_MESSAGE = 'Failed to send password reset email. Please try again later.';

const normalizeOptionalPhone = (phone) => {
  if (typeof phone !== 'string') {
    return '';
  }

  const normalized = phone.trim();
  if (!normalized) {
    return '';
  }

  return BLANK_PHONE_SENTINELS.has(normalized.toLowerCase()) ? '' : normalized;
};

const isDuplicatePhoneError = (error) => {
  if (!error || error.code !== 11000) {
    return false;
  }

  if (error.keyPattern?.phone) {
    return true;
  }

  return /phone/i.test(error.message || '');
};

const createUserWithPhoneRecovery = async (createPayload, normalizedPhone) => {
  try {
    return await User.create(createPayload);
  } catch (error) {
    if (!isDuplicatePhoneError(error) || normalizedPhone) {
      throw error;
    }

    logger.warn('Registration hit stale phone index state; reconciling indexes and retrying once', {
      email: createPayload.email,
    });

    await reconcileAuthIndexes();
    return User.create(createPayload);
  }
};

const buildEmailDeliveryUnavailableError = (message) => {
  const error = new AppError(message, 503);
  error.code = EMAIL_DELIVERY_UNAVAILABLE_CODE;
  error.expose = true;
  error.exposeMessage = true;
  return error;
};

const normalizeEmailDeliveryError = (error, fallbackMessage) => {
  if (error?.code === EMAIL_DELIVERY_UNAVAILABLE_CODE) {
    return error;
  }

  return buildEmailDeliveryUnavailableError(fallbackMessage);
};

const ensureEmailDeliveryConfigured = (message) => {
  if (typeof emailService.isDeliveryConfigured === 'function' && !emailService.isDeliveryConfigured()) {
    throw buildEmailDeliveryUnavailableError(message);
  }
};

const rollbackUnverifiedRegistration = async (user) => {
  if (!user?._id || typeof User.deleteOne !== 'function') {
    return;
  }

  try {
    await User.deleteOne({ _id: user._id, isEmailVerified: false });
  } catch (cleanupError) {
    logger.error('Failed to rollback unverified registration after email delivery failure', {
      userId: user._id.toString(),
      error: cleanupError.message,
    });
  }
};

const buildInvalidCredentialsError = () => {
  const error = new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  error.expose = true;
  error.exposeMessage = true;
  return error;
};

const buildServiceUnavailableError = () => {
  const error = new AppError('Service temporarily unavailable. Please try again shortly.', 503);
  error.expose = true;
  error.exposeMessage = true;
  return error;
};

const didEmailSendSkip = (result) => Boolean(result && typeof result === 'object' && result.skipped);

const hashEphemeralToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const pruneAuthChallenges = async (type) => {
  const now = new Date();

  await AuthChallenge.deleteMany({
    $or: [
      { expiresAt: { $lte: now } },
      { consumedAt: { $ne: null } },
    ],
  });

  const maxActive = AUTH_CHALLENGE_LIMITS[type];
  if (!maxActive) {
    return;
  }

  const activeCount = await AuthChallenge.countDocuments({
    type,
    consumedAt: null,
    expiresAt: { $gt: now },
  });
  const overflow = activeCount - maxActive + 1;

  if (overflow <= 0) {
    return;
  }

  const oldestChallenges = await AuthChallenge.find({
    type,
    consumedAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: 1 })
    .limit(Math.max(overflow, AUTH_CHALLENGE_PRUNE_BATCH))
    .select('_id')
    .lean();

  if (oldestChallenges.length > 0) {
    await AuthChallenge.deleteMany({
      _id: { $in: oldestChallenges.map((challenge) => challenge._id) },
    });
  }
};

const createAuthChallenge = async ({ type, rawToken, userId, expiresAt, metadata = {} }) => {
  const now = new Date();
  const activeScope = {
    type,
    userId,
    consumedAt: null,
    expiresAt: { $gt: now },
  };

  if (type === AUTH_CHALLENGE_TYPES.OAUTH && metadata.provider) {
    activeScope['metadata.provider'] = metadata.provider;
  }

  await AuthChallenge.deleteMany(activeScope);
  await pruneAuthChallenges(type);

  await AuthChallenge.create({
    type,
    tokenHash: hashEphemeralToken(rawToken),
    userId,
    metadata,
    expiresAt,
  });

  return rawToken;
};

const consumeAuthChallenge = (type, rawToken) => {
  const now = new Date();

  return AuthChallenge.findOneAndUpdate(
    {
      type,
      tokenHash: hashEphemeralToken(rawToken),
      consumedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { consumedAt: now } },
    { new: true },
  ).lean();
};

const issueTwoFactorChallenge = ({ userId, req }) => {
  const challengeToken = crypto.randomBytes(16).toString('hex');

  return createAuthChallenge({
    type: AUTH_CHALLENGE_TYPES.TWO_FACTOR,
    rawToken: challengeToken,
    userId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    },
  });
};

const issueOAuthAuthorizationCode = ({ userId, provider, req }) => {
  const authCode = crypto.randomBytes(32).toString('hex');

  return createAuthChallenge({
    type: AUTH_CHALLENGE_TYPES.OAUTH,
    rawToken: authCode,
    userId,
    expiresAt: new Date(Date.now() + 60 * 1000),
    metadata: {
      provider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    },
  });
};

const redirectWithOAuthCode = async ({ req, res, user, provider }) => {
  const authCode = await issueOAuthAuthorizationCode({
    userId: user.id || user._id,
    provider,
    req,
  });

  return res.redirect(`${config.frontendUrl}/oauth-callback?code=${authCode}`);
};

const parseRefreshTokenId = (token) => {
  if (typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 4) {
    return null;
  }

  try {
    const signedPart = parts.slice(0, 3).join('.');
    return jwtUtils.verifyRefreshToken(signedPart).jti;
  } catch (_) {
    return null;
  }
};

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  // Avoid logging full payloads; log minimal info
  logger.info('Register attempt', { email: req.body?.email });
  try {
    ensureEmailDeliveryConfigured(REGISTRATION_UNAVAILABLE_MESSAGE);

    const { firstName, lastName, email, phone, password, role } = req.body;

    // Validate required fields
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!email) missing.push('email');
    if (!password) missing.push('password');

    if (missing.length > 0) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }

    const passwordValidation = SecurityUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.errors.join('. '), 400));
    }

    const userRole = ["worker", "hirer"].includes(role) ? role : "worker";

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    const normalizedPhone = normalizeOptionalPhone(phone);

    // Create user with improved error handling
    // Omit phone completely when it is blank so sparse phone indexes do not
    // treat repeated null values as duplicates in older deployed databases.
    const createPayload = {
      firstName,
      lastName,
      email,
      password,
      role: userRole,
    };

    if (normalizedPhone) {
      createPayload.phone = normalizedPhone;
    }

    const newUser = await createUserWithPhoneRecovery(createPayload, normalizedPhone);

    // Generate a verification token (raw) and store hashed version on user
    const rawToken = newUser.generateVerificationToken();
    await newUser.save();

    // Use the raw token in the URL so it can be properly verified
    const frontendUrl = config.frontendUrl ||
      config.FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      'https://kelmah-frontend-cyan.vercel.app';

    const verificationUrl = `${frontendUrl}/verify-email/${rawToken}`;

    logger.info('Email verification link generated', { frontendUrl });

    // Verification delivery is required so we do not create unreachable accounts.
    try {
      const deliveryResult = await emailService.sendVerificationEmail({
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        verificationUrl,
      });

      if (didEmailSendSkip(deliveryResult)) {
        throw buildEmailDeliveryUnavailableError(REGISTRATION_UNAVAILABLE_MESSAGE);
      }
    } catch (mailErr) {
      logger.warn('Verification email failed during registration', {
        email: newUser.email,
        error: mailErr.message,
      });
      await rollbackUnverifiedRegistration(newUser);
      return next(normalizeEmailDeliveryError(mailErr, REGISTRATION_UNAVAILABLE_MESSAGE));
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful, please check your email to verify your account.",
    });
  } catch (error) {
    if (error?.statusCode) {
      return next(error);
    }

    logger.error('Registration failed', { error: error.message, stack: error.stack });

    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400));
    }

    // Handle unique constraint errors (MongoDB duplicate key)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 400));
    }

    return next(new AppError(REGISTRATION_FAILURE_MESSAGE, 500));
  }
};

/**
 * Login user with enhanced security
 */
exports.login = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose?.connection || mongoose.connection.readyState !== 1) {
      logger.warn('Login attempted while DB not ready', { readyState: mongoose?.connection?.readyState });
      return next(buildServiceUnavailableError());
    }

    const { email, password, rememberMe = false } = req.body;

    // Input validation
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }
    // H5 FIX: Prevent bcrypt DoS — bcrypt only uses first 72 bytes; reject absurdly long passwords
    if (typeof password !== 'string' || password.length > 128) {
      return next(buildInvalidCredentialsError());
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Simple rate limiting check using in-memory store (for now)
    const rateLimitKey = `login:${req.ip}:${sanitizedEmail}`;
    // TODO: Implement proper rate limiting with Redis

    // Find user using direct MongoDB driver (bypass disconnected Mongoose model)
    const client = mongoose.connection.getClient();
    const db = client.db();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({
      email: sanitizedEmail
    });

    // Generic error message to prevent user enumeration
    if (!user) {
      // Simulate password verification time to prevent timing attacks
      await require('bcryptjs').hash('dummy-password', 12);
      return next(buildInvalidCredentialsError());
    }

    // Check account status — equalize timing to prevent enumeration (H6)
    // Always run bcrypt.compare before returning status-specific errors
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!user.isActive) {
      return next(buildInvalidCredentialsError());
    }

    if (!user.isEmailVerified) {
      return next(buildInvalidCredentialsError());
    }

    // AUTH-1/2 FIX: Check account lock AFTER bcrypt to equalize timing
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return next(buildInvalidCredentialsError());
    }

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        const accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              failedLoginAttempts: failedAttempts,
              accountLockedUntil: accountLockedUntil
            }
          }
        );

        return next(buildInvalidCredentialsError());
      }

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: failedAttempts } }
      );
      return next(buildInvalidCredentialsError());
    }

    // Check if 2FA is enabled for this user
    if (user.isTwoFactorEnabled) {
      const { twoFactorCode } = req.body;
      if (!twoFactorCode) {
        const challengeToken = await issueTwoFactorChallenge({ userId: user._id, req });

        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Two-factor authentication required',
          data: { requiresTwoFactor: true, challengeToken }
        });
      }

      // challengeToken is mandatory — it proves the client completed the challenge step
      // before supplying the TOTP code, preventing direct 2FA code submission attacks.
      const { challengeToken } = req.body;
      if (!challengeToken) {
        return next(new AppError('2FA challenge token is required. Please restart the login flow.', 401));
      }
      const challenge = await consumeAuthChallenge(AUTH_CHALLENGE_TYPES.TWO_FACTOR, challengeToken);
      if (!challenge) {
        return next(new AppError('Invalid or expired 2FA challenge. Please restart the login flow.', 401));
      }

      // Verify the 2FA code
      const speakeasy = require('speakeasy');
      const isValidCode = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1, // Allow 1 step before/after for clock skew
      });

      if (!isValidCode) {
        return next(new AppError('Invalid two-factor authentication code', 401));
      }
    }

    // HIGH-2 FIX: Reset failed login attempts AFTER full authentication (password + 2FA)
    // so that a bypass of 2FA does not clear the lockout counter prematurely.
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLogin: new Date(),
          lastLoginIp: req.ip
        }
      }
    );

    // Generate access token via local JWT utils
    const accessToken = jwtUtils.signAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      version: user.tokenVersion || 0,
    });

    // Generate secure composite refresh token (signed_jwt.raw)
    const refreshData = await secure.generateRefreshToken({
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    }, {
      ipAddress: req.ip,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        fingerprint: req.headers['x-device-id'] || 'unknown'
      }
    });

    // Store only hashed part + tokenId (using direct driver)
    try {
      const refreshTokensCollection = db.collection('refreshtokens');
      await refreshTokensCollection.insertOne({
        userId: user._id,
        tokenId: refreshData.tokenId,
        tokenHash: refreshData.tokenHash,
        version: user.tokenVersion || 0,
        expiresAt: refreshData.expiresAt,
        deviceInfo: refreshData.deviceInfo,
        createdByIp: req.ip,
        createdAt: new Date(),
      });
    } catch (dbError) {
      // Handle duplicate key errors gracefully
      if (dbError.code === 11000) {
        logger.warn('Duplicate refresh token detected, continuing with login', {
          userId: user._id.toString(),
          tokenId: refreshData.tokenId
        });
        // Continue with login even if refresh token creation fails
      } else {
        throw dbError;
      }
    }

    // Log successful login for audit purposes
    logger.info('User logged in', { email: user.email, ip: req.ip });

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshData.token,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: new Date(),
        },
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    return next(new AppError(LOGIN_FAILURE_MESSAGE, 500));
  }
};

/**
 * Verify email with token
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await User.findByVerificationToken(token);

    if (!user) {
      return next(new AppError("Invalid or expired verification token", 400));
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    // Generate access + secure refresh token
    const accessToken = jwtUtils.signAccessToken({ id: user.id, email: user.email, role: user.role, version: user.tokenVersion || 0 });
    const refreshData = await secure.generateRefreshToken(user, { ipAddress: req.ip, deviceInfo: { userAgent: req.headers['user-agent'] } });

    // Store hashed refresh token
    await RefreshToken.create({
      userId: user.id,
      tokenId: refreshData.tokenId,
      tokenHash: refreshData.tokenHash,
      version: user.tokenVersion || 0,
      expiresAt: refreshData.expiresAt,
      deviceInfo: refreshData.deviceInfo,
      createdByIp: req.ip,
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken: refreshData.token,
      },
    });
  } catch (error) {
    return next(
      new AppError(EMAIL_VERIFICATION_FAILURE_MESSAGE, 500),
    );
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    ensureEmailDeliveryConfigured(EMAIL_VERIFICATION_UNAVAILABLE_MESSAGE);

    const { email } = req.body;

    if (!email) {
      return next(new AppError("Please provide your email address", 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);

    // Return generic success for all cases to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        status: "success",
        message: "If an account with that email exists and is unverified, a verification email has been sent",
      });
    }

    // Generate new verification token (raw) and save hashed on user
    const verificationToken = user.generateVerificationToken(); // raw token
    await user.save();

    // Send verification email - use same URL logic as registration
    const frontendUrl = config.frontendUrl ||
      config.FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      'https://kelmah-frontend-cyan.vercel.app';

    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    logger.info('Resent verification email', { frontendUrl });

    try {
      const deliveryResult = await emailService.sendVerificationEmail({
        name: user.fullName,
        email: user.email,
        verificationUrl,
      });

      if (didEmailSendSkip(deliveryResult)) {
        throw buildEmailDeliveryUnavailableError(EMAIL_VERIFICATION_UNAVAILABLE_MESSAGE);
      }
    } catch (mailErr) {
      logger.warn('Resend verification email failed', { email: user.email, error: mailErr.message });
      return next(normalizeEmailDeliveryError(mailErr, EMAIL_VERIFICATION_UNAVAILABLE_MESSAGE));
    }

    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists and is unverified, a verification email has been sent.',
    });
  } catch (error) {
    if (error?.statusCode) {
      return next(error);
    }

    return next(
      new AppError(RESEND_VERIFICATION_FAILURE_MESSAGE, 500),
    );
  }
};

/**
 * Forgot password - send reset email
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    ensureEmailDeliveryConfigured(PASSWORD_RESET_DELIVERY_UNAVAILABLE_MESSAGE);

    const { email } = req.body;

    if (!email) {
      return next(new AppError("Please provide your email address", 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      // We don't want to reveal if a user exists or not
      return res.status(200).json({
        status: "success",
        message:
          "If a user with that email exists, a password reset link has been sent",
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Create reset URL
    const frontendUrl = config.frontendUrl ||
      config.FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      'https://kelmah-frontend-cyan.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail({
        name: user.fullName,
        email: user.email,
        resetUrl,
      });
    } catch (mailErr) {
      logger.warn('Password reset email failed', { email: user.email, error: mailErr.message });
    }

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Password reset link sent to email",
    });
  } catch (error) {
    if (error?.statusCode) {
      return next(error);
    }

    return next(
      new AppError(FORGOT_PASSWORD_FAILURE_MESSAGE, 500),
    );
  }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(new AppError("Please provide a new password", 400));
    }

    const passwordValidation = SecurityUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      return next(
        new AppError(passwordValidation.errors.join('. '), 400),
      );
    }

    // Find user by reset token
    const user = await User.findByPasswordResetToken(token);

    if (!user) {
      return next(new AppError("Invalid or expired password reset token", 400));
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.tokenVersion += 1; // Invalidate all existing tokens

    await user.save();

    // Send password changed confirmation email
    try {
      await emailService.sendPasswordChangedEmail({
        name: user.fullName,
        email: user.email,
      });
    } catch (mailErr) {
      logger.warn('Password changed confirmation email failed after reset', { email: user.email, error: mailErr.message });
    }

    // Return success response
    return res.status(200).json({
      status: "success",
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    return next(new AppError(`Password reset failed: ${error.message}`, 500));
  }
};

/**
 * Change password when logged in
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return next(new AppError("Please provide current and new password", 400));
    }

    const passwordValidation = SecurityUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return next(
        new AppError(passwordValidation.errors.join('. '), 400),
      );
    }

    // Find user with password explicitly selected for validation.
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password
    if (!(await user.validatePassword(currentPassword))) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Update password
    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate all existing tokens except current session

    await user.save();

    // AUTH-3 FIX: Invalidate all refresh tokens for user (tokenVersion bump handles current session)
    await RefreshToken.deleteMany({
      userId: user._id,
    });

    // Send password changed confirmation email
    try {
      await emailService.sendPasswordChangedEmail({
        name: user.fullName,
        email: user.email,
      });
    } catch (mailErr) {
      logger.warn('Password changed confirmation email failed', { email: user.email, error: mailErr.message });
    }

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(new AppError(`Password change failed: ${error.message}`, 500));
  }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Verify secure composite refresh token (signed_jwt.raw)
    const tokenStr = refreshToken;
    const parts = tokenStr.split('.');
    if (parts.length !== 4) return next(new AppError('Invalid refresh token format', 400));
    const signedPart = parts.slice(0, 3).join('.');
    let parsed;
    try {
      parsed = jwtUtils.verifyRefreshToken(signedPart);
    } catch (e) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    const stored = await RefreshToken.findOne({ tokenId: parsed.jti, isRevoked: false, expiresAt: { $gt: new Date() } });
    if (!stored) return next(new AppError('Invalid or expired refresh token', 401));
    const verifyRes = await secure.verifyRefreshToken(tokenStr, { tokenHash: stored.tokenHash, version: stored.version });
    if (!verifyRes.valid) return next(new AppError(verifyRes.error || 'Invalid refresh token', 401));

    // Get user
    const user = await User.findById(String(stored.userId));

    if (!user || !user.isActive) {
      // Remove invalid token from database
      await RefreshToken.deleteMany({ tokenId: parsed.jti });
      return next(new AppError("User not found or inactive", 404));
    }

    // Check if token version matches (if versioning is implemented)
    if (user.tokenVersion !== undefined && user.tokenVersion !== null && stored.version !== undefined && stored.version !== null && user.tokenVersion !== stored.version) {
      // Token has been invalidated, remove from database
      await RefreshToken.updateMany({ tokenId: parsed.jti }, { $set: { isRevoked: true, revokedAt: new Date(), revokedByIp: req.ip } });
      return next(new AppError("Token has been invalidated", 401));
    }

    // Generate new tokens
    const accessToken = jwtUtils.signAccessToken({ id: user.id, email: user.email, role: user.role, version: user.tokenVersion || 0 });
    const newRefreshData = await secure.generateRefreshToken(user, { ipAddress: req.ip, deviceInfo: { userAgent: req.headers['user-agent'], fingerprint: req.headers['x-device-id'] || 'unknown' } });

    // Rotate: revoke old token and insert new one atomically via MongoDB transaction
    const rotationSession = await mongoose.startSession();
    try {
      await rotationSession.withTransaction(async () => {
        await RefreshToken.updateMany(
          { tokenId: parsed.jti },
          { $set: { isRevoked: true, revokedAt: new Date(), revokedByIp: req.ip, reason: 'rotation' } },
          { session: rotationSession }
        );
        await RefreshToken.create([{
          userId: user.id,
          tokenId: newRefreshData.tokenId,
          tokenHash: newRefreshData.tokenHash,
          version: user.tokenVersion || 0,
          expiresAt: newRefreshData.expiresAt,
          deviceInfo: newRefreshData.deviceInfo,
          createdByIp: req.ip,
          createdAt: new Date(),
        }], { session: rotationSession });
      });
    } finally {
      await rotationSession.endSession();
    }

    // Log token refresh for audit purposes
    logger.info('Token refreshed', { email: user.email, ip: req.ip });

    // Return tokens in expected format
    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshData.token,
      },
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message, stack: error.stack });

    // Clean up invalid refresh token if it exists
    if (req.body.refreshToken) {
      const tokenId = parseRefreshTokenId(req.body.refreshToken);
      if (tokenId) {
        await RefreshToken.deleteMany({ tokenId })
          .catch(err => logger.warn('Error cleaning up refresh token', { error: err?.message }));
      }
    }

    return next(new AppError(`Token refresh failed: ${error.message}`, 500));
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken, logoutAll = false } = req.body;
    const userId = req.user?.id; // Will be available if user is authenticated

    let revokedCount = 0;

    if (logoutAll && userId) {
      // Revoke all refresh tokens for the user (logout from all devices)
      const result = await RefreshToken.deleteMany({ userId });
      revokedCount = result?.deletedCount || 0;
      logger.info('User logged out from all devices', { userId, revokedCount });
    } else if (refreshToken) {
      // Revoke specific refresh token by tokenId (from composite)
      try {
        const parts = refreshToken.split('.');
        const signed = parts.slice(0, 3).join('.');
        const parsed = jwtUtils.verifyRefreshToken(signed);
        const result = await RefreshToken.deleteMany({ tokenId: parsed.jti });
        revokedCount = result?.deletedCount || 0;
        logger.info('Refresh token revoked on logout', { revokedCount });
      } catch (_) {
        // ignore invalid token
      }
    }

    // Return consistent success response format
    return res.status(200).json({
      success: true,
      data: {
        message: logoutAll ? "Logged out from all devices successfully" : "Logged out successfully",
        revokedTokens: revokedCount
      }
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message, stack: error.stack });
    return next(new AppError(`Logout failed: ${error.message}`, 500));
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId)
      .select("-password -tokenVersion")
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const workerProfile = user.role === 'worker'
      ? await WorkerProfile.findOne({ userId })
          .select({
            profession: 1,
            title: 1,
            headline: 1,
            location: 1,
            hourlyRate: 1,
            currency: 1,
            yearsOfExperience: 1,
            skills: 1,
            specializations: 1,
            availabilityStatus: 1,
            isVerified: 1,
            profileCompleteness: 1,
            profilePicture: 1,
            createdAt: 1,
            updatedAt: 1,
          })
          .lean()
      : null;

    // Return user profile
    return res.status(200).json({
      status: "success",
      data: {
        user: buildAuthSessionUser(user, workerProfile || {}),
      },
      meta: {
        contract: 'auth-session-v2',
        workerProfileSource: workerProfile
          ? 'worker-profile'
          : user.role === 'worker'
            ? 'user-fallback'
            : 'not-applicable',
      },
    });
  } catch (error) {
    return next(
      new AppError(`Failed to get user profile: ${error.message}`, 500),
    );
  }
};

/**
 * Setup two-factor authentication
 */
exports.setupTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isTwoFactorEnabled) {
      return next(
        new AppError("Two-factor authentication is already enabled", 400),
      );
    }

    // Generate and store 2FA secret
    const secret = speakeasy.generateSecret({ length: 20 });
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `Kelmah:${user.email}`,
      issuer: "Kelmah Platform",
    });

    const qrCode = await QRCode.toDataURL(otpAuthUrl);

    // Return setup data
    return res.status(200).json({
      status: "success",
      data: {
        secret: secret.base32,
        qrCode,
      },
    });
  } catch (error) {
    return next(new AppError(`Two-factor setup failed: ${error.message}`, 500));
  }
};

exports.mfaSetup = exports.setupTwoFactor;

/**
 * Verify and enable two-factor authentication
 */
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return next(new AppError("Verification token is required", 400));
    }

    // Find user
    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.twoFactorSecret) {
      return next(new AppError("Two-factor authentication not set up", 400));
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      return next(new AppError("Invalid verification code", 400));
    }

    // Enable 2FA
    user.isTwoFactorEnabled = true;
    await user.save();

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    return next(
      new AppError(`Two-factor verification failed: ${error.message}`, 500),
    );
  }
};

/**
 * Disable two-factor authentication
 */
exports.disableTwoFactor = async (req, res, next) => {
  try {
    const { password, token } = req.body;
    const userId = req.user.id;

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    // Find user
    const user = await User.findById(userId).select('+password +twoFactorSecret');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError("Incorrect password", 401));
    }

    // Verify 2FA token if enabled
    if (user.isTwoFactorEnabled) {
      if (!token) {
        return next(
          new AppError("Two-factor verification code is required", 400),
        );
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
      });

      if (!verified) {
        return next(new AppError("Invalid verification code", 400));
      }
    }

    // Disable 2FA
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    return next(
      new AppError(
        `Failed to disable two-factor authentication: ${error.message}`,
        500,
      ),
    );
  }
};

/**
 * OAuth Google login/register handler
 */
exports.googleCallback = async (req, res, next) => {
  try {
    const { user } = req;

    return redirectWithOAuthCode({ req, res, user, provider: 'google' });
  } catch (error) {
    return next(
      new AppError(`Google OAuth callback failed: ${error.message}`, 500),
    );
  }
};

/**
 * OAuth Facebook login/register handler
 */
exports.facebookCallback = async (req, res, next) => {
  try {
    const { user } = req;

    return redirectWithOAuthCode({ req, res, user, provider: 'facebook' });
  } catch (error) {
    return next(
      new AppError(`Facebook OAuth callback failed: ${error.message}`, 500),
    );
  }
};

/**
 * OAuth LinkedIn login/register handler
 */
exports.linkedinCallback = async (req, res, next) => {
  try {
    const { user } = req;

    return redirectWithOAuthCode({ req, res, user, provider: 'linkedin' });
  } catch (error) {
    return next(
      new AppError(`LinkedIn OAuth callback failed: ${error.message}`, 500),
    );
  }
};

/**
 * Get user's active sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionUtil = require("../utils/session");

    // Get all active sessions for the user
    const sessions = await sessionUtil.getActiveSessions(userId);

    // Format for response
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      ip: session.ip,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expiresAt: session.expiresAt,
      isCurrentSession:
        req.headers.authorization &&
        req.headers.authorization.split(" ")[1] === session.id,
    }));

    // Return success response
    return res.status(200).json({
      status: "success",
      data: {
        sessions: formattedSessions,
      },
    });
  } catch (error) {
    return next(new AppError(`Failed to get sessions: ${error.message}`, 500));
  }
};

/**
 * End a specific session
 */
exports.endSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const sessionUtil = require("../utils/session");

    // Get the session first to verify ownership
    const session = await sessionUtil.get(sessionId);

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    if (session.userId !== userId) {
      return next(new AppError("Unauthorized to end this session", 403));
    }

    // Check if trying to end current session
    const currentToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (sessionId === currentToken) {
      return next(
        new AppError("Cannot end current session. Use logout instead.", 400),
      );
    }

    // End the session
    await sessionUtil.end(sessionId);

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Session ended successfully",
    });
  } catch (error) {
    return next(new AppError(`Failed to end session: ${error.message}`, 500));
  }
};

/**
 * End all sessions except current
 */
exports.endAllSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionUtil = require("../utils/session");

    // Get current session token
    const currentToken =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    // End all sessions except current
    await sessionUtil.endAllExcept(userId, currentToken);

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "All other sessions ended successfully",
    });
  } catch (error) {
    return next(
      new AppError(`Failed to end all sessions: ${error.message}`, 500),
    );
  }
};

/**
 * Deactivate user account
 */
exports.deactivateAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    // Find user with password explicitly selected for validation.
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError("Incorrect password", 401));
    }

    // Deactivate account
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    // End all sessions
    const sessionUtil = require("../utils/session");
    await sessionUtil.endAll(userId);

    // Send account deactivation email
    await emailService.sendAccountDeactivationEmail({
      name: user.fullName,
      email: user.email,
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Account deactivated successfully",
    });
  } catch (error) {
    return next(
      new AppError(`Failed to deactivate account: ${error.message}`, 500),
    );
  }
};

/**
 * Reactivate user account
 */
exports.reactivateAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // HIGH-13 FIX: Return a generic message for all failure cases to prevent
    // email enumeration.  An attacker cannot distinguish between
    // "email doesn't exist", "account is active", and "wrong password".
    const genericError = "Unable to reactivate account. Check your credentials and try again.";

    if (!user) {
      // Timing-safe: hash a dummy password to prevent timing side-channel
      const bcrypt = require('bcryptjs');
      await bcrypt.hash('dummy-password', 12);
      return next(new AppError(genericError, 400));
    }

    if (user.isActive) {
      return next(new AppError(genericError, 400));
    }

    if (!(await user.validatePassword(password))) {
      return next(new AppError(genericError, 400));
    }

    // Reactivate account
    user.isActive = true;
    user.deactivatedAt = null;
    await user.save();

    // Send account reactivation email
    await emailService.sendAccountReactivationEmail({
      name: user.fullName,
      email: user.email,
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Account reactivated successfully",
    });
  } catch (error) {
    return next(
      new AppError(`Failed to reactivate account: ${error.message}`, 500),
    );
  }
};

/**
 * Verify authentication token
 */
exports.verifyAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError("Authenticated user context required", 401));
    }

    if (!mongoose?.connection || mongoose.connection.readyState !== 1) {
      logger.warn('verifyAuth attempted while DB not ready', {
        readyState: mongoose?.connection?.readyState,
      });
      return next(buildServiceUnavailableError());
    }

    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(req.user.id);
    } catch (idError) {
      logger.warn('verifyAuth received invalid user id', {
        userId: req.user.id,
        error: idError.message,
      });
      return next(new AppError('Invalid user identifier', 400));
    }

    const client = mongoose.connection.getClient();
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: userObjectId },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          isEmailVerified: 1,
        },
      },
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error('verifyAuth failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    return next(
      new AppError(`Authentication verification failed: ${error.message}`, 500),
    );
  }
};

exports.validateAuthToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(200).json({ valid: false });
    }
    const decoded = await jwtUtils.verifyAuthToken(token);
    const userId = decoded.sub || decoded.id;
    const user = await User.findById(userId).select("id firstName lastName email role isEmailVerified");
    if (!user) {
      return res.status(200).json({ valid: false });
    }
    return res.status(200).json({ valid: true, user: { id: user._id, role: user.role } });
  } catch (error) {
    return res.status(200).json({ valid: false });
  }
};

/**
 * Clean up expired refresh tokens (utility function)
 * This should be called periodically by a cron job
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    logger.info('Cleaned up expired refresh tokens', { result });
    return { success: true, cleaned: result };
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Get authentication statistics (for monitoring)
 */
exports.getAuthStats = async (req, res, next) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // LOW-08 FIX: Redact exact token counts (useful for attackers to gauge session volume).
    // Only expose aggregate user metrics; token counts require admin role.
    const isAdmin = req.user?.role === 'admin';

    const [recentLogins, weeklyLogins, totalUsers, activeUsers] = await Promise.all([
      User.countDocuments({ lastLogin: { $gt: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gt: oneWeekAgo } }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    const stats = {
      recentLogins,
      weeklyLogins,
      totalUsers,
      activeUsers,
    };

    // Only expose token metrics to admins
    if (isAdmin) {
      stats.activeTokens = await RefreshToken.countDocuments({ expiresAt: { $gt: now } });
      stats.expiredTokens = await RefreshToken.countDocuments({ expiresAt: { $lt: now } });
    }

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get auth stats', { error: error.message });
    return next(new AppError(`Failed to get authentication statistics: ${error.message}`, 500));
  }
};

/**
 * Exchange a short-lived OAuth auth code for access + refresh tokens.
 * The code is generated by the OAuth callback handlers above.
 */
exports.exchangeOAuthCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return next(new AppError('Authorization code is required', 400));
    }

    const stored = await consumeAuthChallenge(AUTH_CHALLENGE_TYPES.OAUTH, code);

    if (!stored) {
      return next(new AppError('Invalid or expired authorization code', 400));
    }

    const user = await User.findById(stored.userId)
      .select('email role tokenVersion isActive')
      .lean();

    if (!user || user.isActive === false) {
      return next(new AppError('User not found or inactive', 404));
    }

    const tokenUser = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    };

    const accessToken = jwtUtils.signAccessToken(tokenUser);
    const refreshData = await secure.generateRefreshToken(tokenUser, {
      ipAddress: req.ip,
      deviceInfo: {
        userAgent: req.headers['user-agent'] || stored.metadata?.userAgent || 'unknown',
        fingerprint: req.headers['x-device-id'] || 'unknown',
      },
    });

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshData.tokenHash,
      tokenId: refreshData.tokenId,
      expiresAt: refreshData.expiresAt,
      version: tokenUser.tokenVersion,
      createdByIp: req.ip,
      deviceInfo: refreshData.deviceInfo,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshData.token
      }
    });
  } catch (error) {
    logger.error('OAuth code exchange failed', { error: error.message });
    return next(new AppError('Failed to exchange authorization code', 500));
  }
};
