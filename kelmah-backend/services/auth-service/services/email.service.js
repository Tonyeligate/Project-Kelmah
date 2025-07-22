const nodemailer = require('nodemailer');
const { EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = require('../config');

// Add more detailed logging to help diagnose environment variable issues
console.log('SMTP config → host:', SMTP_HOST, 'port:', SMTP_PORT);
console.log('EMAIL_FROM:', EMAIL_FROM);
console.log('SMTP_USER:', SMTP_USER);
console.log('SMTP_PASS:', SMTP_PASS ? '******' : 'undefined');
console.log('Direct env access → SMTP_HOST:', process.env.SMTP_HOST);
console.log('Direct env access → SMTP_PORT:', process.env.SMTP_PORT);

// Create a test configuration object to verify values
const smtpConfig = {
  host: SMTP_HOST || 'smtp.gmail.com', // Fallback to gmail if undefined
  port: Number(SMTP_PORT) || 465,      // Fallback to 465 if undefined
  secure: (Number(SMTP_PORT) === 465) || false,
  auth: { 
    user: SMTP_USER || process.env.SMTP_USER, 
    pass: SMTP_PASS || process.env.SMTP_PASS
  }
};

console.log('Using SMTP config:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: { user: smtpConfig.auth.user, pass: smtpConfig.auth.pass ? '******' : 'undefined' }
});

const transporter = nodemailer.createTransport(smtpConfig);

module.exports = {
  sendVerificationEmail: async ({ name, email, verificationUrl }) => {
    const subject = 'Verify your Kelmah email';
    const text = `Hello ${name},\n\nPlease verify your email by clicking: ${verificationUrl}`;
    const html = `<p>Hello ${name},</p><p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendPasswordResetEmail: async ({ name, email, resetUrl }) => {
    const subject = 'Kelmah Password Reset';
    const text = `Hello ${name},\n\nReset your password by clicking: ${resetUrl}`;
    const html = `<p>Hello ${name},</p><p>Reset your password by clicking <a href="${resetUrl}">here</a>.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendPasswordChangedEmail: async ({ name, email }) => {
    const subject = 'Your Kelmah password has been changed';
    const text = `Hello ${name},\n\nYour password was successfully changed.`;
    const html = `<p>Hello ${name},</p><p>Your password was successfully changed.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendAccountDeactivationEmail: async ({ name, email }) => {
    const subject = 'Your Kelmah account has been deactivated';
    const text = `Hello ${name},\n\nYour account has been deactivated.`;
    const html = `<p>Hello ${name},</p><p>Your account has been deactivated.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendAccountReactivationEmail: async ({ name, email }) => {
    const subject = 'Your Kelmah account has been reactivated';
    const text = `Hello ${name},\n\nYour account has been reactivated.`;
    const html = `<p>Hello ${name},</p><p>Your account has been reactivated.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendAccountLockedEmail: async ({ name, email }) => {
    const subject = 'Your Kelmah account has been locked';
    const text = `Hello ${name},\n\nYour account has been locked due to suspicious activity.`;
    const html = `<p>Hello ${name},</p><p>Your account has been locked due to suspicious activity.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  },
  sendLoginNotificationEmail: async ({ name, email }) => {
    const subject = 'New login to your Kelmah account';
    const text = `Hello ${name},\n\nA new login was detected. If this wasn't you, please secure your account.`;
    const html = `<p>Hello ${name},</p><p>A new login to your account was detected. If this wasn't you, please secure your account.</p>`;
    await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, text, html });
  }
};
