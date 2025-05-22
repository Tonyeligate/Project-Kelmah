const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const logger = require('../../../utils/logger');

// Configure mail transport
let transporter;

// Initialize based on environment
if (process.env.NODE_ENV === 'production') {
  // Production email configuration
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  // Development email configuration - using ethereal.email
  // This creates a test account for development
  (async () => {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('Email test account created', {
        user: testAccount.user,
        previewUrl: `https://ethereal.email/login?u=${testAccount.user}&p=${testAccount.pass}`,
      });
    } catch (error) {
      logger.error('Failed to create email test account', { error });
    }
  })();
}

/**
 * Get email template by name
 * @param {string} templateName - Name of the template
 * @returns {Promise<string>} Template content
 */
const getTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    const template = await readFile(templatePath, 'utf8');
    return template;
  } catch (error) {
    logger.error('Error loading email template', { templateName, error });
    throw new Error(`Email template '${templateName}' not found`);
  }
};

/**
 * Compile a template with data
 * @param {string} templateName - Name of the template
 * @param {Object} data - Data to inject into the template
 * @returns {Promise<string>} Compiled HTML
 */
const compileTemplate = async (templateName, data) => {
  try {
    const template = await getTemplate(templateName);
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    logger.error('Error compiling email template', { templateName, error });
    throw error;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.from] - Sender email (optional, defaults to configured from)
 * @returns {Promise<Object>} Mail info
 */
const sendEmail = async ({ to, subject, html, from }) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'noreply@kelmah.com',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Email sent (development)', {
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      });
    } else {
      logger.info('Email sent', {
        messageId: info.messageId,
        to,
        subject,
      });
    }

    return info;
  } catch (error) {
    logger.error('Error sending email', { error, to, subject });
    throw error;
  }
};

/**
 * Send notification email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} templateName - Template name
 * @param {Object} data - Template data
 * @returns {Promise<Object>} Mail info
 */
const sendNotificationEmail = async (to, subject, templateName, data) => {
  try {
    const html = await compileTemplate(templateName, data);
    return await sendEmail({ to, subject, html });
  } catch (error) {
    logger.error('Error sending notification email', { error, to, subject, templateName });
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  compileTemplate,
}; 