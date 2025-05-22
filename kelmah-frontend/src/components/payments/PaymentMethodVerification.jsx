import React, { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Paper
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import api from '../../api/axios';

const steps = ['Select Method', 'Enter Details', 'Verify'];

const PAYMENT_METHODS = {
    bank: [
        { id: 'equity', name: 'Equity Bank' },
        { id: 'kcb', name: 'KCB Bank' },
        { id: 'cooperative', name: 'Cooperative Bank' }
    ],
    mobile_money: [
        { id: 'mpesa', name: 'M-PESA' },
        { id: 'airtel', name: 'Airtel Money' }
    ]
};

function PaymentMethodVerification({ onSuccess }) {
    const [activeStep, setActiveStep] = useState(0);
    const [type, setType] = useState('');
    const [provider, setProvider] = useState('');
    const [accountDetails, setAccountDetails] = useState({
        account_number: '',
        account_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);

    const handleNext = async () => {
        if (activeStep === 2) {
            await verifyAccount();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError(null);
    };

    const verifyAccount = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/api/payments/verify-method', {
                type,
                provider,
                ...accountDetails
            });

            setVerificationStatus('success');
            if (onSuccess) {
                onSuccess({
                    type,
                    provider,
                    ...accountDetails,
                    verified: true
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Verification failed');
            setVerificationStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <FormControl fullWidth>
                        <InputLabel>Payment Method Type</InputLabel>
                        <Select
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                setProvider('');
                            }}
                            required
                        >
                            <MenuItem value="bank">Bank Account</MenuItem>
                            <MenuItem value="mobile_money">Mobile Money</MenuItem>
                        </Select>
                    </FormControl>
                );

            case 1:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Provider</InputLabel>
                            <Select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                required
                            >
                                {PAYMENT_METHODS[type]?.map(provider => (
                                    <MenuItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label={type === 'bank' ? 'Account Number' : 'Phone Number'}
                            value={accountDetails.account_number}
                            onChange={(e) => setAccountDetails(prev => ({
                                ...prev,
                                account_number: e.target.value
                            }))}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Account Name"
                            value={accountDetails.account_name}
                            onChange={(e) => setAccountDetails(prev => ({
                                ...prev,
                                account_name: e.target.value
                            }))}
                            required
                        />
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        {loading ? (
                            <CircularProgress />
                        ) : verificationStatus ? (
                            <Box sx={{ mt: 2 }}>
                                {verificationStatus === 'success' ? (
                                    <>
                                        <CheckCircle color="success" sx={{ fontSize: 60 }} />
                                        <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                                            Verification Successful
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Error color="error" sx={{ fontSize: 60 }} />
                                        <Typography variant="h6" color="error" sx={{ mt: 2 }}>
                                            Verification Failed
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        ) : (
                            <Typography>
                                Click verify to confirm your payment method details
                            </Typography>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mt: 2, mb: 4 }}>
                {renderStepContent()}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {activeStep > 0 && (
                    <Button onClick={handleBack} disabled={loading}>
                        Back
                    </Button>
                )}
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                        loading ||
                        (activeStep === 0 && !type) ||
                        (activeStep === 1 && (!provider || !accountDetails.account_number || !accountDetails.account_name)) ||
                        (activeStep === 2 && verificationStatus === 'success')
                    }
                >
                    {activeStep === 2 ? 'Verify' : 'Next'}
                </Button>
            </Box>
        </Paper>
    );
}

export default PaymentMethodVerification; 