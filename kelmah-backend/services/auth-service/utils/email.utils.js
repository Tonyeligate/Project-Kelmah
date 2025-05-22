/**
 * Email Utilities for Authentication Service
 * Handles email sending for account verification and password reset
 */

const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create reusable transporter
let transporter;

/**
 * Initialize the email transporter with configuration from environment
 */
const initializeTransporter = () => {
  try {
    // If transporter already exists, return it
    if (transporter) return transporter;

    // Create a transporter using environment variables
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Optional configuration for development
      ...(process.env.NODE_ENV === 'development' && {
        tls: {
          rejectUnauthorized: false,
        },
      }),
    });

    return transporter;
  } catch (error) {
    logger.error('Error initializing email transporter:', error);
    throw new Error('Failed to initialize email service');
  }
};

/**
 * Send an email with the given options
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email sending result
 */
const sendEmail = async (options) => {
  try {
    const emailTransporter = initializeTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Kelmah Platform'} <${
        process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      }>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send verification email to a new user
 * @param {Object} data - User data and verification URL
 * @returns {Promise<Object>} - Email sending result
 */
exports.sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  try {
    const subject = 'Verify Your Email Address';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #1e2a38; color: #ffd700; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Verify Your Email</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${name},</p>
          <p>Thank you for registering with Kelmah Platform. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #ffd700; color: #1e2a38; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, please copy and paste the following link into your browser:</p>
          <p><a href="${verificationUrl}" style="color: #0066cc; word-break: break-all;">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    return await sendEmail({
      to: email,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {Object} data - User data and reset URL
 * @returns {Promise<Object>} - Email sending result
 */
exports.sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  try {
    const subject = 'Reset Your Password';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #1e2a38; color: #ffd700; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Reset Your Password</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #ffd700; color: #1e2a38; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, please copy and paste the following link into your browser:</p>
          <p><a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    return await sendEmail({
      to: email,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email after email verification
 * @param {Object} data - User data
 * @returns {Promise<Object>} - Email sending result
 */
exports.sendWelcomeEmail = async ({ email, name }) => {
  try {
    const subject = 'Welcome to Kelmah Platform';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #1e2a38; color: #ffd700; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Welcome to Kelmah!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${name},</p>
          <p>Thank you for verifying your email address. Your account is now fully activated.</p>
          <p>With Kelmah Platform, you can:</p>
          <ul style="padding-left: 20px;">
            <li>Find or post jobs tailored to your needs</li>
            <li>Connect with skilled workers or potential employers</li>
            <li>Manage payments securely with our protected escrow system</li>
            <li>Build your professional profile and reputation</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
              style="background-color: #ffd700; color: #1e2a38; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Kelmah Team</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    return await sendEmail({
      to: email,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}; 