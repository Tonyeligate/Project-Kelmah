/**
 * Payment Integrations Index
 * Provides a unified interface for working with all supported payment providers
 */

const mobileMoney = require('./mobile-money');
const paystack = require('./paystack');
const flutterwave = require('./flutterwave');
const logger = require('../utils/logger');

// Define payment providers
const PROVIDERS = {
  MOBILE_MONEY: 'mobile_money',
  PAYSTACK: 'paystack',
  FLUTTERWAVE: 'flutterwave'
};

/**
 * Initialize a payment with any of the supported providers
 * @param {string} provider - Payment provider
 * @param {object} paymentData - Payment data specific to the provider
 * @returns {Promise<object>} Payment initialization response
 */
exports.initializePayment = async (provider, paymentData) => {
  try {
    // Validate required fields
    if (!provider || !paymentData) {
      throw new Error('Provider and payment data are required');
    }
    
    let response;
    
    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case PROVIDERS.MOBILE_MONEY:
        response = await mobileMoney.createPaymentRequest(paymentData);
        break;
      case PROVIDERS.PAYSTACK:
        response = await paystack.initializePayment(paymentData);
        break;
      case PROVIDERS.FLUTTERWAVE:
        response = await flutterwave.initializePayment(paymentData);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
    
    return response;
  } catch (error) {
    logger.error(`Error initializing payment with ${provider}:`, error);
    
    return {
      success: false,
      provider,
      message: error.message,
      status: 'FAILED',
      error: error
    };
  }
};

/**
 * Verify a payment with any of the supported providers
 * @param {string} provider - Payment provider
 * @param {string} reference - Reference ID or transaction ID
 * @returns {Promise<object>} Payment verification response
 */
exports.verifyPayment = async (provider, reference) => {
  try {
    // Validate required fields
    if (!provider || !reference) {
      throw new Error('Provider and reference are required');
    }
    
    let response;
    
    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case PROVIDERS.MOBILE_MONEY:
        response = await mobileMoney.checkPaymentStatus(reference);
        break;
      case PROVIDERS.PAYSTACK:
        response = await paystack.verifyPayment(reference);
        break;
      case PROVIDERS.FLUTTERWAVE:
        response = await flutterwave.verifyPayment(reference);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
    
    return response;
  } catch (error) {
    logger.error(`Error verifying payment with ${provider}:`, error);
    
    return {
      success: false,
      provider,
      reference,
      message: error.message,
      status: 'VERIFICATION_FAILED',
      error: error
    };
  }
};

/**
 * Process a webhook notification from any of the supported providers
 * @param {string} provider - Payment provider
 * @param {object} data - Webhook data
 * @returns {object} Processed webhook response
 */
exports.processWebhook = (provider, req) => {
  try {
    // Validate required fields
    if (!provider || !req) {
      throw new Error('Provider and request data are required');
    }
    
    let response;
    
    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case PROVIDERS.MOBILE_MONEY:
        response = mobileMoney.processWebhook(req.body);
        break;
      case PROVIDERS.PAYSTACK:
        response = paystack.processWebhook(req);
        break;
      case PROVIDERS.FLUTTERWAVE:
        response = flutterwave.processWebhook(req);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
    
    return response;
  } catch (error) {
    logger.error(`Error processing webhook from ${provider}:`, error);
    
    return {
      success: false,
      provider,
      message: error.message,
      error: error
    };
  }
};

/**
 * Initiate a payout or transfer with any of the supported providers
 * @param {string} provider - Payment provider
 * @param {object} transferData - Transfer data specific to the provider
 * @returns {Promise<object>} Transfer initiation response
 */
exports.initiateTransfer = async (provider, transferData) => {
  try {
    // Validate required fields
    if (!provider || !transferData) {
      throw new Error('Provider and transfer data are required');
    }
    
    let response;
    
    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case PROVIDERS.MOBILE_MONEY:
        response = await mobileMoney.initiateWithdrawal(transferData);
        break;
      case PROVIDERS.PAYSTACK:
        response = await paystack.initiateTransfer(transferData);
        break;
      case PROVIDERS.FLUTTERWAVE:
        response = await flutterwave.initiateTransfer(transferData);
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
    
    return response;
  } catch (error) {
    logger.error(`Error initiating transfer with ${provider}:`, error);
    
    return {
      success: false,
      provider,
      message: error.message,
      status: 'FAILED',
      error: error
    };
  }
};

/**
 * Get a list of banks for a specific provider and country
 * @param {string} provider - Payment provider
 * @param {string} country - Country code (GH, NG)
 * @returns {Promise<object>} List of banks
 */
exports.getBanks = async (provider, country = 'GH') => {
  try {
    // Validate required fields
    if (!provider) {
      throw new Error('Provider is required');
    }
    
    let response;
    
    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case PROVIDERS.PAYSTACK:
        response = await paystack.listBanks(country);
        break;
      case PROVIDERS.FLUTTERWAVE:
        response = await flutterwave.getBanks(country);
        break;
      default:
        throw new Error(`Unsupported provider for bank listing: ${provider}`);
    }
    
    return response;
  } catch (error) {
    logger.error(`Error getting banks from ${provider}:`, error);
    
    return {
      success: false,
      provider,
      message: error.message,
      error: error
    };
  }
};

/**
 * Get the appropriate provider for a given payment method
 * @param {string} paymentMethod - Payment method (e.g., card, mobile_money)
 * @param {string} country - Country code (e.g., GH)
 * @returns {string} Recommended provider
 */
exports.getProviderForMethod = (paymentMethod, country = 'GH') => {
  // Validate required fields
  if (!paymentMethod) {
    throw new Error('Payment method is required');
  }
  
  const method = paymentMethod.toLowerCase();
  
  // Default providers based on payment method and country
  if (method.includes('momo') || method.includes('mobile_money') || method.includes('mobile')) {
    return PROVIDERS.MOBILE_MONEY;
  }
  
  if (method.includes('card') || method.includes('bank')) {
    // For Ghana, prefer Paystack for card payments
    if (country === 'GH') {
      return PROVIDERS.PAYSTACK;
    }
    // For other countries or if no preference, use Flutterwave
    return PROVIDERS.FLUTTERWAVE;
  }
  
  // Default to Flutterwave as it supports multiple payment methods
  return PROVIDERS.FLUTTERWAVE;
};

// Export provider constants
exports.PROVIDERS = PROVIDERS;

// Export individual providers for direct access
exports.mobileMoney = mobileMoney;
exports.paystack = paystack;
exports.flutterwave = flutterwave;