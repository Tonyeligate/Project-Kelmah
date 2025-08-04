/**
 * Vodafone Cash Integration
 * Vodafone Cash API implementation for Ghana
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class VodafoneCashService {
  constructor() {
    this.baseURL = process.env.VODAFONE_BASE_URL || 'https://uat-api.vodafone.com.gh/vodafone-cash';
    this.environment = process.env.VODAFONE_ENVIRONMENT || 'uat';
    this.clientId = process.env.VODAFONE_CLIENT_ID;
    this.clientSecret = process.env.VODAFONE_CLIENT_SECRET;
    this.merchantId = process.env.VODAFONE_MERCHANT_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth2 access token
   */
  async getAccessToken() {
    try {
      // Check if current token is still valid
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return {
          success: true,
          data: { access_token: this.accessToken }
        };
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/oauth/token`,
        'grant_type=client_credentials&scope=payment',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      // Store token and expiry
      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Vodafone Token Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Initiate payment request
   */
  async initiatePayment(paymentData) {
    try {
      const { amount, phoneNumber, externalId, description } = paymentData;
      
      // Get access token
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const transactionId = uuidv4();
      
      const requestData = {
        merchantTransactionId: externalId || transactionId,
        amount: parseFloat(amount),
        currency: 'GHS',
        description: description || 'Kelmah platform payment',
        customerMobileNumber: this.formatPhoneNumber(phoneNumber),
        merchantId: this.merchantId,
        callbackUrl: `${process.env.CALLBACK_URL}/vodafone/webhook`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`
      };

      const response = await axios.post(
        `${this.baseURL}/v1/payments/initiate`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Request-ID': transactionId
          }
        }
      );

      return {
        success: true,
        data: {
          transactionId,
          paymentId: response.data.paymentId,
          status: response.data.status || 'PENDING',
          message: 'Payment initiated successfully',
          paymentUrl: response.data.paymentUrl
        }
      };
    } catch (error) {
      console.error('Vodafone Initiate Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.get(
        `${this.baseURL}/v1/payments/${paymentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          paymentId,
          status: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency,
          transactionId: response.data.transactionId,
          merchantTransactionId: response.data.merchantTransactionId,
          customerMobileNumber: response.data.customerMobileNumber,
          completedAt: response.data.completedAt,
          reason: response.data.reason
        }
      };
    } catch (error) {
      console.error('Vodafone Get Payment Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Initiate payout (money transfer to user)
   */
  async initiatePayout(payoutData) {
    try {
      const { amount, phoneNumber, externalId, description } = payoutData;
      
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const transactionId = uuidv4();
      
      const requestData = {
        merchantTransactionId: externalId || transactionId,
        amount: parseFloat(amount),
        currency: 'GHS',
        description: description || 'Kelmah platform payout',
        customerMobileNumber: this.formatPhoneNumber(phoneNumber),
        merchantId: this.merchantId,
        callbackUrl: `${process.env.CALLBACK_URL}/vodafone/payout-webhook`
      };

      const response = await axios.post(
        `${this.baseURL}/v1/payouts/initiate`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Request-ID': transactionId
          }
        }
      );

      return {
        success: true,
        data: {
          transactionId,
          payoutId: response.data.payoutId,
          status: response.data.status || 'PENDING',
          message: 'Payout initiated successfully'
        }
      };
    } catch (error) {
      console.error('Vodafone Initiate Payout Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Check payout status
   */
  async getPayoutStatus(payoutId) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.get(
        `${this.baseURL}/v1/payouts/${payoutId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          payoutId,
          status: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency,
          transactionId: response.data.transactionId,
          merchantTransactionId: response.data.merchantTransactionId,
          customerMobileNumber: response.data.customerMobileNumber,
          completedAt: response.data.completedAt,
          reason: response.data.reason
        }
      };
    } catch (error) {
      console.error('Vodafone Get Payout Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Validate customer mobile number
   */
  async validateCustomer(phoneNumber) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await axios.get(
        `${this.baseURL}/v1/customers/${formattedNumber}/validate`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          phoneNumber: formattedNumber,
          isValid: response.data.isValid,
          customerName: response.data.customerName,
          network: response.data.network,
          message: response.data.isValid ? 'Customer is valid' : 'Customer is not valid'
        }
      };
    } catch (error) {
      console.error('Vodafone Validate Customer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get merchant balance
   */
  async getMerchantBalance() {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.get(
        `${this.baseURL}/v1/merchants/${this.merchantId}/balance`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          merchantId: this.merchantId,
          balance: response.data.balance,
          currency: response.data.currency,
          lastUpdated: response.data.lastUpdated
        }
      };
    } catch (error) {
      console.error('Vodafone Get Balance Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params = {}) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const {
        startDate,
        endDate,
        status,
        page = 1,
        limit = 50
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (status) queryParams.append('status', status);

      const response = await axios.get(
        `${this.baseURL}/v1/merchants/${this.merchantId}/transactions?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          transactions: response.data.transactions,
          pagination: response.data.pagination,
          summary: response.data.summary
        }
      };
    } catch (error) {
      console.error('Vodafone Get Transaction History Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Process webhook notification
   */
  processWebhook(webhookData, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookData, signature)) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      return {
        success: true,
        data: {
          eventType: webhookData.eventType,
          paymentId: webhookData.paymentId,
          payoutId: webhookData.payoutId,
          status: webhookData.status,
          amount: webhookData.amount,
          currency: webhookData.currency,
          transactionId: webhookData.transactionId,
          merchantTransactionId: webhookData.merchantTransactionId,
          customerMobileNumber: webhookData.customerMobileNumber,
          completedAt: webhookData.completedAt,
          reason: webhookData.reason,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Vodafone Webhook Processing Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.VODAFONE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn('Vodafone webhook secret not configured');
        return true; // Skip verification if no secret configured
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Format phone number for Vodafone Cash
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
   * Determine network from phone number
   */
  getNetworkFromNumber(phoneNumber) {
    const cleaned = this.formatPhoneNumber(phoneNumber);
    
    // Vodafone prefixes in Ghana
    const vodafonePrefixes = ['23320', '23350', '23324', '23325', '23354', '23355'];
    
    for (const prefix of vodafonePrefixes) {
      if (cleaned.startsWith(prefix)) {
        return 'vodafone';
      }
    }
    
    return 'other';
  }

  /**
   * Health check for Vodafone Cash service
   */
  async healthCheck() {
    try {
      const tokenResult = await this.getAccessToken();
      
      return {
        success: true,
        service: 'Vodafone Cash',
        status: tokenResult.success ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: this.environment,
        tokenValid: !!this.accessToken
      };
    } catch (error) {
      return {
        success: false,
        service: 'Vodafone Cash',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId, reason = 'User cancelled') {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.post(
        `${this.baseURL}/v1/payments/${paymentId}/cancel`,
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          paymentId,
          status: 'CANCELLED',
          reason,
          cancelledAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Vodafone Cancel Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, refundData) {
    try {
      const { amount, reason } = refundData;
      
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const refundId = uuidv4();
      
      const requestData = {
        refundId,
        amount: amount ? parseFloat(amount) : undefined, // Partial or full refund
        reason: reason || 'Refund requested',
        merchantId: this.merchantId
      };

      const response = await axios.post(
        `${this.baseURL}/v1/payments/${paymentId}/refund`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.data.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Request-ID': refundId
          }
        }
      );

      return {
        success: true,
        data: {
          paymentId,
          refundId,
          status: 'REFUND_INITIATED',
          amount: response.data.refundAmount,
          reason,
          refundedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Vodafone Refund Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = VodafoneCashService;