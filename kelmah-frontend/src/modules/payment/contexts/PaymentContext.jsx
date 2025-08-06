import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import paymentService from '../services/paymentService';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [bills, setBills] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Always use real API data - no mock data fallbacks
    console.log('🔄 Fetching real payment data from API...');

    try {
      const [walletRes, methodsRes, transactionsRes, escrowsRes, billsRes] =
        await Promise.all([
                paymentService.getWallet(),
      paymentService.getPaymentMethods(),
      paymentService.getTransactionHistory(),
      paymentService.getEscrows(),
      paymentService.getBills(),
        ]);
      setWalletBalance(walletRes.balance);
      setPaymentMethods(methodsRes);
      setTransactions(transactionsRes.transactions || transactionsRes);
      setEscrows(escrowsRes || []);
      setBills(billsRes);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      setError('Could not load payment information. Please try again later.');
      showToast('Failed to load payment information.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addFunds = useCallback(
    async (amount, paymentMethodId) => {
      setLoading(true);
      try {
        // Create a deposit transaction
        await paymentService.createTransaction({
          amount,
          type: 'deposit',
          currency: "GHS",
          paymentMethodId,
        });
        showToast(`$${amount.toFixed(2)} deposited successfully.`, 'success');
        // Refresh wallet data
        await fetchData();
      } catch (err) {
        console.error('Deposit failed:', err);
        showToast('Failed to deposit funds.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [fetchData, showToast],
  );

  const withdrawFunds = useCallback(
    async (amount, paymentMethodId) => {
      if (amount > walletBalance) {
        showToast('Insufficient funds for withdrawal.', 'error');
        return;
      }
      setLoading(true);
      try {
        // Create a withdrawal transaction
        await paymentService.createTransaction({
          amount,
          type: 'withdrawal',
          currency: "GHS",
          paymentMethodId,
        });
        showToast('Withdrawal request submitted.', 'info');
        // Refresh wallet data
        await fetchData();
      } catch (err) {
        console.error('Withdrawal failed:', err);
        showToast('Failed to process withdrawal.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [walletBalance, fetchData, showToast],
  );

  // Fetch transactions with optional filters
  const fetchTransactions = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const data = await paymentService.getTransactionHistory(params);
        setTransactions(data.transactions || data);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        showToast('Failed to load transactions.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const addPaymentMethod = useCallback(
    async (methodData) => {
      showToast('Mock: Payment method added successfully.', 'success');
    },
    [showToast],
  );

  const payBill = useCallback(
    async (billId) => {
      setActionLoading(billId);
      try {
        await paymentService.payBill(billId);
        showToast('Bill paid successfully!', 'success');
        // Refresh bills data
        await fetchData();
      } catch (err) {
        console.error('Failed to pay bill:', err);
        showToast('Failed to pay bill.', 'error');
      } finally {
        setActionLoading(null);
      }
    },
    [fetchData, showToast],
  );

  const value = {
    loading,
    actionLoading,
    error,
    walletBalance,
    paymentMethods,
    transactions,
    escrows,
    bills,
    addFunds,
    withdrawFunds,
    addPaymentMethod,
    payBill,
    refresh: fetchData,
    fetchTransactions,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};
