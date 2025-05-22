import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert
} from '@mui/material';
import api from '../../api/axios';

const DISPUTE_REASONS = [
    'Payment not received',
    'Incorrect amount',
    'Service not delivered',
    'Quality issues',
    'Other'
];

function DisputeDialog({ open, onClose, transaction }) {
    const [formData, setFormData] = useState({
        reason: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/api/disputes', {
                transaction_id: transaction.id,
                ...formData
            });
            onClose('success');
        } catch (error) {
            setError(error.response?.data?.message || 'Error creating dispute');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Raise Payment Dispute</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Transaction Details
                        </Typography>
                        <Typography variant="body2">
                            Reference: {transaction?.reference_number}
                        </Typography>
                        <Typography variant="body2">
                            Amount: KES {transaction?.amount?.toLocaleString()}
                        </Typography>
                    </Box>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Reason for Dispute</InputLabel>
                        <Select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                        >
                            {DISPUTE_REASONS.map(reason => (
                                <MenuItem key={reason} value={reason}>
                                    {reason}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        helperText="Please provide detailed information about the dispute"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Dispute'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default DisputeDialog; 