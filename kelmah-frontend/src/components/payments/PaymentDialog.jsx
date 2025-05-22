import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    TextField,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import api from '../../api/axios';
import PaymentService from '../../services/PaymentService';

const steps = ['Select Payment Method', 'Enter Payment Details', 'Review & Confirm'];

const PaymentDialog = ({
    open,
    onClose,
    type = 'payment', // 'payment' or 'escrow'
    amount,
    contractId,
    onSuccess,
    currency = 'USD'
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
    });
    const [fees, setFees] = useState(null);

    useEffect(() => {
        if (open) {
            fetchPaymentMethods();
            calculateFees();
        }
    }, [open, amount]);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await PaymentService.getPaymentMethods();
            setPaymentMethods(response);
            if (response.length > 0) {
                setSelectedMethod(response[0].id);
            }
            setError(null);
        } catch (err) {
            setError(err.message);
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateFees = async () => {
        try {
            const response = await PaymentService.getPaymentFees(amount, type);
            setFees(response.data);
        } catch (err) {
            setError('Failed to calculate fees');
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!selectedMethod && !formData.cardNumber) {
            setError('Please select a payment method or enter card details');
            return;
        }

        try {
            setProcessing(true);
            if (selectedMethod) {
                // Use saved payment method
                await PaymentService.processPayment({
                    amount,
                    currency,
                    paymentMethodId: selectedMethod
                });
            } else {
                // Use new card details
                await PaymentService.processPayment({
                    amount,
                    currency,
                    cardDetails: formData
                });
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatAmount = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            label="Payment Method"
                        >
                            <MenuItem value="">Use New Card</MenuItem>
                            {paymentMethods.map((method) => (
                                <MenuItem key={method.id} value={method.id}>
                                    {method.type} - {method.last4}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Payment Details
                        </Typography>
                        <TextField
                            fullWidth
                            label="Card Number"
                            value={paymentDetails.cardNumber || ''}
                            onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
                            margin="normal"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Expiry Date"
                                value={paymentDetails.expiryDate || ''}
                                onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="CVV"
                                value={paymentDetails.cvv || ''}
                                onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
                                margin="normal"
                            />
                        </Box>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Payment Summary
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Amount: ${amount}</Typography>
                            {fees && (
                                <>
                                    <Typography>Platform Fee: ${fees.platformFee}</Typography>
                                    <Typography>Processing Fee: ${fees.processingFee}</Typography>
                                    <Typography variant="h6">
                                        Total: ${fees.total}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            By proceeding, you agree to our terms of service and payment processing policies.
                        </Typography>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {type === 'escrow' ? 'Fund Escrow' : 'Make Payment'}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                {renderStepContent(activeStep)}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {activeStep > 0 && (
                    <Button onClick={() => setActiveStep(prev => prev - 1)}>
                        Back
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={() => setActiveStep(prev => prev + 1)}
                        disabled={loading}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Confirm Payment'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDialog; 