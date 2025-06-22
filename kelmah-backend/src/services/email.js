/**
 * Email Service
 * Handles sending emails for various purposes
 */

const nodemailer = require('nodemailer');
const config = require('../config');

// Create reusable transporter object using SMTP transport
let transporter;

// Initialize transporter based on environment
if (process.env.NODE_ENV === 'production') {
  // Production email configuration
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  // Development email configuration (ethereal.email)
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_EMAIL || 'ethereal.user@ethereal.email',
      pass: process.env.ETHEREAL_PASSWORD || 'ethereal_pass'
    }
  });
}

/**
 * Send verification email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Nodemailer info object
 */
exports.sendVerificationEmail = async ({ name, email, verificationUrl }) => {
  const mailOptions = {
    from: `"Kelmah Platform" <${config.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h1>Email Verification</h1>
      <p>Hello ${name},</p>
      <p>Thank you for registering with Kelmah. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email Address</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The Kelmah Team</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Nodemailer info object
 */
exports.sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  const mailOptions = {
    from: `"Kelmah Platform" <${config.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset</h1>
      <p>Hello ${name},</p>
      <p>You requested to reset your password. Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Best regards,<br>The Kelmah Team</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send account locked email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Nodemailer info object
 */
exports.sendAccountLockedEmail = async ({ name, email, unlockTime }) => {
  const mailOptions = {
    from: `"Kelmah Platform" <${config.EMAIL_FROM}>`,
    to: email,
    subject: 'Account Temporarily Locked',
    html: `
      <h1>Account Security Alert</h1>
      <p>Hello ${name},</p>
      <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
      <p>Your account will be automatically unlocked at: ${unlockTime}</p>
      <p>If you did not attempt to log in, please reset your password immediately when your account is unlocked.</p>
      <p>Best regards,<br>The Kelmah Team</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send login notification email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Nodemailer info object
 */
exports.sendLoginNotificationEmail = async ({ name, email, deviceInfo, location, time }) => {
  const mailOptions = {
    from: `"Kelmah Platform" <${config.EMAIL_FROM}>`,
    to: email,
    subject: 'New Login to Your Account',
    html: `
      <h1>New Login Alert</h1>
      <p>Hello ${name},</p>
      <p>We detected a new login to your account with the following details:</p>
      <ul>
        <li><strong>Device:</strong> ${deviceInfo}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>If this was you, you can ignore this email.</p>
      <p>If you did not log in, please reset your password immediately and contact support.</p>
      <p>Best regards,<br>The Kelmah Team</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};
