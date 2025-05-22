/**
 * Auth Controller
 * Handles authentication-related operations for the Kelmah platform
 */

const models = require('../models');
const { User, RefreshToken } = models;
const AppError = require('../utils/app-error');
const jwtUtils = require('../utils/jwt');
const emailService = require('../services/email.service');
const crypto = require('crypto');
const { Op } = require('sequelize');
const config = require('../config');
const { generateOTP } = require('../utils/otp');
const deviceUtil = require('../utils/device');
const sessionUtil = require('../utils/session');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'worker'
    } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    
    // Create the user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
      phone,
      role: ['worker', 'hirer'].includes(role) ? role : 'worker' // Prevent admin creation
    });
    
    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

      // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    await emailService.sendVerificationEmail({
      name: user.fullName,
        email: user.email,
        verificationUrl
      });

    // Generate tokens but don't return refresh token until email is verified
    const { accessToken } = jwtUtils.generateAuthTokens(user);
    
    // Return user info and token
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        accessToken
      }
    });
  } catch (error) {
    return next(new AppError(`Registration failed: ${error.message}`, 500));
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);
    
    // Check if user exists and password is correct
    if (!user || !(await user.validatePassword(password))) {
      // Increment failed login attempts
      if (user) {
        user.failedLoginAttempts += 1;
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.accountLocked = true;
          user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
          
          await user.save();
          
          const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / (60 * 1000));
          
          // Send account locked email
          const unlockTime = user.accountLockedUntil.toLocaleString();
          await emailService.sendAccountLockedEmail({
            name: user.fullName,
            email: user.email,
            unlockTime
          });
          
          return next(new AppError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes`, 403));
        }
        
        await user.save();
      }
      
      return next(new AppError('Incorrect email or password', 401));
    }
    
    // Check if account is locked
    if (user.accountLocked) {
      if (user.accountLockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / (60 * 1000));
        return next(new AppError(`Account locked. Try again in ${minutesLeft} minutes`, 403));
      } else {
        // Unlock account if lock period has expired
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
      }
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return next(new AppError('Please verify your email before logging in', 401));
    }
    
    // Parse device information
    const userAgent = req.headers['user-agent'];
    const deviceInfo = deviceUtil.parseUserAgent(userAgent);
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check for suspicious activity
    const isSuspicious = deviceUtil.isSuspicious(deviceInfo);
    
    // Get current location safely
    const currentLocation = await deviceUtil.getLocationFromIP(ip);
    
    // Safety check for location data - completely disable location check if needed
    let isLocationSuspicious = false;
    
    if (currentLocation && 
        typeof currentLocation === 'object' && 
        Array.isArray(user.previousLocations) && 
        user.previousLocations.length > 0) {
      // Only do location checks if we have valid data
      isLocationSuspicious = deviceUtil.isLocationSuspicious(currentLocation, user.previousLocations);
    }
    
    // If suspicious, send login notification
    if (isSuspicious || isLocationSuspicious) {
      try {
        // Make sure we don't try to access properties of undefined objects
        const userName = user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          (user.email || 'User');
        
        const deviceInfoFormatted = deviceInfo ? 
          (deviceUtil.formatDeviceInfo(deviceInfo) || 'Unknown device') : 
          'Unknown device';
        
        const locationFormatted = currentLocation ? 
          `${currentLocation.city || 'Unknown city'}, ${currentLocation.country || 'Unknown country'}` : 
          'Unknown location';
          
        await emailService.sendLoginNotificationEmail({
          name: userName,
        email: user.email,
          deviceInfo: deviceInfoFormatted,
          location: locationFormatted,
          time: new Date().toLocaleString()
        });
      } catch (emailError) {
        // Just log the error but don't stop the login process
        logger.error(`Failed to send login notification: ${emailError.message}`);
      }
    }
    
    // Create a new session
    const session = await sessionUtil.create({
      userId: user.id,
      deviceInfo,
      ip
    });

    // Generate tokens
    const { accessToken, refreshToken } = jwtUtils.generateAuthTokens(user);
    
    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Update user login information
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    
    // Handle location tracking - only if schema supports it
    try {
      // These fields are new - might not exist in database yet
      if ('lastLoginIP' in user) user.lastLoginIP = ip;
      if ('lastLoginDevice' in user && deviceInfo) {
        user.lastLoginDevice = deviceUtil.formatDeviceName(deviceInfo);
      }
      
      // Only update location info if the columns exist
      if ('lastLoginLocation' in user && currentLocation && typeof currentLocation === 'object') {
        // Simplified location object 
        const cleanLocation = {
          country: currentLocation.country || 'Unknown',
          city: currentLocation.city || 'Unknown'
        };
        
        user.lastLoginLocation = cleanLocation;
        
        // Track location history if supported
        if ('previousLocations' in user) {
          // Initialize if needed
          if (!Array.isArray(user.previousLocations)) {
            user.previousLocations = [];
          }
          
          user.previousLocations.push({
            ...cleanLocation,
            timestamp: Date.now()
          });
          
          // Keep only recent entries
          if (user.previousLocations.length > 5) {
            user.previousLocations = user.previousLocations.slice(-5);
          }
        }
      }
    } catch (locationError) {
      // Ignore location errors - don't block login
      logger.warn(`Location tracking error: ${locationError.message}`);
    }
    
    await user.save();

    // Send response
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
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
      return next(new AppError('Invalid or expired verification token', 400));
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    return next(new AppError(`Email verification failed: ${error.message}`, 500));
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('Please provide your email address', 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return next(new AppError('User with this email does not exist', 404));
    }
    
    if (user.isEmailVerified) {
      return next(new AppError('Email is already verified', 400));
    }
    
    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    
    await emailService.sendVerificationEmail({
      name: user.fullName,
      email: user.email,
      verificationUrl
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    return next(new AppError(`Failed to resend verification email: ${error.message}`, 500));
  }
};

/**
 * Forgot password - send reset email
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('Please provide your email address', 400));
    }

    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      // We don't want to reveal if a user exists or not
      return res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset link has been sent'
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
      resetUrl
    });

    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    return next(new AppError(`Failed to send password reset email: ${error.message}`, 500));
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
      return next(new AppError('Please provide a new password', 400));
    }
    
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }
    
    // Find user by reset token
    const user = await User.findByPasswordResetToken(token);

    if (!user) {
      return next(new AppError('Invalid or expired password reset token', 400));
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
      email: user.email
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in with your new password.'
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
      return next(new AppError('Please provide current and new password', 400));
    }
    
    if (newPassword.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Verify current password
    if (!(await user.validatePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }
    
    // Update password
    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate all existing tokens except current session
    
    await user.save();
    
    // Invalidate all refresh tokens except current one
    await RefreshToken.destroy({
      where: {
        userId: user.id,
        token: { [Op.ne]: req.body.refreshToken }
      }
    });
    
    // Send password changed confirmation email
    await emailService.sendPasswordChangedEmail({
      name: user.fullName,
      email: user.email
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
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
      return next(new AppError('Refresh token is required', 400));
    }
    
    // Verify refresh token
    const decoded = await jwtUtils.verifyRefreshToken(refreshToken);
    
    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    
    if (!storedToken) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    
    // Get user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if token version matches
    if (user.tokenVersion !== decoded.version) {
      // Token has been invalidated, remove from database
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
      
      return next(new AppError('Token has been invalidated', 401));
    }

    // Generate new access token
    const accessToken = jwtUtils.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Return new access token
    return res.status(200).json({
      status: 'success',
      data: {
        accessToken
      }
    });
  } catch (error) {
    return next(new AppError(`Token refresh failed: ${error.message}`, 500));
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Remove refresh token from database
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
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
      attributes: { exclude: ['password', 'tokenVersion'] }
    });
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Return user profile
    return res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    return next(new AppError(`Failed to get user profile: ${error.message}`, 500));
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
      return next(new AppError('User not found', 404));
    }
    
    if (user.isTwoFactorEnabled) {
      return next(new AppError('Two-factor authentication is already enabled', 400));
    }
    
    // Generate and store 2FA secret
    const secret = speakeasy.generateSecret({ length: 20 });
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    // Generate QR code
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `Kelmah:${user.email}`,
      issuer: 'Kelmah Platform'
    });
    
    const qrCode = await QRCode.toDataURL(otpAuthUrl);
    
    // Return setup data
    return res.status(200).json({
      status: 'success',
      data: {
      secret: secret.base32,
      qrCode
      }
    });
  } catch (error) {
    return next(new AppError(`Two-factor setup failed: ${error.message}`, 500));
  }
};

/**
 * Verify and enable two-factor authentication
 */
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    
    if (!token) {
      return next(new AppError('Verification token is required', 400));
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    if (!user.twoFactorSecret) {
      return next(new AppError('Two-factor authentication not set up', 400));
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return next(new AppError('Invalid verification code', 400));
    }
    
    // Enable 2FA
    user.isTwoFactorEnabled = true;
    await user.save();
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    return next(new AppError(`Two-factor verification failed: ${error.message}`, 500));
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
      return next(new AppError('Password is required', 400));
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError('Incorrect password', 401));
    }
    
    // Verify 2FA token if enabled
    if (user.isTwoFactorEnabled) {
      if (!token) {
        return next(new AppError('Two-factor verification code is required', 400));
      }
      
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });
      
      if (!verified) {
        return next(new AppError('Invalid verification code', 400));
      }
    }
    
    // Disable 2FA
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    return next(new AppError(`Failed to disable two-factor authentication: ${error.message}`, 500));
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Redirect to frontend with tokens
    res.redirect(`${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
  } catch (error) {
    return next(new AppError(`Google OAuth callback failed: ${error.message}`, 500));
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Redirect to frontend with tokens
    res.redirect(`${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
  } catch (error) {
    return next(new AppError(`Facebook OAuth callback failed: ${error.message}`, 500));
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Redirect to frontend with tokens
    res.redirect(`${config.frontendUrl}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
  } catch (error) {
    return next(new AppError(`LinkedIn OAuth callback failed: ${error.message}`, 500));
  }
};

/**
 * Get user's active sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionUtil = require('../utils/session');
    
    // Get all active sessions for the user
    const sessions = await sessionUtil.getActiveSessions(userId);
    
    // Format for response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceName: session.deviceName,
      ip: session.ip,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expiresAt: session.expiresAt,
      isCurrentSession: req.headers.authorization && 
        req.headers.authorization.split(' ')[1] === session.id
    }));
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      data: {
        sessions: formattedSessions
      }
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
    const sessionUtil = require('../utils/session');
    
    // Get the session first to verify ownership
    const session = await sessionUtil.get(sessionId);
    
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    
    if (session.userId !== userId) {
      return next(new AppError('Unauthorized to end this session', 403));
    }
    
    // Check if trying to end current session
    const currentToken = req.headers.authorization && 
      req.headers.authorization.split(' ')[1];
      
    if (sessionId === currentToken) {
      return next(new AppError('Cannot end current session. Use logout instead.', 400));
    }
    
    // End the session
    await sessionUtil.end(sessionId);
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Session ended successfully'
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
    const sessionUtil = require('../utils/session');
    
    // Get current session token
    const currentToken = req.headers.authorization && 
      req.headers.authorization.split(' ')[1];
    
    // End all sessions except current
    await sessionUtil.endAllExcept(userId, currentToken);
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'All other sessions ended successfully'
    });
  } catch (error) {
    return next(new AppError(`Failed to end all sessions: ${error.message}`, 500));
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
      return next(new AppError('Password is required', 400));
    }
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError('Incorrect password', 401));
    }
    
    // Deactivate account
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();
    
    // End all sessions
    const sessionUtil = require('../utils/session');
    await sessionUtil.endAll(userId);
    
    // Send account deactivation email
    await emailService.sendAccountDeactivationEmail({
      name: user.fullName,
      email: user.email
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    return next(new AppError(`Failed to deactivate account: ${error.message}`, 500));
  }
};

/**
 * Reactivate user account
 */
exports.reactivateAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if account is already active
    if (user.isActive) {
      return next(new AppError('Account is already active', 400));
    }
    
    // Verify password
    if (!(await user.validatePassword(password))) {
      return next(new AppError('Incorrect password', 401));
    }
    
    // Reactivate account
    user.isActive = true;
    user.deactivatedAt = null;
    await user.save();
    
    // Send account reactivation email
    await emailService.sendAccountReactivationEmail({
      name: user.fullName,
      email: user.email
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Account reactivated successfully'
    });
  } catch (error) {
    return next(new AppError(`Failed to reactivate account: ${error.message}`, 500));
  }
};

/**
 * OAuth callback handler
 */
exports.oauthCallback = async (req, res, next) => {
  try {
    // Placeholder function for OAuth callback
    return res.status(200).json({
      status: 'success',
      message: 'OAuth authentication successful'
    });
  } catch (error) {
    return next(new AppError(`OAuth callback failed: ${error.message}`, 500));
  }
};

/**
 * MFA setup
 */
exports.mfaSetup = async (req, res, next) => {
  try {
    // Placeholder function for MFA setup
    return res.status(200).json({
      status: 'success',
      message: 'MFA setup endpoint (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`MFA setup failed: ${error.message}`, 500));
  }
};

/**
 * Verify two-factor authentication
 */
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    // Placeholder function for two-factor verification
    return res.status(200).json({
      status: 'success',
      message: 'Two-factor verification endpoint (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Two-factor verification failed: ${error.message}`, 500));
  }
};

/**
 * Disable two-factor authentication
 */
exports.disableTwoFactor = async (req, res, next) => {
  try {
    // Placeholder function for disabling two-factor auth
    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication disabled (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Failed to disable two-factor auth: ${error.message}`, 500));
  }
};

/**
 * Get user sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    // Placeholder function for getting sessions
    return res.status(200).json({
      status: 'success',
      message: 'Get sessions endpoint (placeholder)',
      data: {
        sessions: []
      }
    });
  } catch (error) {
    return next(new AppError(`Failed to retrieve sessions: ${error.message}`, 500));
  }
};

/**
 * End all sessions except current
 */
exports.endAllSessions = async (req, res, next) => {
  try {
    // Placeholder function for ending all sessions
    return res.status(200).json({
      status: 'success',
      message: 'All sessions terminated (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Failed to end sessions: ${error.message}`, 500));
  }
};

/**
 * End specific session
 */
exports.endSession = async (req, res, next) => {
  try {
    // Placeholder function for ending a specific session
    return res.status(200).json({
      status: 'success',
      message: 'Session terminated (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Failed to end session: ${error.message}`, 500));
  }
};

/**
 * Deactivate account
 */
exports.deactivateAccount = async (req, res, next) => {
  try {
    // Placeholder function for deactivating account
    return res.status(200).json({
      status: 'success',
      message: 'Account deactivated (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Failed to deactivate account: ${error.message}`, 500));
  }
};

/**
 * Reactivate account
 */
exports.reactivateAccount = async (req, res, next) => {
  try {
    // Placeholder function for reactivating account
    return res.status(200).json({
      status: 'success',
      message: 'Account reactivated (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Failed to reactivate account: ${error.message}`, 500));
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    // Placeholder function for getting user profile
    return res.status(200).json({
      status: 'success',
      message: 'Get user profile endpoint (placeholder)',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    return next(new AppError(`Failed to get user profile: ${error.message}`, 500));
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res, next) => {
  try {
    // Placeholder function for logout
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Logout failed: ${error.message}`, 500));
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // Placeholder function for token refresh
    return res.status(200).json({
      status: 'success',
      message: 'Token refresh endpoint (placeholder)',
      data: {
        accessToken: 'new-access-token-placeholder'
      }
    });
  } catch (error) {
    return next(new AppError(`Token refresh failed: ${error.message}`, 500));
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    // Placeholder function for password change
    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully (placeholder)'
    });
  } catch (error) {
    return next(new AppError(`Password change failed: ${error.message}`, 500));
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
      return next(new AppError('User not found', 404));
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
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return next(new AppError(`Authentication verification failed: ${error.message}`, 500));
  }
}; 