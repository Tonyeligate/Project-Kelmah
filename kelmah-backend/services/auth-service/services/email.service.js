const nodemailer = require('nodemailer');
const config = require('../config');

// Map config properties to expected names
const EMAIL_FROM = config.FROM_EMAIL || config.EMAIL_FROM || 'noreply@kelmah.com';
const SMTP_HOST = config.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = config.SMTP_PORT || 465;
const SMTP_USER = config.SMTP_USER;
const SMTP_PASS = config.SMTP_PASSWORD || config.SMTP_PASS;

// Safe debug logging for SMTP configuration (avoid printing secrets)
console.log('SMTP config → host:', SMTP_HOST, 'port:', SMTP_PORT);
console.log('EMAIL_FROM:', EMAIL_FROM);
console.log('SMTP_USER:', SMTP_USER ? '[set]' : '[unset]');
console.log('SMTP_PASS:', SMTP_PASS ? '[set]' : '[unset]');

const smtpConfig = {
  host: SMTP_HOST || 'smtp.gmail.com',
  port: Number(SMTP_PORT) || 465,
  secure: (Number(SMTP_PORT) === 465) || false,
  auth: {
    user: SMTP_USER || process.env.SMTP_USER,
    pass: SMTP_PASS || process.env.SMTP_PASS
  },
  // Anti-spam configurations
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  // Connection pooling for better delivery
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Rate limiting
  rateDelta: 20000,
  rateLimit: 5
};

console.log('Using SMTP config:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  user: smtpConfig.auth.user ? '[set]' : '[unset]',
  pass: smtpConfig.auth.pass ? '[set]' : '[unset]'
});

const transporter = nodemailer.createTransport(smtpConfig);

// Helper function to create professional email templates
const createEmailTemplate = (title, content, buttonText, buttonUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
                ${buttonUrl ? `<div style="text-align: center;"><a href="${buttonUrl}" class="button">${buttonText}</a></div>` : ''}
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
  sendVerificationEmail: async ({ name, email, verificationUrl }) => {
    const subject = '✅ Verify Your Kelmah Account - Action Required';
    const content = `
      <h2>Welcome to Kelmah, ${name}!</h2>
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
    
    const mailOptions = {
      from: `"Kelmah Platform" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      // Enhanced anti-spam headers
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        // Additional anti-spam headers
        'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@kelmah.com>`,
        'X-Entity-ID': 'kelmah-platform',
        'X-MC-Subaccount': 'kelmah-transactional',
        'Reply-To': 'noreply@kelmah.com',
        // Authentication headers guidance
        'X-SES-CONFIGURATION-SET': 'kelmah-transactional',
        'X-SES-MESSAGE-TAGS': 'campaign=email-verification'
      },
      // Additional options to improve deliverability
      envelope: {
        from: EMAIL_FROM,
        to: email
      },
      messageId: `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@kelmah.com>`
    };
    
    await transporter.sendMail(mailOptions);
  },
  sendPasswordResetEmail: async ({ name, email, resetUrl }) => {
    const subject = '🔐 Reset Your Kelmah Password - Secure Action Required';
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Security" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '2',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  },

  sendPasswordChangedEmail: async ({ name, email }) => {
    const subject = '✅ Your Kelmah Password Was Changed Successfully';
    const content = `
      <h2>Password Changed Successfully</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Security" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  },

  sendAccountDeactivationEmail: async ({ name, email }) => {
    const subject = '⚠️ Your Kelmah Account Has Been Deactivated';
    const content = `
      <h2>Account Deactivation Notice</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Support" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '2',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  },

  sendAccountReactivationEmail: async ({ name, email }) => {
    const subject = '🎉 Your Kelmah Account Has Been Reactivated';
    const content = `
      <h2>Welcome Back!</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Support" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  },

  sendAccountLockedEmail: async ({ name, email }) => {
    const subject = '🔒 Your Kelmah Account Has Been Temporarily Locked';
    const content = `
      <h2>Account Security Alert</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Security" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  },

  sendLoginNotificationEmail: async ({ name, email }) => {
    const subject = '🔐 New Login to Your Kelmah Account';
    const content = `
      <h2>Login Notification</h2>
      <p>Hello ${name},</p>
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
    
    const mailOptions = {
      from: `"Kelmah Security" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'Kelmah Platform v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:unsubscribe@kelmah.com>`,
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      }
    };
    
    await transporter.sendMail(mailOptions);
  }
};
