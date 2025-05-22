/**
 * Paystack Integration
 * Handles payment processing through Paystack for card and bank payments
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Paystack API configuration
const config = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  baseUrl: 'https://api.paystack.co',
  callbackUrl: process.env.PAYSTACK_CALLBACK_URL || process.env.FRONTEND_URL + '/payment/verify',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
};

/**
 * Initialize a payment transaction with Paystack
 * @param {object} paymentData - Payment data
 * @param {string} paymentData.amount - Amount to pay in lowest currency unit (kobo for GHS)
 * @param {string} paymentData.email - Customer email address
 * @param {string} paymentData.currency - Currency code (NGN, GHS, USD)
 * @param {string} paymentData.reference - Optional unique reference
 * @param {string} paymentData.callbackUrl - Optional callback URL for this specific transaction
 * @param {object} paymentData.metadata - Optional metadata for the transaction
 * @returns {Promise<object>} Payment initialization response
 */
exports.initializePayment = async (paymentData) => {
  try {
    const { 
      amount, 
      email, 
      currency = 'GHS', 
      reference,
      callbackUrl,
      metadata
    } = paymentData;
    
    // Validate required fields
    if (!amount || !email) {
      throw new Error('Missing required fields for Paystack payment: amount and email are required');
    }
    
    // Ensure amount is in the lowest currency unit (kobo/pesewas)
    const amountInKobo = Math.round(parseFloat(amount) * 100);
    
    // Prepare request payload
    const payload = {
      amount: amountInKobo,
      email,
      currency,
      callback_url: callbackUrl || config.callbackUrl,
      metadata: {
        custom_fields: [
          {
            display_name: 'Platform',
            variable_name: 'platform',
            value: 'Kelmah'
          }
        ],
        ...metadata
      }
    };
    
    // Add reference if provided
    if (reference) {
      payload.reference = reference;
    }
    
    // Make API request to initialize transaction
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/transaction/initialize`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    const { data } = response.data;
    
    logger.info(`Paystack payment initialized: ${data.reference}`);
    
    // Return authorization URL and reference
    return {
      success: true,
      message: 'Payment initialized',
      reference: data.reference,
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      provider: 'paystack',
      status: 'PENDING'
    };
  } catch (error) {
    logger.error('Error initializing Paystack payment:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: 'FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify a payment transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<object>} Verification response
 */
exports.verifyPayment = async (reference) => {
  try {
    // Validate reference
    if (!reference) {
      throw new Error('Transaction reference is required');
    }
    
    // Make API request to verify transaction
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { data, status, message } = response.data;
    
    logger.info(`Paystack payment verified: ${reference}, Status: ${data.status}`);
    
    // Process verification response
    const verified = status === 'success' && data.status === 'success';
    
    return {
      success: true,
      verified,
      reference: data.reference,
      amount: data.amount / 100, // Convert from kobo to cedi
      currency: data.currency,
      status: data.status.toUpperCase(),
      email: data.customer.email,
      paymentDate: data.paid_at,
      channel: data.channel,
      cardType: data.authorization?.card_type,
      last4: data.authorization?.last4,
      metadata: data.metadata,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
      rawData: data
    };
  } catch (error) {
    logger.error('Error verifying Paystack payment:', error);
    
    return {
      success: false,
      reference,
      verified: false,
      message: error.response?.data?.message || error.message,
      status: 'VERIFICATION_FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * List available banks (especially useful for Ghana and Nigeria)
 * @param {string} country - Country code (NG, GH)
 * @returns {Promise<object>} List of banks
 */
exports.listBanks = async (country = 'GH') => {
  try {
    // Make API request to get banks
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/bank?country=${country}`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { data, status, message } = response.data;
    
    return {
      success: status,
      message,
      banks: data
    };
  } catch (error) {
    logger.error('Error fetching banks from Paystack:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Create a transfer recipient for paying out to bank accounts
 * @param {object} recipientData - Recipient data
 * @param {string} recipientData.name - Recipient name
 * @param {string} recipientData.accountNumber - Account number
 * @param {string} recipientData.bankCode - Bank code
 * @param {string} recipientData.currency - Currency (NGN, GHS)
 * @returns {Promise<object>} Recipient creation response
 */
exports.createTransferRecipient = async (recipientData) => {
  try {
    const { name, accountNumber, bankCode, currency = 'GHS' } = recipientData;
    
    // Validate required fields
    if (!name || !accountNumber || !bankCode) {
      throw new Error('Missing required fields for transfer recipient');
    }
    
    // Make API request to create transfer recipient
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/transferrecipient`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency
      }
    });
    
    const { data, status, message } = response.data;
    
    logger.info(`Paystack transfer recipient created: ${data.recipient_code}`);
    
    return {
      success: status,
      message,
      recipientCode: data.recipient_code,
      recipient: data
    };
  } catch (error) {
    logger.error('Error creating Paystack transfer recipient:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Initiate a transfer to a recipient (payout)
 * @param {object} transferData - Transfer data
 * @param {string} transferData.amount - Amount to transfer in lowest currency unit
 * @param {string} transferData.recipientCode - Recipient code
 * @param {string} transferData.reason - Reason for transfer
 * @param {string} transferData.reference - Optional unique reference
 * @param {string} transferData.currency - Currency (NGN, GHS)
 * @returns {Promise<object>} Transfer initiation response
 */
exports.initiateTransfer = async (transferData) => {
  try {
    const { 
      amount, 
      recipientCode, 
      reason, 
      reference,
      currency = 'GHS'
    } = transferData;
    
    // Validate required fields
    if (!amount || !recipientCode) {
      throw new Error('Missing required fields for transfer');
    }
    
    // Ensure amount is in the lowest currency unit (kobo/pesewas)
    const amountInKobo = Math.round(parseFloat(amount) * 100);
    
    // Prepare request payload
    const payload = {
      source: 'balance',
      amount: amountInKobo,
      recipient: recipientCode,
      reason: reason || 'Payout from Kelmah Platform',
      currency
    };
    
    // Add reference if provided
    if (reference) {
      payload.reference = reference;
    }
    
    // Make API request to initiate transfer
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/transfer`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    const { data, status, message } = response.data;
    
    logger.info(`Paystack transfer initiated: ${data.reference || data.transfer_code}`);
    
    return {
      success: status,
      message,
      reference: data.reference,
      transferCode: data.transfer_code,
      status: data.status,
      transfer: data
    };
  } catch (error) {
    logger.error('Error initiating Paystack transfer:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: 'FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Process webhook events from Paystack
 * @param {object} req - Express request object with headers and body
 * @returns {object} Processed webhook event
 */
exports.processWebhook = (req) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-paystack-signature'];
    
    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }
    
    const { event, data } = payload;
    
    logger.info(`Paystack webhook received: ${event}`);
    
    // Process different event types
    let status, referenceType, reference;
    
    switch (event) {
      case 'charge.success':
        status = 'SUCCESS';
        referenceType = 'payment';
        reference = data.reference;
        break;
      case 'transfer.success':
        status = 'SUCCESS';
        referenceType = 'payout';
        reference = data.reference;
        break;
      case 'transfer.failed':
        status = 'FAILED';
        referenceType = 'payout';
        reference = data.reference;
        break;
      default:
        status = 'UNKNOWN';
        referenceType = 'other';
        reference = data.reference;
    }
    
    return {
      success: true,
      event,
      status,
      referenceType,
      reference,
      data,
      message: `Processed ${event} webhook event`
    };
  } catch (error) {
    logger.error('Error processing Paystack webhook:', error);
    
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Verify webhook signature to ensure it's from Paystack
 * @param {object} payload - Webhook payload
 * @param {string} signature - Signature from headers
 * @returns {boolean} Whether signature is valid
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const hash = crypto
      .createHmac('sha512', config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    logger.error('Error verifying Paystack webhook signature:', error);
    return false;
  }
};

/**
 * Get Paystack public key for client-side integration
 * @returns {string} Paystack public key
 */
exports.getPublicKey = () => {
  return config.publicKey;
}; 