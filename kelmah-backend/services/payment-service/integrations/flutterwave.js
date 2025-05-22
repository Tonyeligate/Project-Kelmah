/**
 * Flutterwave Integration
 * Handles payment processing through Flutterwave for card, bank, and mobile money payments
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Flutterwave API configuration
const config = {
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  baseUrl: process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3',
  callbackUrl: process.env.FLUTTERWAVE_CALLBACK_URL || process.env.FRONTEND_URL + '/payment/flutterwave/callback',
  webhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH
};

/**
 * Initialize a payment transaction with Flutterwave
 * @param {object} paymentData - Payment data
 * @param {string} paymentData.amount - Amount to pay
 * @param {string} paymentData.currency - Currency code (GHS, NGN, USD)
 * @param {string} paymentData.email - Customer email address
 * @param {string} paymentData.phone - Customer phone number
 * @param {string} paymentData.name - Customer name
 * @param {string} paymentData.txRef - Transaction reference
 * @param {string} paymentData.paymentMethod - Optional payment method (card, mobilemoney, etc.)
 * @param {string} paymentData.redirectUrl - Optional redirect URL
 * @param {object} paymentData.meta - Optional metadata
 * @returns {Promise<object>} Payment initialization response
 */
exports.initializePayment = async (paymentData) => {
  try {
    const { 
      amount, 
      currency = 'GHS', 
      email,
      phone,
      name,
      txRef,
      paymentMethod, 
      redirectUrl,
      meta = {}
    } = paymentData;
    
    // Validate required fields
    if (!amount || !email || !name) {
      throw new Error('Missing required fields: amount, email, and name are required');
    }
    
    // Split name into first name and last name
    let firstName, lastName;
    if (name.includes(' ')) {
      [firstName, ...lastNameParts] = name.split(' ');
      lastName = lastNameParts.join(' ');
    } else {
      firstName = name;
      lastName = '';
    }
    
    // Prepare request payload
    const payload = {
      tx_ref: txRef || `FLW-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      amount: parseFloat(amount),
      currency,
      payment_options: paymentMethod || 'card,mobilemoneyghana',
      redirect_url: redirectUrl || config.callbackUrl,
      customer: {
        email,
        phone_number: phone || '',
        name
      },
      customizations: {
        title: 'Kelmah Payment',
        description: 'Payment for services on Kelmah Platform',
        logo: process.env.LOGO_URL || ''
      },
      meta
    };
    
    // Add Ghana-specific mobile money options if applicable
    if (currency === 'GHS' && (!paymentMethod || paymentMethod.includes('mobilemoney'))) {
      payload.payment_options = 'mobilemoneyghana';
    }
    
    // Make API request to initialize transaction
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/payments`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    const { status, message, data } = response.data;
    
    if (status === 'success') {
      logger.info(`Flutterwave payment initialized: ${data.tx_ref}`);
      
      return {
        success: true,
        message: message || 'Payment initialized',
        reference: data.tx_ref,
        flwReference: data.flw_ref,
        authorizationUrl: data.link,
        provider: 'flutterwave',
        status: 'PENDING'
      };
    } else {
      throw new Error(message || 'Failed to initialize payment');
    }
  } catch (error) {
    logger.error('Error initializing Flutterwave payment:', error);
    
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
 * @param {string} transactionId - Transaction ID or reference
 * @returns {Promise<object>} Verification response
 */
exports.verifyPayment = async (transactionId) => {
  try {
    // Validate transaction ID
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }
    
    // Make API request to verify transaction
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { status, message, data } = response.data;
    
    logger.info(`Flutterwave payment verified: ${transactionId}, Status: ${data.status}`);
    
    // Process verification response
    const verified = status === 'success' && 
      (data.status === 'successful' || data.status === 'completed');
    
    return {
      success: true,
      verified,
      reference: data.tx_ref,
      flwReference: data.flw_ref,
      amount: data.amount,
      currency: data.currency,
      status: data.status.toUpperCase(),
      email: data.customer.email,
      paymentMethod: data.payment_type,
      narration: data.narration,
      paymentDate: data.created_at,
      metadata: data.meta,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
      rawData: data
    };
  } catch (error) {
    logger.error('Error verifying Flutterwave payment:', error);
    
    return {
      success: false,
      reference: transactionId,
      verified: false,
      message: error.response?.data?.message || error.message,
      status: 'VERIFICATION_FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Verify a payment using the transaction reference
 * @param {string} txRef - Transaction reference
 * @returns {Promise<object>} Verification response
 */
exports.verifyTransactionReference = async (txRef) => {
  try {
    // Validate transaction reference
    if (!txRef) {
      throw new Error('Transaction reference is required');
    }
    
    // Make API request to verify transaction by reference
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { status, message, data } = response.data;
    
    logger.info(`Flutterwave payment verified by reference: ${txRef}, Status: ${data?.status || 'Unknown'}`);
    
    // Process verification response
    if (status === 'success' && data) {
      const verified = data.status === 'successful' || data.status === 'completed';
      
      return {
        success: true,
        verified,
        reference: data.tx_ref,
        flwReference: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status.toUpperCase(),
        email: data.customer?.email,
        paymentMethod: data.payment_type,
        paymentDate: data.created_at,
        metadata: data.meta,
        message: verified ? 'Payment verified successfully' : 'Payment verification failed',
        rawData: data
      };
    } else {
      return {
        success: false,
        verified: false,
        reference: txRef,
        message: message || 'Transaction not found',
        status: 'NOT_FOUND'
      };
    }
  } catch (error) {
    logger.error('Error verifying Flutterwave payment by reference:', error);
    
    return {
      success: false,
      reference: txRef,
      verified: false,
      message: error.response?.data?.message || error.message,
      status: 'VERIFICATION_FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Initiate a transfer to a bank account or mobile money account
 * @param {object} transferData - Transfer data
 * @param {string} transferData.amount - Amount to transfer
 * @param {string} transferData.currency - Currency code (GHS, NGN, USD)
 * @param {string} transferData.bankCode - Bank code (for bank transfers)
 * @param {string} transferData.accountNumber - Account number (for bank transfers)
 * @param {string} transferData.phoneNumber - Phone number (for mobile money transfers)
 * @param {string} transferData.email - Email address of the recipient
 * @param {string} transferData.name - Name of the recipient
 * @param {string} transferData.type - Transfer type (account, mobile_money_ghana)
 * @param {string} transferData.reference - Transaction reference
 * @returns {Promise<object>} Transfer initiation response
 */
exports.initiateTransfer = async (transferData) => {
  try {
    const { 
      amount, 
      currency = 'GHS', 
      bankCode, 
      accountNumber, 
      phoneNumber,
      email, 
      name,
      type = currency === 'GHS' ? 'mobile_money_ghana' : 'account',
      reference
    } = transferData;
    
    // Validate required fields
    if (!amount || !email || !name) {
      throw new Error('Missing required fields: amount, email, and name are required');
    }
    
    if (type === 'account' && (!bankCode || !accountNumber)) {
      throw new Error('Bank code and account number are required for bank transfers');
    }
    
    if (type === 'mobile_money_ghana' && !phoneNumber) {
      throw new Error('Phone number is required for mobile money transfers');
    }
    
    // Prepare request payload for bank account transfer
    let payload;
    
    if (type === 'account') {
      payload = {
        account_bank: bankCode,
        account_number: accountNumber,
        amount: parseFloat(amount),
        currency,
        reference: reference || `FLW-TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        narration: `Transfer from Kelmah Platform to ${name}`,
        beneficiary_name: name,
        meta: {
          email,
          source: 'Kelmah Platform'
        }
      };
    } else if (type === 'mobile_money_ghana') {
      // Format phone number
      let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
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
      
      payload = {
        account_bank: 'MTN', // or 'VODAFONE', 'TIGO'
        account_number: internationalPhone,
        amount: parseFloat(amount),
        currency: 'GHS',
        reference: reference || `FLW-TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        narration: `Transfer from Kelmah Platform to ${name}`,
        beneficiary_name: name,
        meta: {
          email,
          source: 'Kelmah Platform'
        }
      };
    } else {
      throw new Error(`Unsupported transfer type: ${type}`);
    }
    
    // Make API request to initiate transfer
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/transfers`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    const { status, message, data } = response.data;
    
    if (status === 'success') {
      logger.info(`Flutterwave transfer initiated: ${data.reference}`);
      
      return {
        success: true,
        message: message || 'Transfer initiated',
        reference: data.reference,
        transferId: data.id,
        status: data.status,
        transfer: data
      };
    } else {
      throw new Error(message || 'Failed to initiate transfer');
    }
  } catch (error) {
    logger.error('Error initiating Flutterwave transfer:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: 'FAILED',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Process webhook events from Flutterwave
 * @param {object} req - Express request object with headers and body
 * @returns {object} Processed webhook event
 */
exports.processWebhook = (req) => {
  try {
    const payload = req.body;
    const signature = req.headers['verif-hash'];
    
    // Verify webhook signature
    if (!signature || signature !== config.webhookHash) {
      throw new Error('Invalid webhook signature');
    }
    
    const { event, data } = payload;
    
    logger.info(`Flutterwave webhook received: ${event}`);
    
    // Process different event types
    let status, referenceType, reference;
    
    switch (event) {
      case 'charge.completed':
        status = 'SUCCESS';
        referenceType = 'payment';
        reference = data.tx_ref;
        break;
      case 'transfer.completed':
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
        reference = data.tx_ref || data.reference;
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
    logger.error('Error processing Flutterwave webhook:', error);
    
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Get banks supported by Flutterwave for a specific country
 * @param {string} country - Country code (GH, NG)
 * @returns {Promise<object>} List of banks
 */
exports.getBanks = async (country = 'GH') => {
  try {
    // Make API request to get banks
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/banks/${country}`,
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const { status, message, data } = response.data;
    
    if (status === 'success') {
      return {
        success: true,
        message: message || 'Banks retrieved successfully',
        banks: data
      };
    } else {
      throw new Error(message || 'Failed to retrieve banks');
    }
  } catch (error) {
    logger.error('Error retrieving banks from Flutterwave:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Get Flutterwave public key for client-side integration
 * @returns {string} Flutterwave public key
 */
exports.getPublicKey = () => {
  return config.publicKey;
}; 