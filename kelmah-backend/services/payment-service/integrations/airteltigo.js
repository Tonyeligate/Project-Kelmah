/**
 * AirtelTigo Money Integration (Simplified placeholder)
 * Provides a compatible interface like MTN/Vodafone for requestToPay and status
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AirtelTigoService {
  constructor() {
    this.baseURL = process.env.AIRTELTIGO_BASE_URL || 'https://api.airteltigo.com.gh/mobile-money';
    this.clientId = process.env.AIRTELTIGO_CLIENT_ID;
    this.clientSecret = process.env.AIRTELTIGO_CLIENT_SECRET;
    this.merchantId = process.env.AIRTELTIGO_MERCHANT_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return { success: true, data: { access_token: this.accessToken } };
      }

      const response = await axios.post(
        `${this.baseURL}/oauth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = String(phoneNumber).replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '233' + cleaned.slice(1);
    if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
    return cleaned;
  }

  async requestToPay({ amount, phoneNumber, externalId, description }) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) return tokenResult;

      const referenceId = externalId || uuidv4();
      const payload = {
        referenceId,
        amount: parseFloat(amount),
        currency: 'GHS',
        msisdn: this.formatPhoneNumber(phoneNumber),
        description: description || 'Kelmah platform payment',
        merchantId: this.merchantId,
        callbackUrl: `${process.env.CALLBACK_URL || ''}/airteltigo/webhook`,
      };

      const response = await axios.post(`${this.baseURL}/v1/collections/request-to-pay`, payload, {
        headers: {
          Authorization: `Bearer ${tokenResult.data.access_token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': referenceId,
        },
      });

      return {
        success: true,
        data: {
          referenceId,
          status: response.data?.status || 'PENDING',
          message: 'Payment initiated successfully',
        },
      };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async getTransactionStatus(referenceId) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) return tokenResult;

      const response = await axios.get(`${this.baseURL}/v1/collections/status/${referenceId}`, {
        headers: {
          Authorization: `Bearer ${tokenResult.data.access_token}`,
          Accept: 'application/json',
        },
      });

      return {
        success: true,
        data: {
          referenceId,
          status: response.data?.status || 'PENDING',
          amount: response.data?.amount,
          currency: response.data?.currency || 'GHS',
          completedAt: response.data?.completedAt,
        },
      };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async healthCheck() {
    try {
      const tokenResult = await this.getAccessToken();
      return {
        success: true,
        service: 'AirtelTigo Money',
        status: tokenResult.success ? 'healthy' : 'degraded',
        tokenValid: !!this.accessToken,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { success: false, service: 'AirtelTigo Money', status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = AirtelTigoService;




