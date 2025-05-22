import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    CreditCard,
    Phone,
    Payment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const MOBILE_MONEY_PROVIDERS = [
    { value: 'MTN', label: 'MTN Mobile Money' },
    { value: 'ORANGE', label: 'Orange Money' },
    { value: 'MOOV', label: 'Moov Money' }
];

function PaymentForm({ amount, onSuccess, onCancel }) {
    const { user, token } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('bank');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        // Bank details
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        // Mobile Money details
        phoneNumber: '',
        provider: '',
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
        setError(null);
    };

    const validateForm = () => {
        if (paymentMethod === 'bank') {
            if (!formData.cardNumber || !formData.expiryMonth || 
                !formData.expiryYear || !formData.cvv) {
                setError('Please fill in all card details');
                return false;
            }
        } else {
            if (!formData.phoneNumber || !formData.provider) {
                setError('Please fill in all mobile money details');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            const paymentData = {
                amount,
                currency: 'XOF',
                email: user.email,
                fullName: user.username,
                ...(paymentMethod === 'bank' ? {
                    cardNumber: formData.cardNumber,
                    expiryMonth: formData.expiryMonth,
                    expiryYear: formData.expiryYear,
                    cvv: formData.cvv
                } : {
                    phoneNumber: formData.phoneNumber,
                    provider: formData.provider
                })
            };

            const response = await axios.post(
                `http://localhost:3000/api/payments/${paymentMethod}`,
                paymentData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Handle successful payment
            if (response.data.status === 'success') {
                onSuccess(response.data);
            } else {
                // Handle pending payment (especially for mobile money)
                setActiveStep(1);
                // Start polling for payment status
                pollPaymentStatus(response.data.reference);
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const pollPaymentStatus = async (reference) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(
                    `http://localhost:3000/api/payments/verify/${reference}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.status === 'success') {
                    clearInterval(pollInterval);
                    onSuccess(response.data);
                } else if (response.data.status === 'failed') {
                    clearInterval(pollInterval);
                    setError('Payment failed. Please try again.');
                    setActiveStep(0);
                }
            } catch (err) {
                console.error('Payment verification error:', err);
            }
        }, 5000); // Poll every 5 seconds
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                <Step>
                    <StepLabel>Payment Details</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Processing</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Complete</StepLabel>
                </Step>
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <FormLabel component="legend">Payment Method</FormLabel>
                    <RadioGroup
                        row
                        value={paymentMethod}
                        onChange={handlePaymentMethodChange}
                    >
                        <FormControlLabel
                            value="bank"
                            control={<Radio />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CreditCard sx={{ mr: 1 }} />
                                    Bank Card
                                </Box>
                            }
                        />
                        <FormControlLabel
                            value="mobile"
                            control={<Radio />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Phone sx={{ mr: 1 }} />
                                    Mobile Money
                                </Box>
                            }
                        />
                    </RadioGroup>
                </FormControl>

                {paymentMethod === 'bank' ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Card Number"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                inputProps={{ maxLength: 16 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Month"
                                name="expiryMonth"
                                value={formData.expiryMonth}
                                onChange={handleInputChange}
                                inputProps={{ maxLength: 2 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Year"
                                name="expiryYear"
                                value={formData.expiryYear}
                                onChange={handleInputChange}
                                inputProps={{ maxLength: 4 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="CVV"
                                name="cvv"
                                value={formData.cvv}
                                onChange={handleInputChange}
                                inputProps={{ maxLength: 3 }}
                            />
                        </Grid>
                    </Grid>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                inputProps={{ maxLength: 10 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <FormLabel id="provider-label">Provider</FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby="provider-label"
                                    name="provider"
                                    value={formData.provider}
                                    onChange={handleInputChange}
                                >
                                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                                        <FormControlLabel
                                            key={provider.value}
                                            value={provider.value}
                                            control={<Radio />}
                                            label={provider.label}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Pay'}
                </Button>
            </form>
        </Paper>
    );
}

export default PaymentForm; 