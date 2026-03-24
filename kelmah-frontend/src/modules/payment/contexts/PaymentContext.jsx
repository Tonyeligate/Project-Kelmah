import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import paymentService from '../services/paymentService';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import {
  createFeatureLogger,
  devError,
} from '';

const paymentsLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_PAYMENTS',
  level: 'log',
});

const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletMissing, setWalletMissing] = useState(false);
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
    paymentsLog('Fetching real payment data from API...');

    try {
      const results = await Promise.allSettled([
        paymentService.getWallet(),
        paymentService.getPaymentMethods(),
        paymentService.getTransactionHistory(),
        paymentService.getEscrows(),
        paymentService.getBills(),
      ]);

      const [walletRes, methodsRes, transactionsRes, escrowsRes, billsRes] =
        results;

      // Detect if payment service is completely unavailable (all 502/503/504)
      const serverErrorCodes = [502, 503, 504];
      const allDown = results.every(
        (r) =>
          r.status === 'rejected' &&
          serverErrorCodes.includes(r.reason?.response?.status)
      );
      if (allDown) {
        setServiceUnavailable(true);
        setLoading(false);
        return;
      }
      setServiceUnavailable(false);

      // Wallet (404 -> preserve missing-wallet semantics instead of masking as a real zero)
      if (walletRes.status === 'fulfilled') {
        // Normalize: API may return a number, or {total, available, pending}
        const bal = walletRes.value?.balance ?? walletRes.value ?? 0;
        setWalletMissing(false);
        setWalletBalance(typeof bal === 'number' ? bal : (bal?.available ?? bal?.total ?? 0));
      } else if (walletRes.reason?.response?.status === 404) {
        setWalletMissing(true);
        setWalletBalance(0);
      } else {
        setWalletMissing(false);
      }

      // Methods
      if (methodsRes.status === 'fulfilled') {
        setPaymentMethods(methodsRes.value || []);
      }

      // Transactions (404 -> empty)
      // getTransactionHistory now returns { data: [...], pagination: {...} }
      if (transactionsRes.status === 'fulfilled') {
        const tr = transactionsRes.value;
        const tx = Array.isArray(tr) ? tr : tr?.data || tr?.transactions || [];
        setTransactions(tx);
      } else if (transactionsRes.reason?.response?.status === 404) {
        setTransactions([]);
      }

      // Escrows (501/404 -> empty)
      // getEscrows already returns a normalised array — guard anyway
      if (escrowsRes.status === 'fulfilled') {
        const ev = escrowsRes.value;
        setEscrows(Array.isArray(ev) ? ev : []);
      } else if ([404, 501].includes(escrowsRes.reason?.response?.status)) {
        setEscrows([]);
      }

      // Bills
      if (billsRes.status === 'fulfilled') {
        const payload = billsRes.value;
        const normalized = Array.isArray(payload)
          ? payload
          : payload?.bills && Array.isArray(payload.bills)
            ? payload.bills
            : payload?.data && Array.isArray(payload.data)
              ? payload.data
              : [];
        setBills(normalized);
      }

      setError(null);
    } catch (err) {
      devError('Failed to fetch payment data:', err);
      setError('Could not load payment information. Please try again later.');
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
          currency: 'GHS',
          paymentMethodId,
        });
        showToast(`GH₵${amount.toFixed(2)} deposited successfully.`, 'success');
        // Refresh wallet data
        await fetchData();
        return true;
      } catch (err) {
        devError('Deposit failed:', err);
        showToast('Failed to deposit funds.', 'error');
        return false;
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
        return false;
      }
      setLoading(true);
      try {
        // Create a withdrawal transaction
        await paymentService.createTransaction({
          amount,
          type: 'withdrawal',
          currency: 'GHS',
          paymentMethodId,
        });
        showToast('Withdrawal request submitted.', 'info');
        // Refresh wallet data
        await fetchData();
        return true;
      } catch (err) {
        devError('Withdrawal failed:', err);
        showToast('Failed to process withdrawal.', 'error');
        return false;
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
        // getTransactionHistory returns { data: [...], pagination: {...} } or plain array
        const transactionsData = Array.isArray(data)
          ? data
          : data?.data || data?.transactions || [];
        setTransactions(transactionsData);
      } catch (err) {
        devError('Failed to fetch transactions:', err);
        showToast('Failed to load transactions.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const addPaymentMethod = useCallback(
    async (methodData) => {
      setLoading(true);
      try {
        await paymentService.addPaymentMethod(methodData);
        showToast('Payment method added successfully.', 'success');
        await fetchData();
      } catch (err) {
        devError('Failed to add payment method:', err);
        showToast('Failed to add payment method.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [fetchData, showToast],
  );

  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId) => {
      if (!paymentMethodId) return;
      setLoading(true);
      try {
        await paymentService.setDefaultPaymentMethod(paymentMethodId);
        showToast('Default payment method updated.', 'success');
        await fetchData();
      } catch (err) {
        devError('Failed to set default payment method:', err);
        showToast('Failed to set default payment method.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [fetchData, showToast],
  );

  const deletePaymentMethod = useCallback(
    async (paymentMethodId) => {
      if (!paymentMethodId) return;
      setLoading(true);
      try {
        await paymentService.deletePaymentMethod(paymentMethodId);
        showToast('Payment method removed.', 'success');
        await fetchData();
      } catch (err) {
        devError('Failed to delete payment method:', err);
        showToast('Failed to delete payment method.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [fetchData, showToast],
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
        devError('Failed to pay bill:', err);
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
    serviceUnavailable,
    walletBalance,
    walletMissing,
    paymentMethods,
    transactions,
    escrows,
    bills,
    addFunds,
    withdrawFunds,
    addPaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
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

