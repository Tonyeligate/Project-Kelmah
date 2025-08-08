/**
 * Payment Service
 * Handles all payment-related API calls
 */

import { paymentServiceClient } from '../../common/services/axios';

const paymentService = {
  // Wallet operations
  getWallet: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/wallet');
    return data;
  },

  // Payment methods
  getPaymentMethods: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/methods');
    return data;
  },

  addPaymentMethod: async (methodData) => {
    const { data } = await paymentServiceClient.post('/api/payments/methods', methodData);
    return data;
  },

  setDefaultPaymentMethod: async (methodId) => {
    const { data } = await paymentServiceClient.put(`/api/payments/methods/${methodId}/default`);
    return data;
  },

  deletePaymentMethod: async (methodId) => {
    const { data } = await paymentServiceClient.delete(`/api/payments/methods/${methodId}`);
    return data;
  },

  // Transaction operations
  getTransactionHistory: async (params = {}) => {
    const response = await paymentServiceClient.get('/api/payments/transactions/history', { params });
    return response.data;
  },

  createTransaction: async (transactionData) => {
    // Normalize client payload to match backend expectation
    const normalized = {
      ...transactionData,
      paymentMethod: transactionData.paymentMethod || transactionData.paymentMethodId,
    };
    const { data } = await paymentServiceClient.post('/api/payments/transactions', normalized);
    return data;
  },

  // Escrow operations
  getEscrows: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/escrows');
    return data;
  },

  getEscrowDetails: async (escrowId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/escrows/${escrowId}`);
    return data;
  },

  releaseEscrow: async (escrowId, releaseData) => {
    const { data } = await paymentServiceClient.post(`/api/payments/escrows/${escrowId}/release`, releaseData);
    return data;
  },

  // Bills operations
  getBills: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/bills');
    return data;
  },

  payBill: async (billId) => {
    const { data } = await paymentServiceClient.post(`/api/payments/bills/${billId}/pay`);
    return data;
  },

  // Wallet fund operations
  withdrawFunds: async (amount, methodId) => {
    const { data } = await paymentServiceClient.post('/api/payments/transactions', { amount, type: 'withdrawal', paymentMethodId: methodId });
    return data;
  },

  addFunds: async (amount, methodId) => {
    const { data } = await paymentServiceClient.post('/api/payments/transactions', { amount, type: 'deposit', paymentMethodId: methodId });
    return data;
  },

  // Payment settings
  getPaymentSettings: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/settings');
    return data;
  },

  updatePaymentSettings: async (settings) => {
    const { data } = await paymentServiceClient.put('/api/payments/settings', settings);
    return data;
  },

  // 🇬🇭 GHANA MOBILE MONEY INTEGRATION
  
  // MTN Mobile Money operations
  processMtnMoMoPayment: async (paymentData) => {
    const { data } = await paymentServiceClient.post('/api/payments/mtn-momo/request-to-pay', paymentData);
    return data;
  },

  getMtnMoMoTransactionStatus: async (referenceId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/mtn-momo/status/${referenceId}`);
    return data;
  },

  validateMtnMoMoAccount: async (phoneNumber) => {
    const { data } = await paymentServiceClient.post('/api/payments/mtn-momo/validate', { phoneNumber });
    return data;
  },

  // Vodafone Cash operations
  processVodafoneCashPayment: async (paymentData) => {
    const { data } = await paymentServiceClient.post('/api/payments/vodafone-cash/request-to-pay', paymentData);
    return data;
  },

  getVodafoneCashTransactionStatus: async (referenceId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/vodafone-cash/status/${referenceId}`);
    return data;
  },

  // AirtelTigo Money operations
  processAirtelTigoPayment: async (paymentData) => {
    const { data } = await paymentServiceClient.post('/api/payments/airteltigo/request-to-pay', paymentData);
    return data;
  },

  getAirtelTigoTransactionStatus: async (referenceId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/airteltigo/status/${referenceId}`);
    return data;
  },

  // Unified Mobile Money payment processor
  processMobileMoneyPayment: async (paymentData) => {
    const { provider, phoneNumber, amount, currency = 'GHS', description } = paymentData;
    
    const payload = {
      phoneNumber,
      amount,
      currency,
      description,
      externalId: `KLM_${Date.now()}`,
      payerMessage: description || 'Kelmah platform payment',
      payeeNote: 'Payment for services on Kelmah platform'
    };

    // Route to appropriate provider
    switch (provider) {
      case 'mtn':
        return await paymentService.processMtnMoMoPayment(payload);
      case 'vodafone':
        return await paymentService.processVodafoneCashPayment(payload);
      case 'airteltigo':
        return await paymentService.processAirtelTigoPayment(payload);
      default:
        throw new Error(`Unsupported mobile money provider: ${provider}`);
    }
  },

  // Check Mobile Money transaction status (unified)
  getMobileMoneyTransactionStatus: async (provider, referenceId) => {
    switch (provider) {
      case 'mtn':
        return await paymentService.getMtnMoMoTransactionStatus(referenceId);
      case 'vodafone':
        return await paymentService.getVodafoneCashTransactionStatus(referenceId);
      case 'airteltigo':
        return await paymentService.getAirtelTigoTransactionStatus(referenceId);
      default:
        throw new Error(`Unsupported mobile money provider: ${provider}`);
    }
  },

  // Paystack Ghana integration
  processPaystackPayment: async (paymentData) => {
    const { data } = await paymentServiceClient.post('/api/payments/paystack/initialize', paymentData);
    return data;
  },

  verifyPaystackPayment: async (reference) => {
    const { data } = await paymentServiceClient.get(`/api/payments/paystack/verify/${reference}`);
    return data;
  },

  // Bank transfer operations (Ghana banks)
  initiateBankTransfer: async (transferData) => {
    const { data } = await paymentServiceClient.post('/api/payments/bank-transfer/initiate', transferData);
    return data;
  },

  getBankTransferStatus: async (transferId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/bank-transfer/status/${transferId}`);
    return data;
  },

  // Get available Ghana payment methods
  getGhanaPaymentMethods: async () => {
    const { data } = await paymentServiceClient.get('/api/payments/ghana/methods');
    return data;
  },

  // Worker payout operations (for paying workers)
  processWorkerPayout: async (payoutData) => {
    const { data } = await paymentServiceClient.post('/api/payments/payout/worker', payoutData);
    return data;
  },

  getPayoutStatus: async (payoutId) => {
    const { data } = await paymentServiceClient.get(`/api/payments/payout/status/${payoutId}`);
    return data;
  },
};

export default paymentService;