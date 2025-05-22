import React, { useState } from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Typography,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import api from '../../api/axios';

const PAYMENT_PROVIDERS = {
    bank: [
        { id: 'equity', name: 'Equity Bank' },
        { id: 'kcb', name: 'KCB Bank' },
        { id: 'cooperative', name: 'Cooperative Bank' },
        // Add more banks as needed
    ],
    mobile_money: [
        { id: 'mpesa', name: 'M-PESA' },
        { id: 'airtel', name: 'Airtel Money' },
        // Add more mobile money providers as needed
    ]
};

function PaymentMethodForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        type: '',
        provider: '',
        account_number: '',
        account_name: '',
        is_default: false
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset provider when type changes
        if (name === 'type') {
            setFormData(prev => ({
                ...prev,
                provider: '',
                account_number: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/api/payments/methods', formData);
            onSuccess();
            // Reset form
            setFormData({
                type: '',
                provider: '',
                account_number: '',
                account_name: '',
                is_default: false
            });
        } catch (error) {
            setError(error.response?.data?.message || 'Error adding payment method');
        } finally {
            setLoading(false);
        }
    };

    const getAccountNumberLabel = () => {
        if (formData.type === 'bank') return 'Account Number';
        if (formData.type === 'mobile_money') return 'Phone Number';
        return 'Account Number';
    };

    const getAccountNumberHelperText = () => {
        if (formData.type === 'mobile_money') {
            return 'Enter phone number in format: 254XXXXXXXXX';
        }
        return '';
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Type</InputLabel>
                <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                >
                    <MenuItem value="bank">Bank Account</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                </Select>
            </FormControl>

            {formData.type && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Provider</InputLabel>
                    <Select
                        name="provider"
                        value={formData.provider}
                        onChange={handleChange}
                        required
                    >
                        {PAYMENT_PROVIDERS[formData.type].map(provider => (
                            <MenuItem key={provider.id} value={provider.id}>
                                {provider.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <TextField
                fullWidth
                label={getAccountNumberLabel()}
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                helperText={getAccountNumberHelperText()}
                required
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                label="Account Name"
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={formData.is_default}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            is_default: e.target.checked
                        }))}
                        name="is_default"
                    />
                }
                label="Set as default payment method"
                sx={{ mb: 2 }}
            />

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
            >
                {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
        </Box>
    );
}

export default PaymentMethodForm; 