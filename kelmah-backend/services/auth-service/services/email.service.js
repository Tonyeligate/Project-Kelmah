const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const config = require('../config');
const { logger } = require('../utils/logger');

const normalizeEnvString = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeSmtpPassword = (value) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value);
const PLACEHOLDER_FROM_PATTERN = /^no-?reply@kelmah\.com$/i;

// Map config properties to expected names
const EMAIL_FROM = normalizeEnvString(config.FROM_EMAIL || config.EMAIL_FROM || process.env.EMAIL_FROM);
const EMAIL_FROM_NAME = normalizeEnvString(
  config.FROM_NAME || config.EMAIL_FROM_NAME || process.env.EMAIL_FROM_NAME,
);
const EMAIL_PROVIDER = normalizeEnvString(process.env.EMAIL_PROVIDER || '').toLowerCase();
const BREVO_API_KEY = normalizeEnvString(process.env.BREVO_API_KEY || process.env.BREVO_APIKEY);
const BREVO_API_URL = normalizeEnvString(process.env.BREVO_API_URL) || 'https://api.brevo.com/v3/smtp/email';
const BREVO_SENDER_EMAIL = normalizeEnvString(process.env.BREVO_SENDER_EMAIL || EMAIL_FROM);
const BREVO_SENDER_NAME = normalizeEnvString(
  process.env.BREVO_SENDER_NAME || EMAIL_FROM_NAME || 'Kelmah Platform',
);
const SMTP_HOST = config.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(config.SMTP_PORT || process.env.SMTP_PORT || 465);
const SMTP_USER = normalizeEnvString(config.SMTP_USER || process.env.SMTP_USER);
const SMTP_PASS = normalizeSmtpPassword(config.SMTP_PASSWORD || config.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_PASS);
const SMTP_CONNECTION_TIMEOUT_MS = Number(config.SMTP_CONNECTION_TIMEOUT_MS || process.env.SMTP_CONNECTION_TIMEOUT_MS || 60000);
const SMTP_GREETING_TIMEOUT_MS = Number(config.SMTP_GREETING_TIMEOUT_MS || process.env.SMTP_GREETING_TIMEOUT_MS || 60000);
const SMTP_SOCKET_TIMEOUT_MS = Number(config.SMTP_SOCKET_TIMEOUT_MS || process.env.SMTP_SOCKET_TIMEOUT_MS || 60000);
const EMAIL_SEND_TIMEOUT_MS = Number(config.EMAIL_SEND_TIMEOUT_MS || process.env.EMAIL_SEND_TIMEOUT_MS || 60000);
const HAS_SMTP_CREDENTIALS = Boolean(SMTP_USER && SMTP_PASS);
const HAS_BREVO_KEY = Boolean(BREVO_API_KEY);
const PREFERS_BREVO = EMAIL_PROVIDER === 'brevo' || (!EMAIL_PROVIDER && HAS_BREVO_KEY);
const PREFERS_SMTP = EMAIL_PROVIDER === 'smtp';
const HAS_DELIVERY_CONFIG = PREFERS_BREVO
  ? HAS_BREVO_KEY
  : PREFERS_SMTP
    ? HAS_SMTP_CREDENTIALS
    : (HAS_BREVO_KEY || HAS_SMTP_CREDENTIALS);
const IS_GMAIL_HOST = /gmail\.com$/i.test(String(SMTP_HOST || ''));
const hasSecureOverride = Object.prototype.hasOwnProperty.call(process.env, 'SMTP_SECURE');
const SMTP_SECURE = hasSecureOverride
  ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
  : SMTP_PORT === 465;
const hasRequireTlsOverride = Object.prototype.hasOwnProperty.call(process.env, 'SMTP_REQUIRE_TLS');
const SMTP_REQUIRE_TLS = hasRequireTlsOverride
  ? String(process.env.SMTP_REQUIRE_TLS).toLowerCase() === 'true'
  : SMTP_PORT === 587;
const hasPoolOverride = Object.prototype.hasOwnProperty.call(process.env, 'SMTP_POOL');
const SMTP_POOL = hasPoolOverride
  ? String(process.env.SMTP_POOL).toLowerCase() === 'true'
  : !IS_GMAIL_HOST;

// Debug logging only in development
if (process.env.NODE_ENV === 'development') {
  console.log('SMTP config → host:', SMTP_HOST, 'port:', SMTP_PORT);
  console.log('EMAIL_FROM:', EMAIL_FROM);
  console.log('SMTP_USER:', SMTP_USER ? '[set]' : '[unset]');
  console.log('SMTP_PASS:', SMTP_PASS ? '[set]' : '[unset]');
  console.log('EMAIL_PROVIDER:', EMAIL_PROVIDER || '[auto]');
  console.log('BREVO_API_KEY:', HAS_BREVO_KEY ? '[set]' : '[unset]');
}

const smtpConfig = {
  host: SMTP_HOST || 'smtp.gmail.com',
  port: SMTP_PORT || 465,
  secure: SMTP_SECURE,
  requireTLS: SMTP_REQUIRE_TLS,
  family: 4,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV !== 'development',
    servername: SMTP_HOST || 'smtp.gmail.com',
  },
  connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
  greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
  socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  // Connection pooling for better delivery (disable by default for Gmail)
  pool: SMTP_POOL,
};

if (SMTP_POOL) {
  smtpConfig.maxConnections = 5;
  smtpConfig.maxMessages = 100;
  smtpConfig.rateDelta = 20000;
  smtpConfig.rateLimit = 5;
}

if (process.env.NODE_ENV === 'development') {
  console.log('Using SMTP config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: smtpConfig.requireTLS,
    pool: smtpConfig.pool,
    user: smtpConfig.auth.user ? '[set]' : '[unset]',
    pass: smtpConfig.auth.pass ? '[set]' : '[unset]'
  });
}

const transporter = nodemailer.createTransport(smtpConfig);

const parseAddressEntry = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'object' && entry.email) {
    return {
      email: String(entry.email).trim(),
      name: entry.name ? String(entry.name).trim() : undefined,
    };
  }

  const raw = String(entry).trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '');
    const email = match[2].trim();
    return { email, name: name || undefined };
  }

  return { email: raw };
};

const buildBrevoRecipients = (to) => {
  if (!to) {
    return [];
  }

  const entries = Array.isArray(to)
    ? to
    : String(to).split(',').map((item) => item.trim());

  return entries
    .map(parseAddressEntry)
    .filter((entry) => entry && entry.email);
};

const resolveSenderAddress = () => {
  const configuredSender = normalizeEnvString(EMAIL_FROM);
  const smtpSender = normalizeEnvString(smtpConfig.auth.user);

  if (
    configuredSender &&
    (!PLACEHOLDER_FROM_PATTERN.test(configuredSender) || !smtpSender || smtpSender === configuredSender)
  ) {
    return configuredSender;
  }

  return smtpSender || configuredSender || 'noreply@localhost';
};

const buildFromHeader = (displayName) => `"${displayName}" <${resolveSenderAddress()}>`;

const resolveMessageIdDomain = () => {
  const senderAddress = resolveSenderAddress();
  const atIndex = senderAddress.lastIndexOf('@');
  return atIndex > -1 ? senderAddress.slice(atIndex + 1) : 'localhost';
};

const buildMailMetadata = (priority = 'normal') => {
  const senderAddress = resolveSenderAddress();
  const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${resolveMessageIdDomain()}>`;

  const priorityHeaders = priority === 'high'
    ? {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        Importance: 'High',
      }
    : {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        Importance: 'Normal',
      };

  return {
    messageId,
    headers: {
      'X-Mailer': 'Kelmah Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
      'Reply-To': senderAddress,
      ...priorityHeaders,
    },
  };
};

const sendViaBrevoApi = async (mailOptions, operation) => {
  if (!HAS_BREVO_KEY) {
    logger.warn('Brevo API key missing; email send skipped', {
      operation,
      to: mailOptions.to,
    });
    return { skipped: true };
  }

  const senderEmail = BREVO_SENDER_EMAIL || resolveSenderAddress();
  if (!senderEmail) {
    logger.warn('Brevo sender email missing; email send skipped', {
      operation,
      to: mailOptions.to,
    });
    return { skipped: true };
  }

  const recipients = buildBrevoRecipients(mailOptions.to);
  if (recipients.length === 0) {
    throw new Error('Brevo recipients missing');
  }

  const replyToValue = mailOptions.replyTo || mailOptions.headers?.['Reply-To'];
  const replyTo = replyToValue
    ? { email: String(replyToValue).trim() }
    : undefined;

  const payload = {
    sender: {
      email: senderEmail,
      name: BREVO_SENDER_NAME,
    },
    to: recipients,
    subject: mailOptions.subject,
    htmlContent: mailOptions.html || mailOptions.text,
    textContent: mailOptions.text,
    headers: mailOptions.headers,
    replyTo,
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      timeout: EMAIL_SEND_TIMEOUT_MS,
    });

    logger.info('Brevo delivery succeeded', {
      operation,
      to: mailOptions.to,
      messageId: response?.data?.messageId,
    });

    return response?.data || { success: true };
  } catch (error) {
    logger.warn('Brevo delivery failed', {
      operation,
      to: mailOptions.to,
      error: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });
    throw error;
  }
};

const sendMailSafely = async (mailOptions, operation) => {
  if (PREFERS_BREVO) {
    return sendViaBrevoApi(mailOptions, operation);
  }

  if (!HAS_SMTP_CREDENTIALS) {
    logger.warn('SMTP credentials missing; email send skipped', {
      operation,
      to: mailOptions.to,
    });
    return { skipped: true };
  }

  let timeoutId;

  try {
    const result = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Email send timed out after ${EMAIL_SEND_TIMEOUT_MS}ms`));
        }, EMAIL_SEND_TIMEOUT_MS);
      }),
    ]);

    logger.info('SMTP delivery succeeded', {
      operation,
      to: mailOptions.to,
      messageId: result?.messageId,
      response: result?.response,
    });

    return result;
  } catch (error) {
    logger.warn('SMTP delivery failed', {
      operation,
      to: mailOptions.to,
      error: error.message,
    });
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeHtmlAttribute = (value) => escapeHtml(value).replace(/`/g, '&#96;');

// Helper function to create professional email templates
const createEmailTemplate = (title, content, buttonText, buttonUrl) => {
  const safeTitle = escapeHtml(title);
  const safeButtonText = escapeHtml(buttonText);
  const safeButtonUrl = buttonUrl ? escapeHtmlAttribute(buttonUrl) : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeTitle}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #007bff; }
            .logo { font-size: 24px; font-weight: bold; color: #007bff; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background-color: #0056b3; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            .security-notice { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Kelmah Platform</div>
                <p>Professional Services Marketplace</p>
            </div>
            <div class="content">
                ${content}
              ${safeButtonUrl ? `<div style="text-align: center;"><a href="${safeButtonUrl}" class="button">${safeButtonText}</a></div>` : ''}
                <div class="security-notice">
                    <strong>Security Notice:</strong> This email was sent from a secure server. If you didn't request this action, please ignore this email or contact our support team.
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Kelmah Platform. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
                <p>If you need assistance, contact us at support@kelmah.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = {
  isDeliveryConfigured: () => HAS_DELIVERY_CONFIG,

  sendVerificationEmail: async ({ name, email, verificationUrl }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '✅ Verify Your Kelmah Account - Action Required';
    const content = `
      <h2>Welcome to Kelmah, ${safeName}!</h2>
      <p>Thank you for joining our professional services marketplace. To complete your registration and start using your account, please verify your email address.</p>
      <p><strong>Why verify your email?</strong></p>
      <ul>
        <li>Secure your account</li>
        <li>Receive important notifications</li>
        <li>Enable password recovery</li>
        <li>Access all platform features</li>
      </ul>
      <p>Click the button below to verify your email address:</p>
    `;
    const html = createEmailTemplate('Verify Your Email', content, 'Verify Email Address', verificationUrl);
    const text = `Welcome to Kelmah, ${name}!\n\nThank you for joining our professional services marketplace. Please verify your email address by visiting: ${verificationUrl}\n\nThis verification link will expire in 24 hours for security reasons.\n\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nThe Kelmah Team`;
    
    const { headers, messageId } = buildMailMetadata('normal');

    const mailOptions = {
      from: buildFromHeader('Kelmah Platform'),
      to: email,
      subject,
      text,
      html,
      headers,
      envelope: {
        from: resolveSenderAddress(),
        to: email
      },
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendVerificationEmail');
  },
  sendPasswordResetEmail: async ({ name, email, resetUrl }) => {
      const safeName = escapeHtml(name || 'there');
    const subject = '🔐 Reset Your Kelmah Password - Secure Action Required';
    const content = `
      <h2>Password Reset Request</h2>
        <p>Hello ${safeName},</p>
      <p>We received a request to reset your password for your Kelmah account. If you made this request, click the button below to create a new password.</p>
      <p><strong>Security Information:</strong></p>
      <ul>
        <li>This link will expire in 1 hour for security</li>
        <li>You can only use this link once</li>
        <li>If you didn't request this, ignore this email</li>
        <li>Your current password remains unchanged until you create a new one</li>
      </ul>
    `;
    const html = createEmailTemplate('Reset Your Password', content, 'Reset Password', resetUrl);
    const text = `Password Reset Request\n\nHello ${name},\n\nWe received a request to reset your password for your Kelmah account. If you made this request, visit: ${resetUrl}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request this password reset, please ignore this email. Your password will remain unchanged.\n\nBest regards,\nThe Kelmah Team`;
    
    const { headers, messageId } = buildMailMetadata('high');

    const mailOptions = {
      from: buildFromHeader('Kelmah Security'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendPasswordResetEmail');
  },

  sendPasswordChangedEmail: async ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '✅ Your Kelmah Password Was Changed Successfully';
    const content = `
      <h2>Password Changed Successfully</h2>
      <p>Hello ${safeName},</p>
      <p>This email confirms that your Kelmah account password was successfully changed on ${new Date().toLocaleDateString()}.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>Your account is secure with your new password</li>
        <li>You can continue using Kelmah normally</li>
        <li>All active sessions remain valid</li>
      </ul>
      <p>If you didn't make this change, please contact our support team immediately at support@kelmah.com</p>
    `;
    const html = createEmailTemplate('Password Changed', content);
    const text = `Password Changed Successfully\n\nHello ${name},\n\nThis email confirms that your Kelmah account password was successfully changed on ${new Date().toLocaleDateString()}.\n\nIf you didn't make this change, please contact our support team immediately at support@kelmah.com\n\nBest regards,\nThe Kelmah Team`;
    
    const { headers, messageId } = buildMailMetadata('normal');

    const mailOptions = {
      from: buildFromHeader('Kelmah Security'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendPasswordChangedEmail');
  },

  sendAccountDeactivationEmail: async ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '⚠️ Your Kelmah Account Has Been Deactivated';
    const content = `
      <h2>Account Deactivation Notice</h2>
      <p>Hello ${safeName},</p>
      <p>Your Kelmah account has been temporarily deactivated. This action was taken for security or policy reasons.</p>
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>Your account access is temporarily suspended</li>
        <li>Your data remains secure and unchanged</li>
        <li>You can contact support to resolve this issue</li>
        <li>Reactivation is possible once resolved</li>
      </ul>
      <p>If you believe this was done in error, please contact our support team at support@kelmah.com</p>
    `;
    const html = createEmailTemplate('Account Deactivated', content);
    const text = `Account Deactivation Notice\n\nHello ${name},\n\nYour Kelmah account has been temporarily deactivated. This action was taken for security or policy reasons.\n\nIf you believe this was done in error, please contact our support team at support@kelmah.com\n\nBest regards,\nThe Kelmah Team`;
    
    const { headers, messageId } = buildMailMetadata('high');

    const mailOptions = {
      from: buildFromHeader('Kelmah Support'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendAccountDeactivationEmail');
  },

  sendAccountReactivationEmail: async ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '🎉 Your Kelmah Account Has Been Reactivated';
    const content = `
      <h2>Welcome Back!</h2>
      <p>Hello ${safeName},</p>
      <p>Great news! Your Kelmah account has been successfully reactivated and you can now access all platform features.</p>
      <p><strong>You can now:</strong></p>
      <ul>
        <li>Log in to your account normally</li>
        <li>Access all your previous data</li>
        <li>Use all platform features</li>
        <li>Continue where you left off</li>
      </ul>
      <p>Thank you for your patience during the resolution process.</p>
    `;
    const html = createEmailTemplate('Account Reactivated', content, 'Access Your Account', `${process.env.FRONTEND_URL || 'https://kelmah-frontend-mu.vercel.app'}/login`);
    const text = `Welcome Back!\n\nHello ${name},\n\nGreat news! Your Kelmah account has been successfully reactivated and you can now access all platform features.\n\nYou can log in at: ${process.env.FRONTEND_URL || 'https://kelmah-frontend-mu.vercel.app'}/login\n\nThank you for your patience during the resolution process.\n\nBest regards,\nThe Kelmah Team`;
    
    const { headers, messageId } = buildMailMetadata('normal');

    const mailOptions = {
      from: buildFromHeader('Kelmah Support'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendAccountReactivationEmail');
  },

  sendAccountLockedEmail: async ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '🔒 Your Kelmah Account Has Been Temporarily Locked';
    const content = `
      <h2>Account Security Alert</h2>
      <p>Hello ${safeName},</p>
      <p>Your Kelmah account has been temporarily locked due to suspicious activity or multiple failed login attempts.</p>
      <p><strong>This security measure protects your account from:</strong></p>
      <ul>
        <li>Unauthorized access attempts</li>
        <li>Potential security breaches</li>
        <li>Suspicious login patterns</li>
        <li>Brute force attacks</li>
      </ul>
      <p>Your account will be automatically unlocked in 30 minutes, or you can contact support for immediate assistance.</p>
    `;
    const html = createEmailTemplate('Account Locked', content);
    const text = `Account Security Alert\n\nHello ${name},\n\nYour Kelmah account has been temporarily locked due to suspicious activity or multiple failed login attempts.\n\nYour account will be automatically unlocked in 30 minutes, or you can contact support at support@kelmah.com for immediate assistance.\n\nBest regards,\nThe Kelmah Security Team`;
    
    const { headers, messageId } = buildMailMetadata('high');

    const mailOptions = {
      from: buildFromHeader('Kelmah Security'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendAccountLockedEmail');
  },

  sendLoginNotificationEmail: async ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = '🔐 New Login to Your Kelmah Account';
    const content = `
      <h2>Login Notification</h2>
      <p>Hello ${safeName},</p>
      <p>A new login to your Kelmah account was detected on ${new Date().toLocaleString()}.</p>
      <p><strong>Login Details:</strong></p>
      <ul>
        <li>Time: ${new Date().toLocaleString()}</li>
        <li>Account: ${email}</li>
        <li>Platform: Kelmah Professional Services</li>
      </ul>
      <p>If this was you, no action is needed. If you don't recognize this login, please secure your account immediately by changing your password.</p>
    `;
    const html = createEmailTemplate('Login Notification', content, 'Secure My Account', `${process.env.FRONTEND_URL || 'https://kelmah-frontend-mu.vercel.app'}/change-password`);
    const text = `Login Notification\n\nHello ${name},\n\nA new login to your Kelmah account was detected on ${new Date().toLocaleString()}.\n\nIf this was you, no action is needed. If you don't recognize this login, please secure your account immediately by changing your password at: ${process.env.FRONTEND_URL || 'https://kelmah-frontend-mu.vercel.app'}/change-password\n\nBest regards,\nThe Kelmah Security Team`;
    
    const { headers, messageId } = buildMailMetadata('normal');

    const mailOptions = {
      from: buildFromHeader('Kelmah Security'),
      to: email,
      subject,
      text,
      html,
      headers,
      messageId,
    };
    
    await sendMailSafely(mailOptions, 'sendLoginNotificationEmail');
  }
};

