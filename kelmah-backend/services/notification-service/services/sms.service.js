const twilio = require('twilio');
const logger = require('../../../utils/logger');

// Initialize Twilio client
let twilioClient;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  logger.warn('Twilio credentials not provided. SMS functionality will be disabled.');
}

// For local development/testing if not using Twilio
const fakeSmsSend = async (options) => {
  logger.info('FAKE SMS SENT', options);
  return {
    sid: 'fake-sms-sid-' + Date.now(),
    status: 'delivered',
    to: options.to,
    body: options.body
  };
};

/**
 * Send SMS
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.body - SMS content
 * @param {string} [options.from] - Sender phone number
 * @returns {Promise<Object>} SMS info
 */
const sendSms = async ({ to, body, from }) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient && process.env.NODE_ENV === 'production') {
      throw new Error('SMS service not configured');
    }

    // In development, just log the SMS
    if (process.env.NODE_ENV !== 'production' || !twilioClient) {
      return await fakeSmsSend({ to, body, from });
    }

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      to,
      body,
      from: from || process.env.TWILIO_PHONE_NUMBER,
    });

    logger.info('SMS sent', {
      to,
      messageId: message.sid,
      status: message.status,
    });

    return message;
  } catch (error) {
    logger.error('Error sending SMS', { error, to });
    throw error;
  }
};

/**
 * Send notification SMS
 * @param {string} to - Recipient phone number
 * @param {string} message - Notification message
 * @returns {Promise<Object>} SMS info
 */
const sendNotificationSms = async (to, message) => {
  try {
    // Prefix with app name for branding
    const formattedMessage = `Kelmah: ${message}`;
    return await sendSms({ to, body: formattedMessage });
  } catch (error) {
    logger.error('Error sending notification SMS', { error, to });
    throw error;
  }
};

module.exports = {
  sendSms,
  sendNotificationSms,
}; 