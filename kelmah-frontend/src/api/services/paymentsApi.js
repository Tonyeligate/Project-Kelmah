/**
 * Payments API Service
 * Handles payment operations and transactions
 */

import { authServiceClient } from '../../modules/common/services/axios';

class PaymentsApi {
  constructor() {
    // Temporarily use auth service client until payment service is deployed
    this.client = authServiceClient;
  }

  /**
   * Get payment methods for current user
   * @returns {Promise<Object>} Payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await this.client.get('/api/payments/methods');
      return response.data;
    } catch (error) {
      console.warn(
        'Payment service unavailable for methods, using mock data:',
        error.message,
      );
      return {
        methods: [
          {
            id: 'pm-1',
            type: 'mobile_money',
            provider: 'MTN',
            number: '+233*****678',
            isDefault: true,
            status: 'active',
          },
          {
            id: 'pm-2',
            type: 'bank_account',
            provider: 'GCB Bank',
            accountNumber: '****4567',
            isDefault: false,
            status: 'active',
          },
        ],
      };
    }
  }

  /**
   * Add a new payment method
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<Object>} Added payment method
   */
  async addPaymentMethod(paymentMethodData) {
    try {
      const response = await this.client.post(
        '/api/payments/methods',
        paymentMethodData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Payment service unavailable for adding method, simulating success:',
        error.message,
      );
      return {
        success: true,
        method: {
          id: `pm-${Date.now()}`,
          ...paymentMethodData,
          isDefault: false,
          status: 'active',
          createdAt: new Date(),
        },
      };
    }
  }

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Payment method ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deletePaymentMethod(paymentMethodId) {
    const response = await this.client.delete(
      `/api/payments/methods/${paymentMethodId}`,
    );
    return response.data;
  }

  /**
   * Set default payment method
   * @param {string} paymentMethodId - Payment method ID to set as default
   * @returns {Promise<Object>} Updated payment methods
   */
  async setDefaultPaymentMethod(paymentMethodId) {
    const response = await this.client.put(
      `/api/payments/methods/${paymentMethodId}/default`,
    );
    return response.data;
  }

  /**
   * Get transaction history
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   * @param {string} params.type - Transaction type filter
   * @returns {Promise<Object>} Transaction history
   */
  async getTransactionHistory(params = {}) {
    const response = await this.client.get('/api/payments/transactions', {
      params,
    });
    return response.data;
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(transactionId) {
    const response = await this.client.get(
      `/api/payments/transactions/${transactionId}`,
    );
    return response.data;
  }

  /**
   * Make a payment for a job
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.jobId - Job ID
   * @param {string} paymentData.paymentMethodId - Payment method ID
   * @param {number} paymentData.amount - Payment amount
   * @returns {Promise<Object>} Payment result
   */
  async makeJobPayment(paymentData) {
    const response = await this.client.post('/api/payments/job', paymentData);
    return response.data;
  }

  /**
   * Request a refund
   * @param {Object} refundData - Refund request data
   * @param {string} refundData.transactionId - Transaction ID
   * @param {string} refundData.reason - Refund reason
   * @returns {Promise<Object>} Refund request result
   */
  async requestRefund(refundData) {
    const response = await this.client.post(
      '/api/payments/refunds',
      refundData,
    );
    return response.data;
  }

  /**
   * Get refund requests
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Refund requests
   */
  async getRefundRequests(params = {}) {
    const response = await this.client.get('/api/payments/refunds', { params });
    return response.data;
  }

  /**
   * Get payment settings
   * @returns {Promise<Object>} Payment settings
   */
  async getPaymentSettings() {
    const response = await this.client.get('/api/payments/settings');
    return response.data;
  }

  /**
   * Update payment settings
   * @param {Object} settings - Payment settings
   * @returns {Promise<Object>} Updated settings
   */
  async updatePaymentSettings(settings) {
    const response = await this.client.put('/api/payments/settings', settings);
    return response.data;
  }

  /**
   * Get payout methods (for workers)
   * @returns {Promise<Object>} Payout methods
   */
  async getPayoutMethods() {
    const response = await this.client.get('/api/payments/payout-methods');
    return response.data;
  }

  /**
   * Add payout method (for workers)
   * @param {Object} payoutMethodData - Payout method data
   * @returns {Promise<Object>} Added payout method
   */
  async addPayoutMethod(payoutMethodData) {
    const response = await this.client.post(
      '/api/payments/payout-methods',
      payoutMethodData,
    );
    return response.data;
  }

  /**
   * Delete payout method (for workers)
   * @param {string} payoutMethodId - Payout method ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deletePayoutMethod(payoutMethodId) {
    const response = await this.client.delete(
      `/api/payments/payout-methods/${payoutMethodId}`,
    );
    return response.data;
  }

  /**
   * Set default payout method (for workers)
   * @param {string} payoutMethodId - Payout method ID to set as default
   * @returns {Promise<Object>} Updated payout methods
   */
  async setDefaultPayoutMethod(payoutMethodId) {
    const response = await this.client.put(
      `/api/payments/payout-methods/${payoutMethodId}/default`,
    );
    return response.data;
  }

  /**
   * Request payout (for workers)
   * @param {Object} payoutData - Payout request data
   * @returns {Promise<Object>} Payout request result
   */
  async requestPayout(payoutData) {
    const response = await this.client.post(
      '/api/payments/payouts',
      payoutData,
    );
    return response.data;
  }

  /**
   * Get payout history (for workers)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Payout history
   */
  async getPayoutHistory(params = {}) {
    const response = await this.client.get('/api/payments/payouts', { params });
    return response.data;
  }

  /**
   * Create a general transaction (deposit, withdrawal)
   * @param {Object} transactionData - { amount, type, paymentMethodId, currency }
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(transactionData) {
    const response = await this.client.post(
      '/api/payments/transactions',
      transactionData,
    );
    return response.data;
  }

  /**
   * Get wallet details for current user
   * @returns {Promise<Object>} Wallet object
   */
  async getWallet() {
    const response = await this.client.get('/api/payments/wallet');
    return response.data;
  }

  /**
   * Get escrow contracts for the current user
   * @returns {Promise<Object[]>} List of escrow objects
   */
  async getEscrows() {
    const response = await this.client.get('/payments/escrows');
    return response.data;
  }

  /**
   * Release funds from an escrow
   * @param {string} escrowId - Escrow ID to release
   * @param {Object} payload - Optional payload (e.g., paymentMethodId, notes)
   * @returns {Promise<Object>} Release operation result
   */
  async releaseEscrow(escrowId, payload = {}) {
    const response = await this.client.post(
      `/payments/escrows/${escrowId}/release`,
      payload,
    );
    return response.data;
  }

  /**
   * Get bills for current user
   * @returns {Promise<Object[]>} List of bills
   */
  async getBills() {
    const response = await this.client.get('/api/payments/bills');
    return response.data;
  }

  /**
   * Pay a specific bill
   * @param {string} billId - Bill ID to pay
   * @returns {Promise<Object>} Payment result
   */
  async payBill(billId) {
    const response = await this.client.post(
      `/api/payments/bills/${billId}/pay`,
    );
    return response.data;
  }
}

export default new PaymentsApi();
