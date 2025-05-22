/**
 * Mobile Money (MoMo) Integration
 * Handles integration with MTN Mobile Money, Vodafone Cash, AirtelTigo Money
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Provider types
const PROVIDERS = {
  MTN: 'mtn',
  VODAFONE: 'vodafone',
  AIRTELTIGO: 'airteltigo'
};

// API configuration
const config = {
  apiKey: process.env.MOMO_API_KEY,
  apiSecret: process.env.MOMO_API_SECRET,
  userId: process.env.MOMO_API_USER_ID,
  primaryKey: process.env.MOMO_PRIMARY_KEY,
  baseUrl: process.env.MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com',
  callbackUrl: process.env.MOMO_CALLBACK_URL
};

/**
 * Generate authorization header for API requests
 * @returns {string} Authorization header value
 */
const generateAuthHeader = () => {
  const auth = Buffer.from(`${config.userId}:${config.apiKey}`).toString('base64');
  return `Basic ${auth}`;
};

/**
 * Generate reference ID for transactions
 * @returns {string} Reference ID
 */
const generateReferenceId = () => {
  return uuidv4();
};

/**
 * Create payment request via Mobile Money
 * @param {object} paymentData - Payment data
 * @param {string} paymentData.amount - Amount to pay
 * @param {string} paymentData.currency - Currency code (e.g., GHS)
 * @param {string} paymentData.phone - Customer phone number
 * @param {string} paymentData.provider - Mobile money provider (mtn, vodafone, airteltigo)
 * @param {string} paymentData.description - Payment description
 * @returns {Promise<object>} Payment request response
 */
exports.createPaymentRequest = async (paymentData) => {
  try {
    const { amount, currency, phone, provider, description } = paymentData;
    
    // Validate required fields
    if (!amount || !currency || !phone || !provider) {
      throw new Error('Missing required fields for mobile money payment');
    }
    
    // Validate provider
    if (!Object.values(PROVIDERS).includes(provider.toLowerCase())) {
      throw new Error(`Invalid provider: ${provider}. Must be one of: ${Object.values(PROVIDERS).join(', ')}`);
    }
    
    // Format phone number (remove country code if present, ensure no spaces)
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('+233')) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith('233')) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Prepend Ghana country code for international format
    const internationalPhone = `233${formattedPhone}`;
    
    // Generate a reference ID for this transaction
    const referenceId = generateReferenceId();
    
    // Different endpoints based on provider
    let endpoint;
    switch (provider.toLowerCase()) {
      case PROVIDERS.MTN:
        endpoint = '/collection/v1_0/requesttopay';
        break;
      case PROVIDERS.VODAFONE:
        endpoint = '/vodafone/v1_0/requesttopay';
        break;
      case PROVIDERS.AIRTELTIGO:
        endpoint = '/airteltigo/v1_0/requesttopay';
        break;
      default:
        endpoint = '/collection/v1_0/requesttopay'; // Default to MTN
    }
    
    // Prepare request payload
    const payload = {
      amount,
      currency,
      externalId: referenceId,
      payerMessage: description || 'Payment to Kelmah Platform',
      payeeNote: 'Thank you for using Kelmah',
      payer: {
        partyIdType: 'MSISDN', // Mobile number
        partyId: internationalPhone
      }
    };
    
    // Make API request
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}${endpoint}`,
      headers: {
        'Authorization': generateAuthHeader(),
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'X-Callback-Url': config.callbackUrl,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    logger.info(`Mobile Money payment request created: ${referenceId}`);
    
    // Return transaction reference and status
    return {
      success: true,
      reference: referenceId,
      provider: provider.toLowerCase(),
      status: 'PENDING',
      message: 'Payment request submitted. Please check your phone to authorize.',
      phone: internationalPhone
    };
  } catch (error) {
    logger.error('Error creating Mobile Money payment request:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: 'FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Check payment status
 * @param {string} referenceId - Reference ID of the transaction
 * @param {string} provider - Mobile money provider
 * @returns {Promise<object>} Payment status
 */
exports.checkPaymentStatus = async (referenceId, provider) => {
  try {
    // Validate reference ID
    if (!referenceId) {
      throw new Error('Reference ID is required');
    }
    
    // Ensure provider is valid, default to MTN
    const validProvider = provider && Object.values(PROVIDERS).includes(provider.toLowerCase())
      ? provider.toLowerCase()
      : PROVIDERS.MTN;
    
    // Different endpoints based on provider
    let endpoint;
    switch (validProvider) {
      case PROVIDERS.MTN:
        endpoint = '/collection/v1_0/requesttopay';
        break;
      case PROVIDERS.VODAFONE:
        endpoint = '/vodafone/v1_0/requesttopay';
        break;
      case PROVIDERS.AIRTELTIGO:
        endpoint = '/airteltigo/v1_0/requesttopay';
        break;
      default:
        endpoint = '/collection/v1_0/requesttopay'; // Default to MTN
    }
    
    // Make API request
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}${endpoint}/${referenceId}`,
      headers: {
        'Authorization': generateAuthHeader(),
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'Content-Type': 'application/json'
      }
    });
    
    const { status, reason } = response.data;
    
    logger.info(`Mobile Money payment status checked: ${referenceId}, Status: ${status}`);
    
    return {
      success: true,
      reference: referenceId,
      status,
      reason: reason || null,
      details: response.data
    };
  } catch (error) {
    logger.error('Error checking Mobile Money payment status:', error);
    
    return {
      success: false,
      reference: referenceId,
      status: 'UNKNOWN',
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Process webhook notification from Mobile Money provider
 * @param {object} webhookData - Webhook payload from provider
 * @returns {object} Processed webhook response
 */
exports.processWebhook = (webhookData) => {
  try {
    logger.info('Received Mobile Money webhook:', JSON.stringify(webhookData));
    
    const { referenceId, status, reason } = webhookData;
    
    // Validate webhook data
    if (!referenceId || !status) {
      throw new Error('Invalid webhook data: missing referenceId or status');
    }
    
    return {
      success: true,
      reference: referenceId,
      status,
      reason: reason || null,
      data: webhookData
    };
  } catch (error) {
    logger.error('Error processing Mobile Money webhook:', error);
    
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

/**
 * Withdraw funds to user's mobile money account
 * @param {object} withdrawalData - Withdrawal data
 * @param {string} withdrawalData.amount - Amount to withdraw
 * @param {string} withdrawalData.currency - Currency code (e.g., GHS)
 * @param {string} withdrawalData.phone - Customer phone number
 * @param {string} withdrawalData.provider - Mobile money provider
 * @param {string} withdrawalData.description - Withdrawal description
 * @returns {Promise<object>} Withdrawal request response
 */
exports.initiateWithdrawal = async (withdrawalData) => {
  try {
    const { amount, currency, phone, provider, description } = withdrawalData;
    
    // Validate required fields
    if (!amount || !currency || !phone || !provider) {
      throw new Error('Missing required fields for mobile money withdrawal');
    }
    
    // Validate provider
    if (!Object.values(PROVIDERS).includes(provider.toLowerCase())) {
      throw new Error(`Invalid provider: ${provider}. Must be one of: ${Object.values(PROVIDERS).join(', ')}`);
    }
    
    // Format phone number
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('+233')) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith('233')) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Prepend Ghana country code for international format
    const internationalPhone = `233${formattedPhone}`;
    
    // Generate a reference ID for this transaction
    const referenceId = generateReferenceId();
    
    // Different endpoints based on provider
    let endpoint;
    switch (provider.toLowerCase()) {
      case PROVIDERS.MTN:
        endpoint = '/disbursement/v1_0/transfer';
        break;
      case PROVIDERS.VODAFONE:
        endpoint = '/vodafone/v1_0/transfer';
        break;
      case PROVIDERS.AIRTELTIGO:
        endpoint = '/airteltigo/v1_0/transfer';
        break;
      default:
        endpoint = '/disbursement/v1_0/transfer'; // Default to MTN
    }
    
    // Prepare request payload
    const payload = {
      amount,
      currency,
      externalId: referenceId,
      payerMessage: description || 'Withdrawal from Kelmah Platform',
      payeeNote: 'Funds from your Kelmah account',
      payee: {
        partyIdType: 'MSISDN', // Mobile number
        partyId: internationalPhone
      }
    };
    
    // Make API request
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}${endpoint}`,
      headers: {
        'Authorization': generateAuthHeader(),
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        'X-Callback-Url': config.callbackUrl,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    logger.info(`Mobile Money withdrawal initiated: ${referenceId}`);
    
    // Return transaction reference and status
    return {
      success: true,
      reference: referenceId,
      provider: provider.toLowerCase(),
      status: 'PENDING',
      message: 'Withdrawal initiated. Funds will be sent to your mobile money account.',
      phone: internationalPhone
    };
  } catch (error) {
    logger.error('Error initiating Mobile Money withdrawal:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: 'FAILED',
      error: error.response?.data || error.message
    };
  }
};

// Export provider types for use in other modules
exports.PROVIDERS = PROVIDERS; 