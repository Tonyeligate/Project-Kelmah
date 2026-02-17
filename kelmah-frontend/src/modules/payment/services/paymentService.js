/**
 * Payment Service
 * Handles all payment-related API calls
 */

import { api } from '../../../services/apiClient';

const normalizePaymentMethod = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || raw._id || raw.paymentMethodId;
  const type = raw.type || raw.methodType;
  const isDefault = Boolean(raw.isDefault);

  let icon = raw.icon;
  if (!icon) {
    if (type === 'bank_account' || type === 'bank') icon = 'bank';
    else if (type === 'mobile_money' || type === 'mobile') icon = 'mobile';
    else icon = 'credit';
  }

  let name = raw.name;
  if (!name) {
    if (type === 'credit_card') name = 'Card';
    else if (type === 'bank_account') name = 'Bank Account';
    else if (type === 'paypal') name = 'PayPal';
    else if (type === 'mobile_money') name = 'Mobile Money';
    else name = 'Payment Method';
  }

  const displayValue =
    raw.cardNumber ||
    raw.phoneNumber ||
    raw.accountNumber ||
    raw.email ||
    raw.displayValue ||
    raw.masked ||
    raw.last4 ||
    '';

  return {
    ...raw,
    id,
    type,
    icon,
    name,
    isDefault,
    displayValue,
  };
};

const normalizePaymentMethodsResponse = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.data && Array.isArray(payload.data)
      ? payload.data
      : payload?.paymentMethods && Array.isArray(payload.paymentMethods)
        ? payload.paymentMethods
        : [];
  return list.map(normalizePaymentMethod).filter(Boolean);
};

const paymentService = {
  // Wallet operations
  getWallet: async () => {
    try {
      // Backend exposes wallet at /api/payments/wallet (mounted router returns data at "/")
      const { data } = await api.get('/payments/wallet');
      return data;
    } catch (error) {
      console.warn('Wallet service unavailable:', error.message);
      // Return empty wallet state — do NOT show fake balances
      return {
        id: null,
        userId: null,
        balance: {
          total: 0,
          available: 0,
          pending: 0,
          currency: 'GHS',
        },
        accounts: [],
        recentActivity: [],
        lastUpdated: null,
        _serviceUnavailable: true,
      };
    }
  },

  // Payment methods
  getPaymentMethods: async () => {
    const { data } = await api.get('/payments/methods');
    return normalizePaymentMethodsResponse(data);
  },

  addPaymentMethod: async (methodData) => {
    const { data } = await api.post('/payments/methods', methodData);
    const created = data?.data || data;
    return normalizePaymentMethod(created);
  },

  setDefaultPaymentMethod: async (methodId) => {
    const { data } = await api.put(`/payments/methods/${methodId}/default`);
    return data?.data ? normalizePaymentMethod(data.data) : data;
  },

  deletePaymentMethod: async (methodId) => {
    const { data } = await api.delete(`/payments/methods/${methodId}`);
    return data;
  },

  // Payment analytics
  getPaymentAnalytics: async (params = {}) => {
    const { data } = await api.get('/payments/analytics', { params });
    return data;
  },

  // Transaction operations
  getTransactionHistory: async (params = {}) => {
    const response = await api.get('/payments/transactions/history', {
      params,
    });
    // Normalize to { data, pagination }
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: response.data.length,
          pages: 1,
        },
      };
    }
    return response.data;
  },

  createTransaction: async (transactionData) => {
    // Normalize client payload to match backend expectation
    const normalized = {
      ...transactionData,
      paymentMethod:
        transactionData.paymentMethod || transactionData.paymentMethodId,
    };
    const { data } = await api.post('/payments/transactions', normalized);
    return data;
  },

  // Escrow operations
  getEscrows: async () => {
    try {
      const { data } = await api.get('/payments/escrows');
      return data;
    } catch (error) {
      console.warn('Escrow service unavailable:', error.message);
      // Return empty array — do NOT show fake escrow data
      return [];
    }
  },

  fundEscrow: async (payload) => {
    const { data } = await api.post('/payments/escrows/fund', payload);
    return data;
  },

  refundEscrow: async (escrowId) => {
    const { data } = await api.post(`/payments/escrows/${escrowId}/refund`);
    return data;
  },

  getEscrowDetails: async (escrowId) => {
    const { data } = await api.get(`/payments/escrows/${escrowId}`);
    return data;
  },

  releaseEscrow: async (escrowId, releaseData) => {
    const { data } = await api.post(
      `/payments/escrows/${escrowId}/release`,
      releaseData,
    );
    return data;
  },

  // Bills operations
  getBills: async () => {
    const { data } = await api.get('/payments/bills');
    return data;
  },

  payBill: async (billId) => {
    const { data } = await api.post(`/payments/bills/${billId}/pay`);
    return data;
  },

  // Wallet fund operations
  withdrawFunds: async (amount, methodId) => {
    const { data } = await api.post('/payments/transactions', {
      amount,
      type: 'withdrawal',
      paymentMethodId: methodId,
    });
    return data;
  },

  addFunds: async (amount, methodId) => {
    const { data } = await api.post('/payments/transactions', {
      amount,
      type: 'deposit',
      paymentMethodId: methodId,
    });
    return data;
  },

  // Payment settings
  getPaymentSettings: async () => {
    const { data } = await api.get('/payments/settings');
    return data;
  },

  updatePaymentSettings: async (settings) => {
    const { data } = await api.put('/payments/settings', settings);
    return data;
  },

  // 🇬🇭 GHANA MOBILE MONEY INTEGRATION

  // MTN Mobile Money operations
  processMtnMoMoPayment: async (paymentData) => {
    const { data } = await api.post(
      '/payments/mtn-momo/request-to-pay',
      paymentData,
    );
    return data;
  },

  getMtnMoMoTransactionStatus: async (referenceId) => {
    const { data } = await api.get(`/payments/mtn-momo/status/${referenceId}`);
    return data;
  },

  validateMtnMoMoAccount: async (phoneNumber) => {
    const { data } = await api.post('/payments/mtn-momo/validate', {
      phoneNumber,
    });
    return data;
  },

  // Vodafone Cash operations
  processVodafoneCashPayment: async (paymentData) => {
    const { data } = await api.post(
      '/payments/vodafone-cash/request-to-pay',
      paymentData,
    );
    return data;
  },

  getVodafoneCashTransactionStatus: async (referenceId) => {
    const { data } = await api.get(
      `/payments/vodafone-cash/status/${referenceId}`,
    );
    return data;
  },

  // AirtelTigo Money operations
  processAirtelTigoPayment: async (paymentData) => {
    const { data } = await api.post(
      '/payments/airteltigo/request-to-pay',
      paymentData,
    );
    return data;
  },

  getAirtelTigoTransactionStatus: async (referenceId) => {
    const { data } = await api.get(
      `/payments/airteltigo/status/${referenceId}`,
    );
    return data;
  },

  // Unified Mobile Money payment processor
  processMobileMoneyPayment: async (paymentData) => {
    const {
      provider,
      phoneNumber,
      amount,
      currency = 'GHS',
      description,
    } = paymentData;

    const payload = {
      phoneNumber,
      amount,
      currency,
      description,
      externalId: `KLM_${Date.now()}`,
      payerMessage: description || 'Kelmah platform payment',
      payeeNote: 'Payment for services on Kelmah platform',
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
        return await paymentService.getVodafoneCashTransactionStatus(
          referenceId,
        );
      case 'airteltigo':
        return await paymentService.getAirtelTigoTransactionStatus(referenceId);
      default:
        throw new Error(`Unsupported mobile money provider: ${provider}`);
    }
  },

  // Paystack Ghana integration
  processPaystackPayment: async (paymentData) => {
    const { data } = await api.post(
      '/payments/paystack/initialize',
      paymentData,
    );
    return data;
  },

  verifyPaystackPayment: async (reference) => {
    const { data } = await api.get(`/payments/paystack/verify/${reference}`);
    return data;
  },

  // Stripe integration
  createStripePaymentIntent: async (intentData) => {
    const { data } = await api.post(
      '/payments/create-payment-intent',
      intentData,
    );
    return data;
  },

  // Bank transfer operations (Ghana banks)
  initiateBankTransfer: async (transferData) => {
    const { data } = await api.post(
      '/payments/bank-transfer/initiate',
      transferData,
    );
    return data;
  },

  getBankTransferStatus: async (transferId) => {
    const { data } = await api.get(
      `/payments/bank-transfer/status/${transferId}`,
    );
    return data;
  },

  // Get available Ghana payment methods
  getGhanaPaymentMethods: async () => {
    const { data } = await api.get('/payments/ghana/methods');
    return data;
  },

  // Worker payout operations (for paying workers)
  processWorkerPayout: async (payoutData) => {
    const { data } = await api.post('/payments/payout/worker', payoutData);
    return data;
  },

  getPayoutStatus: async (payoutId) => {
    const { data } = await api.get(`/payments/payout/status/${payoutId}`);
    return data;
  },

  // Aliases for GhanaianMobileMoneyInterface and GhanaSMSVerification components
  initiateMobileMoneyPayment: async (paymentData) => {
    return await paymentService.processMobileMoneyPayment(paymentData);
  },

  confirmMobileMoneyPayment: async ({ transactionId, pin, phoneNumber }) => {
    const provider = 'mtn'; // default; component should pass provider
    const { data } = await api.post('/payments/mtn-momo/confirm', {
      transactionId,
      pin,
      phoneNumber,
    });
    return data;
  },

  sendSMSVerification: async ({ phoneNumber, purpose, amount }) => {
    const { data } = await api.post('/payments/sms-verification/send', {
      phoneNumber,
      purpose,
      amount,
    });
    return data;
  },

  verifySMSCode: async ({ verificationId, code }) => {
    const { data } = await api.post('/payments/sms-verification/verify', {
      verificationId,
      code,
    });
    return data;
  },
};

export default paymentService;
