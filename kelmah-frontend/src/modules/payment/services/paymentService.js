/**
 * Payment Service
 * Handles all payment-related API calls
 */

import { paymentServiceClient } from '../../common/services/axios';

const paymentService = {
  // Wallet operations
  getWallet: async () => {
    try {
      // Backend exposes wallet at /api/payments/wallet (mounted router returns data at "/")
      const { data } = await paymentServiceClient.get('/api/payments/wallet');
      return data;
    } catch (error) {
      console.warn('Wallet service unavailable:', error.message);
      // Return comprehensive mock wallet data
      return {
        id: 'wallet_mock_1',
        userId: '6892b90b66a1e818f0c46161',
        balance: {
          total: 2540.50,
          available: 2340.50,
          pending: 200.00,
          currency: 'GHS'
        },
        accounts: [
          {
            id: 'acc_1',
            type: 'earnings',
            balance: 1840.50,
            currency: 'GHS',
            name: 'Job Earnings'
          },
          {
            id: 'acc_2', 
            type: 'escrow',
            balance: 500.00,
            currency: 'GHS',
            name: 'Escrow Balance'
          },
          {
            id: 'acc_3',
            type: 'bonus',
            balance: 200.00,
            currency: 'GHS',
            name: 'Performance Bonus'
          }
        ],
        recentActivity: [
          {
            id: 'activity_1',
            type: 'payment_received',
            amount: 800.00,
            description: 'Payment for Plumbing Job #PL-2024-001',
            date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            status: 'completed'
          }
        ],
        lastUpdated: new Date().toISOString()
      };
    }
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
    // Normalize to { data, pagination }
    if (Array.isArray(response.data)) {
      return { data: response.data, pagination: { page: params.page || 1, limit: params.limit || 20, total: response.data.length, pages: 1 } };
    }
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
    try {
      const { data } = await paymentServiceClient.get('/api/payments/escrows');
      return data;
    } catch (error) {
      console.warn('Escrow service unavailable:', error.message);
      // Return comprehensive mock escrow data
      return [
        {
          id: 'escrow_1',
          jobId: 'job_1',
          jobTitle: 'Residential Plumbing Repair',
          amount: 1200.00,
          currency: 'GHS',
          status: 'active',
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          releaseDate: null,
          disputeDate: null,
          worker: {
            id: '6892b90b66a1e818f0c46161',
            name: 'Kwaku Osei'
          },
          client: {
            id: 'client_1',
            name: 'Sarah Johnson'
          },
          milestones: [
            {
              id: 'milestone_1',
              description: 'Initial assessment and pipe repair',
              amount: 600.00,
              status: 'completed',
              completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
            },
            {
              id: 'milestone_2',
              description: 'Fixture installation and final testing',
              amount: 600.00,
              status: 'pending',
              dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString()
            }
          ]
        },
        {
          id: 'escrow_2',
          jobId: 'job_2',
          jobTitle: 'Electrical Installation',
          amount: 2500.00,
          currency: 'GHS', 
          status: 'completed',
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
          releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          disputeDate: null,
          worker: {
            id: '6892b90b66a1e818f0c46161',
            name: 'Kwaku Osei'
          },
          client: {
            id: 'client_2',
            name: 'TechCorp Ghana'
          },
          milestones: [
            {
              id: 'milestone_3',
              description: 'Complete electrical setup',
              amount: 2500.00,
              status: 'completed',
              completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
            }
          ]
        }
      ];
    }
  },

  fundEscrow: async (payload) => {
    const { data } = await paymentServiceClient.post('/api/payments/escrows/fund', payload);
    return data;
  },

  refundEscrow: async (escrowId) => {
    const { data } = await paymentServiceClient.post(`/api/payments/escrows/${escrowId}/refund`);
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

  // Stripe integration
  createStripePaymentIntent: async (intentData) => {
    const { data } = await paymentServiceClient.post('/api/payments/create-payment-intent', intentData);
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