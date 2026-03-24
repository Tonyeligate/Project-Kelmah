/**
 * Payment Service
 * Handles all payment-related API calls
 */

import { api } from '../../../services/apiClient';
import { unwrapApiData } from '../../../services/responseNormalizer';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';
import {
  createFeatureLogger,
  devError,
  devWarn,
} from '../../common/utils/devLogger';

const paymentsLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_PAYMENTS',
  level: 'log',
});

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

const unwrapPaymentPayload = (response, defaultValue = null) =>
  unwrapApiData(response, { defaultValue });

const paymentService = {
  // Wallet operations
  getWallet: async () => {
    const response = await api.get('/payments/wallet');
    return unwrapPaymentPayload(response, {});
  },

  // Payment methods
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return normalizePaymentMethodsResponse(unwrapPaymentPayload(response, []));
    } catch (err) {
      devError('getPaymentMethods failed:', err);
      captureRecoverableApiError(err, {
        operation: 'payments.getPaymentMethods',
        fallbackUsed: true,
      });
      return [];
    }
  },

  addPaymentMethod: async (methodData) => {
    const response = await api.post('/payments/methods', methodData);
    const created = unwrapPaymentPayload(response, {});
    return normalizePaymentMethod(created);
  },

  setDefaultPaymentMethod: async (methodId) => {
    const response = await api.put(`/payments/methods/${methodId}/default`);
    const payload = unwrapPaymentPayload(response, {});
    return payload ? normalizePaymentMethod(payload) : payload;
  },

  deletePaymentMethod: async (methodId) => {
    const response = await api.delete(`/payments/methods/${methodId}`);
    return unwrapPaymentPayload(response, {});
  },

  // Payment analytics
  getPaymentAnalytics: async (params = {}) => {
    const response = await api.get('/payments/analytics', { params });
    return unwrapPaymentPayload(response, {});
  },

  // Transaction operations
  getTransactionHistory: async (params = {}) => {
    const response = await api.get('/payments/transactions/history', { params });
    const rd = unwrapPaymentPayload(response, []);
    // New format: { success: true, data: [...], meta: { total, totalPages, currentPage } }
    if (rd?.success && Array.isArray(rd?.data)) {
      return {
        data: rd.data,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: rd.meta?.total ?? rd.data.length,
          pages: rd.meta?.totalPages ?? 1,
        },
      };
    }
    // Legacy: plain array
    if (Array.isArray(rd)) {
      return {
        data: rd,
        pagination: { page: params.page || 1, limit: params.limit || 20, total: rd.length, pages: 1 },
      };
    }
    return rd;
  },

  createTransaction: async (transactionData) => {
    // Normalize client payload to match backend expectation
    const normalized = {
      ...transactionData,
      paymentMethod:
        transactionData.paymentMethod || transactionData.paymentMethodId,
    };
    const response = await api.post('/payments/transactions', normalized);
    return unwrapPaymentPayload(response, {});
  },

  // Escrow operations
  getEscrows: async () => {
    try {
      paymentsLog('Fetching escrows from payments service');
      // Backend returns { success: true, data: [...] } — normalise to array
      const response = await api.get('/payments/escrows');
      const payload = unwrapPaymentPayload(response, []);
      if (Array.isArray(payload)) {
        return payload;
      }
      return payload?.escrows || [];
    } catch (error) {
      devWarn('Escrow service unavailable:', error.message);
      captureRecoverableApiError(error, {
        operation: 'payments.getEscrows',
        fallbackUsed: true,
      });
      // Return empty array — do NOT show fake escrow data
      return [];
    }
  },

  fundEscrow: async (payload) => {
    const response = await api.post('/payments/escrows/fund', payload);
    return unwrapPaymentPayload(response, {});
  },

  refundEscrow: async (escrowId) => {
    const response = await api.post(`/payments/escrows/${escrowId}/refund`);
    return unwrapPaymentPayload(response, {});
  },

  getEscrowDetails: async (escrowId) => {
    const response = await api.get(`/payments/escrows/${escrowId}`);
    return unwrapPaymentPayload(response, {});
  },

  releaseEscrow: async (escrowId, releaseData) => {
    const response = await api.post(
      `/payments/escrows/${escrowId}/release`,
      releaseData,
    );
    return unwrapPaymentPayload(response, {});
  },

  // Bills operations
  getBills: async () => {
    const response = await api.get('/payments/bills');
    return unwrapPaymentPayload(response, []);
  },

  payBill: async (billId) => {
    const response = await api.post(`/payments/bills/${billId}/pay`);
    return unwrapPaymentPayload(response, {});
  },

  // Wallet fund operations
  withdrawFunds: async (amount, methodId) => {
    const response = await api.post('/payments/transactions', {
      amount,
      type: 'withdrawal',
      paymentMethodId: methodId,
    });
    return unwrapPaymentPayload(response, {});
  },

  addFunds: async (amount, methodId) => {
    const response = await api.post('/payments/transactions', {
      amount,
      type: 'deposit',
      paymentMethodId: methodId,
    });
    return unwrapPaymentPayload(response, {});
  },

  // Payment settings
  getPaymentSettings: async () => {
    const response = await api.get('/payments/settings');
    return unwrapPaymentPayload(response, {});
  },

  updatePaymentSettings: async (settings) => {
    const response = await api.put('/payments/settings', settings);
    return unwrapPaymentPayload(response, {});
  },

  // 🇬🇭 GHANA MOBILE MONEY INTEGRATION

  // MTN Mobile Money operations
  processMtnMoMoPayment: async (paymentData) => {
    const response = await api.post(
      '/payments/mtn-momo/request-to-pay',
      paymentData,
    );
    return unwrapPaymentPayload(response, {});
  },

  getMtnMoMoTransactionStatus: async (referenceId) => {
    const response = await api.get(`/payments/mtn-momo/status/${referenceId}`);
    return unwrapPaymentPayload(response, {});
  },

  validateMtnMoMoAccount: async (phoneNumber) => {
    const response = await api.post('/payments/mtn-momo/validate', {
      phoneNumber,
    });
    return unwrapPaymentPayload(response, {});
  },

  // Vodafone Cash operations
  processVodafoneCashPayment: async (paymentData) => {
    const response = await api.post(
      '/payments/vodafone-cash/request-to-pay',
      paymentData,
    );
    return unwrapPaymentPayload(response, {});
  },

  getVodafoneCashTransactionStatus: async (referenceId) => {
    const response = await api.get(
      `/payments/vodafone-cash/status/${referenceId}`,
    );
    return unwrapPaymentPayload(response, {});
  },

  // AirtelTigo Money operations
  processAirtelTigoPayment: async (paymentData) => {
    const response = await api.post(
      '/payments/airteltigo/request-to-pay',
      paymentData,
    );
    return unwrapPaymentPayload(response, {});
  },

  getAirtelTigoTransactionStatus: async (referenceId) => {
    const response = await api.get(
      `/payments/airteltigo/status/${referenceId}`,
    );
    return unwrapPaymentPayload(response, {});
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
    const response = await api.post(
      '/payments/paystack/initialize',
      paymentData,
    );
    return unwrapPaymentPayload(response, {});
  },

  verifyPaystackPayment: async (reference) => {
    const response = await api.get(`/payments/paystack/verify/${reference}`);
    return unwrapPaymentPayload(response, {});
  },

  // Stripe integration
  createStripePaymentIntent: async (intentData) => {
    const response = await api.post(
      '/payments/create-payment-intent',
      intentData,
    );
    return unwrapPaymentPayload(response, {});
  },

  // Bank transfer operations (Ghana banks)
  initiateBankTransfer: async (transferData) => {
    const response = await api.post(
      '/payments/bank-transfer/initiate',
      transferData,
    );
    return unwrapPaymentPayload(response, {});
  },

  getBankTransferStatus: async (transferId) => {
    const response = await api.get(
      `/payments/bank-transfer/status/${transferId}`,
    );
    return unwrapPaymentPayload(response, {});
  },

  // Get available Ghana payment methods
  getGhanaPaymentMethods: async () => {
    const response = await api.get('/payments/ghana/methods');
    return unwrapPaymentPayload(response, []);
  },

  // Worker payout operations (for paying workers)
  processWorkerPayout: async (payoutData) => {
    const response = await api.post('/payments/payout/worker', payoutData);
    return unwrapPaymentPayload(response, {});
  },

  getPayoutStatus: async (payoutId) => {
    const response = await api.get(`/payments/payout/status/${payoutId}`);
    return unwrapPaymentPayload(response, {});
  },

  // Aliases for GhanaianMobileMoneyInterface and GhanaSMSVerification components
  initiateMobileMoneyPayment: async (paymentData) => {
    return await paymentService.processMobileMoneyPayment(paymentData);
  },

  confirmMobileMoneyPayment: async ({ transactionId, pin, phoneNumber, provider = 'mtn' }) => {
    // Route to the correct provider confirmation endpoint
    const providerEndpoints = {
      mtn: '/payments/mtn-momo/confirm',
      vodafone: '/payments/vodafone-cash/confirm',
      airteltigo: '/payments/airteltigo-money/confirm',
    };
    const endpoint = providerEndpoints[provider] || providerEndpoints.mtn;
    const response = await api.post(endpoint, {
      transactionId,
      pin,
      phoneNumber,
    });
    return unwrapPaymentPayload(response, {});
  },

  sendSMSVerification: async ({ phoneNumber, purpose, amount }) => {
    const response = await api.post('/payments/sms-verification/send', {
      phoneNumber,
      purpose,
      amount,
    });
    return unwrapPaymentPayload(response, {});
  },

  verifySMSCode: async ({ verificationId, code }) => {
    const response = await api.post('/payments/sms-verification/verify', {
      verificationId,
      code,
    });
    return unwrapPaymentPayload(response, {});
  },
};

export default paymentService;
