/**
 * Payment Service
 * Handles all payment-related API calls
 */

import { authServiceClient } from '../../common/services/axios';

// Mock data for development
const MOCK_PAYMENT_METHODS = [
  {
    id: 'pm_1',
    type: 'credit',
    cardType: 'visa',
    cardNumber: '•••• 4242',
    expiryDate: '12/25',
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: 'debit',
    cardType: 'mastercard',
    cardNumber: '•••• 5555',
    expiryDate: '08/26',
    isDefault: false,
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'txn_1',
    date: new Date().toISOString(),
    amount: 250.00,
    status: 'completed',
    type: 'received',
    description: 'Payment for Kitchen Renovation',
    from: 'John Smith',
  },
  {
    id: 'txn_2',
    date: new Date(Date.now() - 86400000).toISOString(),
    amount: 50.00,
    status: 'completed',
    type: 'sent',
    description: 'Withdrawal to bank account',
    to: 'Bank •••• 1234',
  },
];

const MOCK_ESCROWS = [
  {
    id: 'esc_1',
    jobId: 'job_1',
    jobTitle: 'Kitchen Renovation',
    amount: 500.00,
    status: 'active',
    releaseDate: null,
  },
];

const MOCK_BILLS = [
  {
    id: 'bill_1',
    title: 'Platform Fee',
    amount: 25.00,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'pending',
  },
];

const MOCK_WALLET = {
  balance: 750.50,
  currency: 'USD',
  pendingBalance: 100.00,
};

const paymentService = {
  // Simulate API delay for development
  _simulateDelay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

  // Wallet operations
  getWallet: async () => {
    await paymentService._simulateDelay();
    return MOCK_WALLET;
  },

  // Payment methods
  getPaymentMethods: async () => {
    await paymentService._simulateDelay();
    return MOCK_PAYMENT_METHODS;
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

  setDefaultPaymentMethod: async (methodId) => {
    await paymentService._simulateDelay();
    MOCK_PAYMENT_METHODS.forEach(method => {
      method.isDefault = method.id === methodId;
    });
    return { success: true };
  },

  deletePaymentMethod: async (methodId) => {
    await paymentService._simulateDelay();
    const index = MOCK_PAYMENT_METHODS.findIndex(m => m.id === methodId);
    if (index > -1) {
      MOCK_PAYMENT_METHODS.splice(index, 1);
    }
    return { success: true };
  },

  // Transaction operations
  getTransactionHistory: async (params = {}) => {
    await paymentService._simulateDelay();
    return {
      data: MOCK_TRANSACTIONS,
      pagination: {
        page: 1,
        totalPages: 1,
        totalCount: MOCK_TRANSACTIONS.length,
      },
    };
  },

  createTransaction: async (transactionData) => {
    await paymentService._simulateDelay();
    const newTransaction = {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      ...transactionData,
      status: 'processing',
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    return newTransaction;
  },

  // Escrow operations
  getEscrows: async () => {
    await paymentService._simulateDelay();
    return MOCK_ESCROWS;
  },

  getEscrowDetails: async (escrowId) => {
    await paymentService._simulateDelay();
    return MOCK_ESCROWS.find(e => e.id === escrowId);
  },

  releaseEscrow: async (escrowId, releaseData) => {
    await paymentService._simulateDelay();
    const escrow = MOCK_ESCROWS.find(e => e.id === escrowId);
    if (escrow) {
      escrow.status = 'released';
      escrow.releaseDate = new Date().toISOString();
    }
    return { success: true };
  },

  // Bills operations
  getBills: async () => {
    await paymentService._simulateDelay();
    return MOCK_BILLS;
  },

  payBill: async (billId) => {
    await paymentService._simulateDelay();
    const bill = MOCK_BILLS.find(b => b.id === billId);
    if (bill) {
      bill.status = 'paid';
      bill.paidDate = new Date().toISOString();
    }
    return { success: true };
  },

  // Wallet fund operations
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
    
    // Simulate processing completion
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

  // Payment settings
  getPaymentSettings: async () => {
    await paymentService._simulateDelay();
    return {
      autoPayEnabled: true,
      defaultPaymentMethod: 'pm_1',
      currency: 'USD',
      notifications: {
        paymentReceived: true,
        paymentSent: true,
        lowBalance: true,
      },
    };
  },

  updatePaymentSettings: async (settings) => {
    await paymentService._simulateDelay();
    return { success: true, settings };
  },
};

export default paymentService;