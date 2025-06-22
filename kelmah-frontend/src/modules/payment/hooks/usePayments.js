import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import paymentService from '../services/paymentService';
import { setPayments, setLoading, setError } from '../../../store/slices/paymentsSlice';

export const usePayments = () => {
    const dispatch = useDispatch();
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const loadPaymentMethods = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const methods = await paymentService.getPaymentMethods();
            setPaymentMethods(methods);
            return methods;
        } catch (error) {
            dispatch(setError(error.message));
            return [];
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const addPaymentMethod = useCallback(async (methodData) => {
        try {
            dispatch(setLoading(true));
            const newMethod = await paymentService.addPaymentMethod(methodData);
            setPaymentMethods(prev => [...prev, newMethod]);
            return newMethod;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const removePaymentMethod = useCallback(async (methodId) => {
        try {
            dispatch(setLoading(true));
            await paymentService.removePaymentMethod(methodId);
            setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
            return true;
        } catch (error) {
            dispatch(setError(error.message));
            return false;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadPaymentHistory = useCallback(async (filters = {}) => {
        try {
            dispatch(setLoading(true));
            const payments = await paymentService.getPaymentHistory(filters);
            dispatch(setPayments(payments));
            return payments;
        } catch (error) {
            dispatch(setError(error.message));
            return [];
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadPaymentDetails = useCallback(async (paymentId) => {
        try {
            dispatch(setLoading(true));
            const payment = await paymentService.getPaymentDetails(paymentId);
            setSelectedPayment(payment);
            return payment;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const createPayment = useCallback(async (paymentData) => {
        try {
            dispatch(setLoading(true));
            const payment = await paymentService.createPayment(paymentData);
            dispatch(setPayments(prev => [...prev, payment]));
            return payment;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const createEscrowPayment = useCallback(async (escrowData) => {
        try {
            dispatch(setLoading(true));
            const escrow = await paymentService.createEscrowPayment(escrowData);
            return escrow;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const releaseEscrowPayment = useCallback(async (escrowId) => {
        try {
            dispatch(setLoading(true));
            const result = await paymentService.releaseEscrowPayment(escrowId);
            return result;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadWalletBalance = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const balance = await paymentService.getWalletBalance();
            setWalletBalance(balance);
            return balance;
        } catch (error) {
            dispatch(setError(error.message));
            return 0;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const withdrawFunds = useCallback(async (withdrawalData) => {
        try {
            dispatch(setLoading(true));
            const result = await paymentService.withdrawFunds(withdrawalData);
            await loadWalletBalance(); // Refresh balance after withdrawal
            return result;
        } catch (error) {
            dispatch(setError(error.message));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch, loadWalletBalance]);

    return {
        selectedPayment,
        walletBalance,
        paymentMethods,
        loadPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        loadPaymentHistory,
        loadPaymentDetails,
        createPayment,
        createEscrowPayment,
        releaseEscrowPayment,
        loadWalletBalance,
        withdrawFunds
    };
}; 