/**
 * Secure Authentication Controller
 * Enhanced security implementation for Kelmah platform
 */

const { Op } = require('sequelize');
const SecurityUtils = require('../utils/security');
const secureJWT = require('../utils/jwt-secure');
const { User, RefreshToken } = require('../models');
const emailService = require('../services/email.service');
const auditLogger = require('../../../shared/utils/audit-logger');

class SecureAuthController {
  /**
   * Register a new user with enhanced security validation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async register(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        role = 'worker',
        acceptTerms = false
      } = req.body;
      
      // Rate limiting check
      const rateLimitKey = `register:${req.ip}`;
      const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000); // 3 per hour
      
      if (rateLimit.isLimited) {
        return res.status(429).json({
          success: false,
          message: `Too many registration attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter
        });
      }
      
      // Validate input
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }
      
      // Terms acceptance validation
      if (!acceptTerms) {
        return res.status(400).json({
          success: false,
          message: 'You must accept the terms and conditions',
          code: 'TERMS_NOT_ACCEPTED'
        });
      }
      
      // Sanitize input
      const sanitizedData = {
        firstName: SecurityUtils.sanitizeInput(firstName.trim()),
        lastName: SecurityUtils.sanitizeInput(lastName.trim()),
        email: email.trim().toLowerCase(),
        phone: phone ? SecurityUtils.sanitizeInput(phone.trim()) : null,
        role: ['worker', 'hirer'].includes(role) ? role : 'worker'
      };
      
      // Email validation
      if (!SecurityUtils.validateEmail(sanitizedData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
          code: 'INVALID_EMAIL'
        });
      }
      
      // Phone validation (if provided)
      if (sanitizedData.phone && !SecurityUtils.validatePhone(sanitizedData.phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number',
          code: 'INVALID_PHONE'
        });
      }
      
      // Enhanced password validation
      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet security requirements',
          code: 'WEAK_PASSWORD',
          errors: passwordValidation.errors,
          score: passwordValidation.score
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: sanitizedData.email },
            sanitizedData.phone ? { phone: sanitizedData.phone } : {}
          ]
        }
      });
      
      if (existingUser) {
        // Don't reveal which field conflicts for security
        return res.status(409).json({
          success: false,
          message: 'An account with this email or phone number already exists',
          code: 'USER_ALREADY_EXISTS'
        });
      }
      
      // Hash password securely
      const hashedPassword = await SecurityUtils.hashPassword(password);
      
      // Generate verification token
      const verificationToken = SecurityUtils.generateSecureToken(32);
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user
      const user = await User.create({
        ...sanitizedData,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationTokenExpires,
        isEmailVerified: false,
        isActive: true,
        tokenVersion: 1,
        registrationIP: req.ip,
        registrationUserAgent: req.headers['user-agent'],
        termsAcceptedAt: new Date()
      });
      
      // Send verification email
      try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await emailService.sendVerificationEmail({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          verificationUrl
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
      
      // Audit log
      await auditLogger.log({
        userId: user.id,
        action: 'USER_REGISTER',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          email: user.email,
          role: user.role
        }
      });
      
      // Return success response (don't include sensitive data)
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        code: 'REGISTRATION_SUCCESS',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: false
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to server error',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
  
  /**
   * Login user with enhanced security
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async login(req, res, next) {
    try {
      const { email, password, rememberMe = false } = req.body;
      
      // Input validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }
      
      const sanitizedEmail = SecurityUtils.sanitizeInput(email.trim().toLowerCase());
      
      // Rate limiting check
      const rateLimitKey = `login:${req.ip}:${sanitizedEmail}`;
      const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
      
      if (rateLimit.isLimited) {
        return res.status(429).json({
          success: false,
          message: `Too many login attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter
        });
      }
      
      // Find user
      const user = await User.findOne({
        where: { email: sanitizedEmail }
      });
      
      // Generic error message to prevent user enumeration
      const invalidCredentialsResponse = {
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      };
      
      if (!user) {
        // Simulate password verification time to prevent timing attacks
        await SecurityUtils.hashPassword('dummy-password');
        return res.status(401).json(invalidCredentialsResponse);
      }
      
      // Check account status
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          message: `Account is locked. Try again in ${minutesLeft} minutes.`,
          code: 'ACCOUNT_LOCKED',
          retryAfter: minutesLeft * 60
        });
      }
      
      // Verify password
      const isPasswordValid = await SecurityUtils.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          
          // Send account locked email
          try {
            await emailService.sendAccountLockedEmail({
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              unlockTime: user.accountLockedUntil.toLocaleString()
            });
          } catch (emailError) {
            console.error('Failed to send account locked email:', emailError);
          }
          
          await user.save();
          
          return res.status(423).json({
            success: false,
            message: 'Account locked due to too many failed login attempts. Check your email for instructions.',
            code: 'ACCOUNT_LOCKED_FAILED_ATTEMPTS'
          });
        }
        
        await user.save();
        return res.status(401).json(invalidCredentialsResponse);
      }
      
      // Reset failed login attempts and unlock account
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      
      // Create request context
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceFingerprint: secureJWT.generateDeviceFingerprint(req)
      };
      
      // Generate tokens
      const accessToken = secureJWT.generateAccessToken(user, context);
      const refreshTokenData = await secureJWT.generateRefreshToken(user, context);
      
      // Set refresh token expiry based on rememberMe
      if (rememberMe) {
        refreshTokenData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
      
      // Store refresh token in database
      await RefreshToken.create({
        userId: user.id,
        tokenId: refreshTokenData.tokenId,
        tokenHash: refreshTokenData.tokenHash,
        expiresAt: refreshTokenData.expiresAt,
        deviceInfo: context.userAgent,
        ipAddress: context.ipAddress,
        version: user.tokenVersion,
        isRevoked: false
      });
      
      // Update user login information
      user.lastLoginAt = new Date();
      user.lastLoginIP = context.ipAddress;
      user.lastLoginUserAgent = context.userAgent;
      await user.save();
      
      // Audit log
      await auditLogger.log({
        userId: user.id,
        action: 'USER_LOGIN',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          email: user.email,
          rememberMe
        }
      });
      
      // Check for suspicious login (different IP/device)
      // Implementation would go here for real-world deployment
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        code: 'LOGIN_SUCCESS',
        data: {
          accessToken,
          refreshToken: refreshTokenData.token,
          tokenType: 'Bearer',
          expiresIn: secureJWT.parseExpiry(process.env.JWT_EXPIRES_IN || '15m'),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          }
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication service error',
        code: 'LOGIN_ERROR'
      });
    }
  }
  
  /**
   * Refresh access token with token rotation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }
      
      // Rate limiting for refresh attempts
      const rateLimitKey = `refresh:${req.ip}`;
      const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 10, 60 * 1000); // 10 per minute
      
      if (rateLimit.isLimited) {
        return res.status(429).json({
          success: false,
          message: 'Too many refresh attempts',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter
        });
      }
      
      // Extract token ID from JWT part
      const parts = refreshToken.split('.');
      if (parts.length !== 4) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token format',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      const signedPart = parts.slice(0, 3).join('.');
      const decoded = require('jsonwebtoken').decode(signedPart);
      
      if (!decoded?.jti) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      // Get stored token
      const storedToken = await RefreshToken.findOne({
        where: {
          tokenId: decoded.jti,
          isRevoked: false,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role', 'tokenVersion', 'isActive', 'firstName', 'lastName', 'isEmailVerified']
        }]
      });
      
      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      // Verify refresh token
      const verification = await secureJWT.verifyRefreshToken(refreshToken, storedToken);
      
      if (!verification.valid) {
        // Revoke token on verification failure
        await RefreshToken.update(
          { 
            isRevoked: true, 
            revokedAt: new Date(),
            revokedReason: verification.error
          },
          { where: { id: storedToken.id } }
        );
        
        return res.status(401).json({
          success: false,
          message: verification.error,
          code: 'REFRESH_TOKEN_INVALID'
        });
      }
      
      const user = storedToken.user;
      
      // Check if user is still active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      // Create request context
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceFingerprint: secureJWT.generateDeviceFingerprint(req)
      };
      
      // Generate new access token
      const newAccessToken = secureJWT.generateAccessToken(user, context);
      
      // Rotate refresh token (generate new, revoke old)
      const newRefreshTokenData = await secureJWT.rotateRefreshToken(
        user, 
        storedToken.tokenId, 
        context
      );
      
      // Audit log
      await auditLogger.log({
        userId: user.id,
        action: 'TOKEN_REFRESH',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          oldTokenId: storedToken.tokenId,
          newTokenId: newRefreshTokenData.tokenId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        code: 'TOKEN_REFRESH_SUCCESS',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshTokenData.token,
          tokenType: 'Bearer',
          expiresIn: secureJWT.parseExpiry(process.env.JWT_EXPIRES_IN || '15m'),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          }
        }
      });
      
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        code: 'TOKEN_REFRESH_ERROR'
      });
    }
  }
  
  /**
   * Logout user and revoke tokens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken, logoutAll = false } = req.body;
      const userId = req.user?.id;
      
      if (logoutAll && userId) {
        // Revoke all refresh tokens for the user
        const revokedCount = await secureJWT.revokeAllRefreshTokens(
          userId, 
          'User logout - all devices'
        );
        
        // Increment token version to invalidate all access tokens
        await User.update(
          { tokenVersion: require('sequelize').literal('token_version + 1') },
          { where: { id: userId } }
        );
        
        await auditLogger.log({
          userId,
          action: 'LOGOUT_ALL_DEVICES',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: { revokedTokens: revokedCount }
        });
        
        return res.status(200).json({
          success: true,
          message: 'Logged out from all devices successfully',
          code: 'LOGOUT_ALL_SUCCESS'
        });
      }
      
      if (refreshToken) {
        // Revoke specific refresh token
        const parts = refreshToken.split('.');
        if (parts.length === 4) {
          const signedPart = parts.slice(0, 3).join('.');
          const decoded = require('jsonwebtoken').decode(signedPart);
          
          if (decoded?.jti) {
            await RefreshToken.update(
              { 
                isRevoked: true, 
                revokedAt: new Date(),
                revokedReason: 'User logout'
              },
              { where: { tokenId: decoded.jti } }
            );
          }
        }
      }
      
      await auditLogger.log({
        userId,
        action: 'USER_LOGOUT',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        code: 'LOGOUT_SUCCESS'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }
  
  /**
   * Verify email address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required',
          code: 'MISSING_TOKEN'
        });
      }
      
      // Find user by verification token
      const user = await User.findOne({
        where: {
          emailVerificationToken: token,
          emailVerificationTokenExpires: { [Op.gt]: new Date() }
        }
      });
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        });
      }
      
      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationTokenExpires = null;
      user.emailVerifiedAt = new Date();
      await user.save();
      
      // Audit log
      await auditLogger.log({
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        code: 'EMAIL_VERIFIED'
      });
      
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Email verification failed',
        code: 'VERIFICATION_ERROR'
      });
    }
  }
}

module.exports = SecureAuthController;