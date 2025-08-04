/**
 * Auth Controller
 * Handles authentication-related operations for the Kelmah platform
 */

const models = require("../models");
const { User, RefreshToken } = models;
const { AppError } = require("../utils/errorTypes");
const jwtUtils = require("../utils/jwt");
const emailService = require("../services/email.service");
const crypto = require("crypto");
const { Op } = require("sequelize");
const config = require("../config");
const { generateOTP } = require("../utils/otp");
const deviceUtil = require("../utils/device");
const sessionUtil = require("../utils/session");
const logger = require("../utils/logger");

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  console.log('Register payload:', req.body);
  try {
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
    
    const userRole = ["worker", "hirer"].includes(role) ? role : "worker";
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }
    
    // Create user with improved error handling
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || null, // Handle empty phone gracefully
      password,
      role: userRole,
    });
    
    // Generate a verification token (raw) and store hashed version on user
    const rawToken = newUser.generateVerificationToken();
    await newUser.save();
    
    // Use the raw token in the URL so it can be properly verified
    const frontendUrl = config.frontendUrl || 
                       config.FRONTEND_URL || 
                       process.env.FRONTEND_URL || 
                       'https://kelmah-frontend-mu.vercel.app';
    
    const verificationUrl = `${frontendUrl}/verify-email/${rawToken}`;
    
    console.log('Frontend URL used for verification:', frontendUrl);
    console.log('Full verification URL:', verificationUrl);
    
    // Send verification email (don't fail registration if email fails)
    try {
      await emailService.sendVerificationEmail({
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        verificationUrl,
      });
    } catch (mailErr) {
      console.error('Verification email failed:', mailErr.message);
      // Continue with registration even if email fails
    }
    
    return res.status(201).json({
      success: true,
      message: "Registration successful, please check your email to verify your account.",
    });
  } catch (error) {
    console.error('Registration failed:', error);
    
    // Handle specific Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return next(new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400));
    }
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError(error.errors[0].message || 'Duplicate value', 400));
    }
    
    return next(new AppError(`Registration failed: ${error.message}`, 500));
  }
};

/**
 * Login user with enhanced security
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    
    // Input validation
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Simple rate limiting check using in-memory store (for now)
    const rateLimitKey = `login:${req.ip}:${sanitizedEmail}`;
    // TODO: Implement proper rate limiting with Redis
    
    // Find user
    const user = await User.findByEmail(sanitizedEmail);
    
    // Generic error message to prevent user enumeration
    if (!user) {
      // Simulate password verification time to prevent timing attacks
      await require('bcryptjs').hash('dummy-password', 12);
      return next(new AppError("Incorrect email or password", 401));
    }

    // Check account status first
    if (!user.isActive) {
      return next(new AppError("Account has been deactivated. Please contact support.", 403));
    }

    if (!user.isEmailVerified) {
      return next(new AppError("Please verify your email before logging in", 403));
    }

    // Verify password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        
        return next(new AppError("Account locked due to too many failed login attempts. Try again in 30 minutes.", 423));
      }
      
      await user.save();
      return next(new AppError("Incorrect email or password", 401));
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / (60 * 1000));
      return next(new AppError(`Account locked. Try again in ${minutesLeft} minutes`, 423));
    }

    // Reset failed login attempts and unlock account
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    // Generate tokens with enhanced security
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);
    
    // Set refresh token expiry based on rememberMe
    const refreshTokenExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

    // Store refresh token with device information
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        fingerprint: req.headers['x-device-id'] || 'unknown'
      },
      createdAt: new Date()
    });

    // Update user login information
    user.lastLogin = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    // Log successful login for audit purposes
    console.log(`User ${user.email} logged in successfully from IP: ${req.ip}`);

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(new AppError(`Login failed: ${error.message}`, 500));
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

    // Generate tokens now that email is verified
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);

    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        refreshToken,
      },
    });
  } catch (error) {
    return next(
      new AppError(`Email verification failed: ${error.message}`, 500),
    );
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Please provide your email address", 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return next(new AppError("User with this email does not exist", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    // Generate new verification token (raw) and save hashed on user
    const verificationToken = user.generateVerificationToken(); // raw token
    await user.save();

    // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email/${verificationToken}`; // raw token URL

    await emailService.sendVerificationEmail({
      name: user.fullName,
      email: user.email,
      verificationUrl,
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return next(
      new AppError(
        `Failed to resend verification email: ${error.message}`,
        500,
      ),
    );
  }
};

/**
 * Forgot password - send reset email
 */
exports.forgotPassword = async (req, res, next) => {
  try {
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
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    await emailService.sendPasswordResetEmail({
      name: user.fullName,
      email: user.email,
      resetUrl,
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Password reset link sent to email",
    });
  } catch (error) {
    return next(
      new AppError(
        `Failed to send password reset email: ${error.message}`,
        500,
      ),
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

    if (password.length < 8) {
      return next(
        new AppError("Password must be at least 8 characters long", 400),
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
    await emailService.sendPasswordChangedEmail({
      name: user.fullName,
      email: user.email,
    });

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

    if (newPassword.length < 8) {
      return next(
        new AppError("Password must be at least 8 characters long", 400),
      );
    }

    // Find user
    const user = await User.findByPk(userId);

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

    // Invalidate all refresh tokens except current one
    await RefreshToken.destroy({
      where: {
        userId: user.id,
        token: { [Op.ne]: req.body.refreshToken },
      },
    });

    // Send password changed confirmation email
    await emailService.sendPasswordChangedEmail({
      name: user.fullName,
      email: user.email,
    });

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

    // Verify refresh token
    const decoded = await jwtUtils.verifyRefreshToken(refreshToken);

    // Check if token exists in database and is not expired
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!storedToken) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // Get user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      // Remove invalid token from database
      await RefreshToken.destroy({
        where: { token: refreshToken },
      });
      return next(new AppError("User not found or inactive", 404));
    }

    // Check if token version matches (if versioning is implemented)
    if (user.tokenVersion && decoded.version && user.tokenVersion !== decoded.version) {
      // Token has been invalidated, remove from database
      await RefreshToken.destroy({
        where: { token: refreshToken },
      });
      return next(new AppError("Token has been invalidated", 401));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = jwtUtils.generateAuthTokens(user);

    // Remove old refresh token and store new one
    await RefreshToken.destroy({
      where: { token: refreshToken },
    });

    await RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        fingerprint: req.headers['x-device-id'] || 'unknown'
      },
      createdAt: new Date()
    });

    // Log token refresh for audit purposes
    console.log(`Token refreshed for user ${user.email} from IP: ${req.ip}`);

    // Return tokens in expected format
    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clean up invalid refresh token if it exists
    if (req.body.refreshToken) {
      await RefreshToken.destroy({
        where: { token: req.body.refreshToken },
      }).catch(err => console.error('Error cleaning up refresh token:', err));
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
      const result = await RefreshToken.destroy({
        where: { userId }
      });
      revokedCount = result;
      
      console.log(`User ${userId} logged out from all devices. Revoked ${revokedCount} tokens.`);
    } else if (refreshToken) {
      // Remove specific refresh token from database
      const result = await RefreshToken.destroy({
        where: { token: refreshToken },
      });
      revokedCount = result;
      
      console.log(`Refresh token revoked for user logout. Tokens revoked: ${revokedCount}`);
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
    console.error('Logout error:', error);
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
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password", "tokenVersion"] },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Return user profile
    return res.status(200).json({
      status: "success",
      data: {
        user,
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
    const user = await User.findByPk(userId);

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
    const user = await User.findByPk(userId);

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
    const user = await User.findByPk(userId);

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

    // Generate tokens
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);

    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Redirect to frontend with tokens
    res.redirect(
      `${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
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

    // Generate tokens
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);

    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Redirect to frontend with tokens
    res.redirect(
      `${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
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

    // Generate tokens
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);

    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Redirect to frontend with tokens
    res.redirect(
      `${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`,
    );
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

    // Find user
    const user = await User.findByPk(userId);

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
    const user = await User.findByEmail(email);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if account is already active
    if (user.isActive) {
      return next(new AppError("Account is already active", 400));
    }

    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError("Incorrect password", 401));
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
    const userId = req.user.id;

    // Find user in database with fresh data
    const user = await User.findByPk(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Return user data (excluding sensitive information)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
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
    const decoded = jwtUtils.verifyAuthToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "isEmailVerified",
      ],
    });
    if (!user) {
      return res.status(200).json({ valid: false });
    }
    return res.status(200).json({ valid: true, user });
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
    const result = await RefreshToken.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() }
      }
    });
    
    console.log(`Cleaned up ${result} expired refresh tokens`);
    return { success: true, cleaned: result };
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
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

    const stats = {
      activeTokens: await RefreshToken.count({
        where: {
          expiresAt: { [Op.gt]: now }
        }
      }),
      expiredTokens: await RefreshToken.count({
        where: {
          expiresAt: { [Op.lt]: now }
        }
      }),
      recentLogins: await User.count({
        where: {
          lastLogin: { [Op.gt]: oneDayAgo }
        }
      }),
      weeklyLogins: await User.count({
        where: {
          lastLogin: { [Op.gt]: oneWeekAgo }
        }
      }),
      totalUsers: await User.count(),
      activeUsers: await User.count({
        where: { isActive: true }
      })
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get auth stats:', error);
    return next(new AppError(`Failed to get authentication statistics: ${error.message}`, 500));
  }
};

/**
 * OAuth callback handler
 */
if (false) {
  /**
   * OAuth callback handler
   */
}
