import axios from '../../common/services/axios';
import { API_BASE_URL } from '../../../config/constants';

return { data: [] };
  },

  getPaymentMethods: async () => {
    await paymentService._simulateDelay();
    return MOCK_PAYMENT_METHODS;
  },

  getTransactionHistory: async () => {
    await paymentService._simulateDelay();
    return MOCK_TRANSACTIONS;
  },

  getEscrowDetails: async () => {
    await paymentService._simulateDelay();
    return MOCK_ESCROWS;
  },

  addPaymentMethod: async (methodData) => {
    await paymentService._simulateDelay();
    const newMethod = {
      id: `pm_${Date.now()}`,
      type: 'credit',
      cardType: methodData.cardNumber.startsWith('4') ? 'visa' : 'mastercard',
      cardNumber: `•••• ${methodData.cardNumber.slice(-4)}`,
      expiryDate: `${methodData.expiryMonth}/${methodData.expiryYear.slice(-2)}`,
      isDefault: false,
    };
    MOCK_PAYMENT_METHODS.push(newMethod);
    return newMethod;
  },

  withdrawFunds: async (amount, methodId) => {
    await paymentService._simulateDelay(1000);
    const newTransaction = {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      status: 'processing',
      type: 'sent',
      description: `Withdrawal to ${MOCK_PAYMENT_METHODS.find((p) => p.id === methodId)?.cardType || 'card'}`,
      to: `•••• ${MOCK_PAYMENT_METHODS.find((p) => p.id === methodId)?.cardNumber.slice(-4)}`,
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    // This would be handled by the backend
    setTimeout(() => {
      const completedTx = MOCK_TRANSACTIONS.find(
        (t) => t.id === newTransaction.id,
      );
      if (completedTx) completedTx.status = 'completed';
    }, 5000);
    return { success: true, transaction: newTransaction };
  },

  addFunds: async (amount, methodId) => {
    await paymentService._simulateDelay(1000);
    const newTransaction = {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      status: 'completed',
      type: 'received',
      description: 'Funds added to wallet',
      from: `Card •••• ${MOCK_PAYMENT_METHODS.find((p) => p.id === methodId)?.cardNumber.slice(-4)}`,
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    return { success: true, transaction: newTransaction };
  },
};

export default paymentService;
