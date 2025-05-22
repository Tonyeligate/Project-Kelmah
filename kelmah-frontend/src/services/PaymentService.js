import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class PaymentService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/payments`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Add auth token to requests
  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Wallet operations
  async getWallet() {
    const response = await this.api.get('/wallet');
    return response.data;
  }

  async getWalletBalance() {
    const response = await this.api.get('/wallet/balance');
    return response.data;
  }

  async deposit(amount, paymentMethodId) {
    const response = await this.api.post('/wallet/deposit', {
      amount,
      paymentMethodId
    });
    return response.data;
  }

  async withdraw(amount, paymentMethodId) {
    const response = await this.api.post('/wallet/withdraw', {
      amount,
      paymentMethodId
    });
    return response.data;
  }

  // Payment methods
  async getPaymentMethods() {
    const response = await this.api.get('/payment-methods');
    return response.data;
  }

  async addPaymentMethod(paymentMethodData) {
    const response = await this.api.post('/payment-methods', paymentMethodData);
    return response.data;
  }

  async updatePaymentMethod(id, paymentMethodData) {
    const response = await this.api.put(`/payment-methods/${id}`, paymentMethodData);
    return response.data;
  }

  async deletePaymentMethod(id) {
    const response = await this.api.delete(`/payment-methods/${id}`);
    return response.data;
  }

  async setDefaultPaymentMethod(id) {
    const response = await this.api.put(`/payment-methods/${id}/default`);
    return response.data;
  }

  // Transactions
  async getTransactions(params = {}) {
    const response = await this.api.get('/transactions', { params });
    return response.data;
  }

  async getTransactionById(id) {
    const response = await this.api.get(`/transactions/${id}`);
    return response.data;
  }

  async getTransactionReceipt(id) {
    const response = await this.api.get(`/transactions/${id}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Escrow operations
  async getEscrowBalance() {
    const response = await this.api.get('/escrow/balance');
    return response.data;
  }

  async getEscrowTransactions(params = {}) {
    const response = await this.api.get('/escrow/transactions', { params });
    return response.data;
  }

  async releaseEscrow(escrowId) {
    const response = await this.api.post(`/escrow/${escrowId}/release`);
    return response.data;
  }

  async refundEscrow(escrowId) {
    const response = await this.api.post(`/escrow/${escrowId}/refund`);
    return response.data;
  }

  // Disputes
  async getDisputes(params = {}) {
    const response = await this.api.get('/disputes', { params });
    return response.data;
  }

  async getDisputeById(id) {
    const response = await this.api.get(`/disputes/${id}`);
    return response.data;
  }

  async createDispute(disputeData) {
    const response = await this.api.post('/disputes', disputeData);
    return response.data;
  }

  async updateDispute(id, disputeData) {
    const response = await this.api.put(`/disputes/${id}`, disputeData);
    return response.data;
  }

  async resolveDispute(id, resolution) {
    const response = await this.api.post(`/disputes/${id}/resolve`, resolution);
    return response.data;
  }

  // Payment settings
  async getPaymentSettings() {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async updatePaymentSettings(settings) {
    const response = await this.api.put('/settings', settings);
    return response.data;
  }

  async updateTaxInformation(taxInfo) {
    const response = await this.api.put('/settings/tax', taxInfo);
    return response.data;
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message);
    }
  }
}

export default new PaymentService(); 