import axios from '../../common/services/axios';
import { API_BASE_URL } from '../../../config/constants';

// Mock data for development
const MOCK_PAYMENT_METHODS = [
  { id: 'pm_1', type: 'credit', cardNumber: '•••• 4242', cardType: 'visa', expiryDate: '05/25', isDefault: true },
  { id: 'pm_2', type: 'debit', cardNumber: '•••• 5678', cardType: 'mastercard', expiryDate: '03/24', isDefault: false }
];

const MOCK_TRANSACTIONS = [
  { id: 'txn_1', date: '2023-10-26T10:00:00Z', amount: 500, status: 'completed', type: 'received', description: 'Milestone payment: Kitchen Design', from: 'John Smith', jobId: 'job-101' },
  { id: 'txn_2', date: '2023-10-24T14:30:00Z', amount: 200, status: 'completed', type: 'received', description: 'Milestone payment: Initial Inspection', from: 'Sarah Johnson', jobId: 'job-102' },
  { id: 'txn_3', date: '2023-10-22T09:00:00Z', amount: 1000, status: 'pending', type: 'received', description: 'Milestone payment: Materials Purchase', from: 'John Smith', jobId: 'job-101' },
  { id: 'txn_4', date: '2023-10-20T18:00:00Z', amount: 350, status: 'completed', type: 'sent', description: 'Withdrawal to bank account', to: 'Bank ****1234' },
];

const MOCK_ESCROWS = [
    { id: 'es_1', jobId: 'job-101', jobTitle: 'Kitchen Renovation', totalAmount: 2500, releasedAmount: 500, pendingAmount: 2000, status: 'active', hirer: { name: 'John Smith' } },
    { id: 'es_2', jobId: 'job-102', jobTitle: 'Electrical Wiring', totalAmount: 800, releasedAmount: 200, pendingAmount: 600, status: 'active', hirer: { name: 'Sarah Johnson' } },
];

const MOCK_WALLET_BALANCE = 1250.75;

const paymentService = {
  // Simulate API delay
  _simulateDelay: (ms = 500) => new Promise(res => setTimeout(res, ms)),

  getWalletBalance: async () => {
    await paymentService._simulateDelay();
    // In a real app: return await axios.get(`${API_BASE_URL}/payment/wallet`);
    return { balance: MOCK_WALLET_BALANCE };
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
      description: `Withdrawal to ${MOCK_PAYMENT_METHODS.find(p => p.id === methodId)?.cardType || 'card'}`,
      to: `•••• ${MOCK_PAYMENT_METHODS.find(p => p.id === methodId)?.cardNumber.slice(-4)}`,
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    // This would be handled by the backend
    setTimeout(() => {
        const completedTx = MOCK_TRANSACTIONS.find(t => t.id === newTransaction.id);
        if(completedTx) completedTx.status = 'completed';
    }, 5000)
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
      from: `Card •••• ${MOCK_PAYMENT_METHODS.find(p => p.id === methodId)?.cardNumber.slice(-4)}`,
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    return { success: true, transaction: newTransaction };
  },
};

export default paymentService; 