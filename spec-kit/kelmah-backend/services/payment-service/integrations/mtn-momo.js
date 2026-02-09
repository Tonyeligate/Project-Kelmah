/**
 * MTN Mobile Money Integration
 * Official MTN MoMo API implementation for Ghana
 */

const { http } = require('../../../shared/utils/http');
const { CircuitBreaker } = require('../../../shared/utils/circuitBreaker');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class MTNMoMoService {
  constructor() {
    this.baseURL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.environment = process.env.MTN_ENVIRONMENT || 'sandbox';
    this.subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    this.apiUserId = process.env.MTN_API_USER_ID;
    this.apiKey = process.env.MTN_API_KEY;
    this.callbackHost = process.env.CALLBACK_HOST || 'https://webhook.site/unique-id';
    
    // Collection API credentials
    this.collectionApiUserId = process.env.MTN_COLLECTION_API_USER_ID;
    this.collectionPrimaryKey = process.env.MTN_COLLECTION_PRIMARY_KEY;
    
    // Disbursement API credentials
    this.disbursementApiUserId = process.env.MTN_DISBURSEMENT_API_USER_ID;
    this.disbursementPrimaryKey = process.env.MTN_DISBURSEMENT_PRIMARY_KEY;
  }

  /**
   * Create API user and API key
   */
  async createApiUser() {
    try {
      const referenceId = uuidv4();
      
      const doCall = () => http.post(
        `${this.baseURL}/v1_0/apiuser`,
        {
          providerCallbackHost: this.callbackHost
        },
        {
          headers: {
            'X-Reference-Id': referenceId,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          referenceId,
          message: 'API User created successfully'
        }
      };
    } catch (error) {
      console.error('MTN Create API User Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get API user details
   */
  async getApiUser(referenceId) {
    try {
      const doCall = () => http.get(
        `${this.baseURL}/v1_0/apiuser/${referenceId}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MTN Get API User Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create API key for user
   */
  async createApiKey(referenceId) {
    try {
      const doCall = () => http.post(
        `${this.baseURL}/v1_0/apiuser/${referenceId}/apikey`,
        {},
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MTN Create API Key Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Generate access token for Collection API
   */
  async getCollectionAccessToken() {
    try {
      const credentials = Buffer.from(`${this.collectionApiUserId}:${this.collectionPrimaryKey}`).toString('base64');
      
      const doCall = () => http.post(
        `${this.baseURL}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MTN Collection Token Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Request payment from customer
   */
  async requestToPay(paymentData) {
    try {
      const { amount, phoneNumber, externalId, payerMessage, payeeNote } = paymentData;
      
      // Get access token
      const tokenResult = await this.getCollectionAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const referenceId = uuidv4();
      
      const requestData = {
        amount: amount.toString(),
        currency: 'EUR', // MTN MoMo Ghana uses EUR as base currency
        externalId: externalId || referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.formatPhoneNumber(phoneNumber)
        },
        payerMessage: payerMessage || 'Payment for services',
        payeeNote: payeeNote || 'Kelmah platform payment'
      };

      const doCall = () => http.post(
        `${this.baseURL}/collection/v1_0/requesttopay`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 15000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          referenceId,
          status: 'PENDING',
          message: 'Payment request sent successfully'
        }
      };
    } catch (error) {
      console.error('MTN Request to Pay Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Check payment status
   */
  async getTransactionStatus(referenceId) {
    try {
      // Get access token
      const tokenResult = await this.getCollectionAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const doCall = () => http.get(
        `${this.baseURL}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          referenceId,
          status: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency,
          financialTransactionId: response.data.financialTransactionId,
          externalId: response.data.externalId,
          reason: response.data.reason
        }
      };
    } catch (error) {
      console.error('MTN Get Transaction Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const tokenResult = await this.getCollectionAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const doCall = () => http.get(
        `${this.baseURL}/collection/v1_0/account/balance`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MTN Get Balance Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Generate disbursement access token
   */
  async getDisbursementAccessToken() {
    try {
      const credentials = Buffer.from(`${this.disbursementApiUserId}:${this.disbursementPrimaryKey}`).toString('base64');
      
      const doCall = () => http.post(
        `${this.baseURL}/disbursement/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MTN Disbursement Token Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Transfer money to user (payout)
   */
  async transfer(transferData) {
    try {
      const { amount, phoneNumber, externalId, payerMessage, payeeNote } = transferData;
      
      // Get disbursement access token
      const tokenResult = await this.getDisbursementAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const referenceId = uuidv4();
      
      const requestData = {
        amount: amount.toString(),
        currency: 'EUR',
        externalId: externalId || referenceId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: this.formatPhoneNumber(phoneNumber)
        },
        payerMessage: payerMessage || 'Payment from Kelmah',
        payeeNote: payeeNote || 'Kelmah platform payout'
      };

      const doCall = () => http.post(
        `${this.baseURL}/disbursement/v1_0/transfer`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 15000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          referenceId,
          status: 'PENDING',
          message: 'Transfer initiated successfully'
        }
      };
    } catch (error) {
      console.error('MTN Transfer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(referenceId) {
    try {
      const tokenResult = await this.getDisbursementAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const doCall = () => http.get(
        `${this.baseURL}/disbursement/v1_0/transfer/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          referenceId,
          status: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency,
          financialTransactionId: response.data.financialTransactionId,
          externalId: response.data.externalId,
          reason: response.data.reason
        }
      };
    } catch (error) {
      console.error('MTN Get Transfer Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Validate account holder
   */
  async validateAccountHolder(phoneNumber, accountHolderType = 'MSISDN') {
    try {
      const tokenResult = await this.getCollectionAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const doCall = () => http.get(
        `${this.baseURL}/collection/v1_0/accountholder/${accountHolderType}/${this.formatPhoneNumber(phoneNumber)}/active`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );
      const breaker = new CircuitBreaker(doCall, { failureThreshold: 4, cooldownMs: 20000, timeoutMs: 12000 });
      const response = await breaker.fire();

      return {
        success: true,
        data: {
          phoneNumber: this.formatPhoneNumber(phoneNumber),
          isActive: response.data.result,
          message: response.data.result ? 'Account is active' : 'Account is not active'
        }
      };
    } catch (error) {
      console.error('MTN Validate Account Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Format phone number for MTN MoMo
   * Ghana mobile numbers should be in format: 233XXXXXXXXX
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace with 233
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    
    // If number doesn't start with 233, add it
    if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Convert GHS to EUR (MTN MoMo uses EUR)
   * This would typically use a currency conversion service
   */
  convertGHSToEUR(amountGHS) {
    // This is a simplified conversion - use actual exchange rates in production
    const exchangeRate = 0.076; // Approximate GHS to EUR rate
    return Math.round(amountGHS * exchangeRate * 100) / 100;
  }

  /**
   * Convert EUR to GHS
   */
  convertEURToGHS(amountEUR) {
    const exchangeRate = 13.16; // Approximate EUR to GHS rate
    return Math.round(amountEUR * exchangeRate * 100) / 100;
  }

  /**
   * Process webhook notification
   */
  processWebhook(webhookData) {
    try {
      return {
        success: true,
        data: {
          referenceId: webhookData.referenceId,
          status: webhookData.status,
          amount: webhookData.amount,
          currency: webhookData.currency,
          financialTransactionId: webhookData.financialTransactionId,
          externalId: webhookData.externalId,
          reason: webhookData.reason,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('MTN Webhook Processing Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for MTN MoMo service
   */
  async healthCheck() {
    try {
      // Try to get account balance as a health check
      const result = await this.getAccountBalance();
      
      return {
        success: true,
        service: 'MTN Mobile Money',
        status: result.success ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: this.environment
      };
    } catch (error) {
      return {
        success: false,
        service: 'MTN Mobile Money',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = MTNMoMoService;