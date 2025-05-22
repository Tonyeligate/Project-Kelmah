/**
 * Email Service
 * Handles sending various types of emails for authentication
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: config.email.smtp.auth
    });
  }

  /**
   * Send verification email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   * @param {string} options.verificationUrl - Email verification URL
   */
  async sendVerificationEmail({ name, email, verificationUrl }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Verify your Kelmah account',
        html: `
          <h1>Welcome to Kelmah!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for registering with Kelmah. Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with Kelmah, please ignore this email.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email: ${error.message}`);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   * @param {string} options.resetUrl - Password reset URL
   */
  async sendPasswordResetEmail({ name, email, resetUrl }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Reset your Kelmah password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error.message}`);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password changed confirmation email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   */
  async sendPasswordChangedEmail({ name, email }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your Kelmah password has been changed',
        html: `
          <h1>Password Changed</h1>
          <p>Hi ${name},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password changed confirmation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password changed email: ${error.message}`);
      throw new Error('Failed to send password changed email');
    }
  }

  /**
   * Send two-factor authentication setup email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   * @param {string} options.secret - 2FA secret key
   */
  async sendTwoFactorSetupEmail({ name, email, secret }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Two-Factor Authentication Setup',
        html: `
          <h1>Two-Factor Authentication Setup</h1>
          <p>Hi ${name},</p>
          <p>You have enabled two-factor authentication for your Kelmah account.</p>
          <p>Your secret key is: <strong>${secret}</strong></p>
          <p>Please save this key in a secure location. You'll need it to generate verification codes.</p>
          <p>If you didn't enable two-factor authentication, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`2FA setup email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send 2FA setup email: ${error.message}`);
      throw new Error('Failed to send 2FA setup email');
    }
  }

  /**
   * Send account locked notification email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   * @param {string} options.unlockTime - Time when account will be unlocked
   */
  async sendAccountLockedEmail({ name, email, unlockTime }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your Kelmah account has been locked',
        html: `
          <h1>Account Locked</h1>
          <p>Hi ${name},</p>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>Your account will be unlocked at: ${unlockTime}</p>
          <p>If you didn't attempt to log in, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Account locked notification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send account locked email: ${error.message}`);
      throw new Error('Failed to send account locked email');
    }
  }

  /**
   * Send account unlocked notification email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   */
  async sendAccountUnlockedEmail({ name, email }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your Kelmah account has been unlocked',
        html: `
          <h1>Account Unlocked</h1>
          <p>Hi ${name},</p>
          <p>Your account has been unlocked. You can now log in again.</p>
          <p>If you didn't request this, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Account unlocked notification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send account unlocked email: ${error.message}`);
      throw new Error('Failed to send account unlocked email');
    }
  }

  /**
   * Send account deactivation email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   */
  async sendAccountDeactivationEmail({ name, email }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your Kelmah account has been deactivated',
        html: `
          <h1>Account Deactivated</h1>
          <p>Hi ${name},</p>
          <p>Your Kelmah account has been deactivated as requested.</p>
          <p>If you wish to reactivate your account, you can do so by logging in with your credentials within the next 30 days.</p>
          <p>After 30 days, your account may be permanently deleted in accordance with our data retention policy.</p>
          <p>If you did not request this action, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Account deactivation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send account deactivation email: ${error.message}`);
      throw new Error('Failed to send account deactivation email');
    }
  }

  /**
   * Send account reactivation email
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   */
  async sendAccountReactivationEmail({ name, email }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your Kelmah account has been reactivated',
        html: `
          <h1>Account Reactivated</h1>
          <p>Hi ${name},</p>
          <p>Your Kelmah account has been successfully reactivated.</p>
          <p>You can now log in and continue using all Kelmah platform features.</p>
          <p>If you did not request this action, please contact our support team immediately.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Account reactivation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send account reactivation email: ${error.message}`);
      throw new Error('Failed to send account reactivation email');
    }
  }

  /**
   * Send login notification email for suspicious activity
   * @param {Object} options - Email options
   * @param {string} options.name - Recipient's name
   * @param {string} options.email - Recipient's email
   * @param {Object} options.deviceInfo - Device information
   * @param {string} options.location - Location information
   * @param {string} options.time - Time of login
   */
  async sendLoginNotificationEmail({ name, email, deviceInfo, location, time }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'New Login to Your Kelmah Account',
        html: `
          <h1>New Login Detected</h1>
          <p>Hi ${name},</p>
          <p>We detected a new login to your Kelmah account:</p>
          <ul>
            <li><strong>Device:</strong> ${deviceInfo}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Time:</strong> ${time}</li>
          </ul>
          <p>If this was you, you can ignore this email.</p>
          <p>If you didn't sign in recently, please change your password immediately and contact our support team.</p>
          <p>Best regards,<br>The Kelmah Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Login notification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send login notification email: ${error.message}`);
      throw new Error('Failed to send login notification email');
    }
  }
}

module.exports = new EmailService(); 