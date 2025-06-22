import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import paymentsApi from '../../../api/services/paymentsApi';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useNotifications } from '../../notifications/contexts/NotificationContext';

const PaymentContext = createContext(null);

const mockTransactions = [
  { id: '1', type: 'deposit', amount: 500.00, status: 'completed', date: '2024-07-20T10:00:00Z', title: 'Job Payment: Kitchen Remodel' },
  { id: '2', type: 'withdrawal', amount: 150.00, status: 'completed', date: '2024-07-19T15:30:00Z', title: 'Withdrawal to Bank Account' },
  { id: '3', type: 'deposit', amount: 75.50, status: 'completed', date: '2024-07-18T11:45:00Z', title: 'Job Payment: Bookshelf Assembly' },
  { id: '4', type: 'withdrawal', amount: 200.00, status: 'pending', date: '2024-07-21T09:00:00Z', title: 'Withdrawal to Mobile Money' },
  { id: '5', type: 'deposit', amount: 1200.00, status: 'completed', date: '2024-07-15T18:00:00Z', title: 'Job Payment: Full-Stack Development' },
];

const mockEscrowsData = [
    { id: 'e1', contractId: 'c1', title: 'Kitchen Renovation Project', otherParty: 'Jane Doe', amount: 1500, status: 'Funded' },
    { id: 'e2', contractId: 'c2', title: 'Website Development', otherParty: 'John Smith', amount: 800, status: 'Pending Release' },
    { id: 'e3', contractId: 'c3', title: 'Garden Landscaping', otherParty: 'Emily White', amount: 550, status: 'Funded' },
];

const mockBillsData = [
    { id: 'b1', title: 'Monthly Subscription', amount: 25.00, dueDate: '2024-08-01', status: 'unpaid' },
    { id: 'b2', title: 'Service Fee - Project X', amount: 150.00, dueDate: '2024-07-25', status: 'paid' },
    { id: 'b3', title: 'Platform Fee', amount: 12.50, dueDate: '2024-07-20', status: 'overdue' },
    { id: 'b4', title: 'Monthly Subscription', amount: 25.00, dueDate: '2024-07-01', status: 'paid' },
];

// Mock payment methods for initial display in deposit/withdraw dialogs
const mockMethodsData = [
  { id: '1', type: 'card', name: 'Visa Card', cardNumber: '•••• 4242', expiryDate: '05/25', isDefault: true },
  { id: '2', type: 'card', name: 'Mastercard', cardNumber: '•••• 5678', expiryDate: '03/24', isDefault: false },
  { id: '3', type: 'mobile', name: 'MTN Mobile Money', phoneNumber: '+233789012345', isDefault: false },
  { id: '4', type: 'bank', name: 'Ghana Commercial Bank', accountNumber: '•••• 3456', isDefault: false },
];

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

        const useMockData = import.meta.env.DEV;

        if (useMockData) {
            console.log("Using mock payment data.");
            setTimeout(() => {
                setWalletBalance(2850.75);
                setPaymentMethods(mockMethodsData);
                setTransactions(mockTransactions);
                setEscrows(mockEscrowsData);
                setBills(mockBillsData);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const [walletRes, methodsRes, transactionsRes, escrowsRes, billsRes] = await Promise.all([
                paymentsApi.getWallet(),
                paymentsApi.getPaymentMethods(),
                paymentsApi.getTransactionHistory(),
                paymentsApi.getEscrows(),
                paymentsApi.getBills()
            ]);
            setWalletBalance(walletRes.balance);
            setPaymentMethods(methodsRes);
            setTransactions(transactionsRes.transactions || transactionsRes);
            setEscrows(escrowsRes || []);
            setBills(billsRes);
        } catch (err) {
            console.error("Failed to fetch payment data:", err);
            setError("Could not load payment information. Please try again later.");
            showToast("Failed to load payment information.", "error");
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addFunds = useCallback(async (amount, paymentMethodId) => {
        setLoading(true);
        try {
            // Create a deposit transaction
            await paymentsApi.createTransaction({
                amount,
                type: 'deposit',
                currency: 'USD',
                paymentMethodId
            });
            showToast(`$${amount.toFixed(2)} deposited successfully.`, "success");
            // Refresh wallet data
            await fetchData();
        } catch (err) {
            console.error('Deposit failed:', err);
            showToast("Failed to deposit funds.", "error");
        } finally {
            setLoading(false);
        }
    }, [fetchData, showToast]);

    const withdrawFunds = useCallback(async (amount, paymentMethodId) => {
        if (amount > walletBalance) {
            showToast("Insufficient funds for withdrawal.", "error");
            return;
        }
        setLoading(true);
        try {
            // Create a withdrawal transaction
            await paymentsApi.createTransaction({
                amount,
                type: 'withdrawal',
                currency: 'USD',
                paymentMethodId
            });
            showToast("Withdrawal request submitted.", "info");
            // Refresh wallet data
            await fetchData();
        } catch (err) {
            console.error('Withdrawal failed:', err);
            showToast("Failed to process withdrawal.", "error");
        } finally {
            setLoading(false);
        }
    }, [walletBalance, fetchData, showToast]);

    // Fetch transactions with optional filters
    const fetchTransactions = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const data = await paymentsApi.getTransactionHistory(params);
            setTransactions(data.transactions || data);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            showToast('Failed to load transactions.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const addPaymentMethod = useCallback(async (methodData) => {
        showToast("Mock: Payment method added successfully.", "success");
    }, [showToast]);

    const payBill = useCallback(async (billId) => {
        setActionLoading(billId);
        try {
            await paymentsApi.payBill(billId);
            showToast("Bill paid successfully!", "success");
            // Refresh bills data
            await fetchData();
        } catch (err) {
            console.error('Failed to pay bill:', err);
            showToast("Failed to pay bill.", "error");
        } finally {
            setActionLoading(null);
        }
    }, [fetchData, showToast]);

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
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    );
};

export const usePayments = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayments must be used within a PaymentProvider');
    }
    return context;
}; 