import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    Assignment,
    Warning,
    Update,
    ArrowUpward
} from '@mui/icons-material';
import api from '../../api/axios';

function BulkDisputeActions({ selectedDisputes, onActionComplete, admins }) {
    const [actionType, setActionType] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        assignedTo: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleActionClick = (type) => {
        setActionType(type);
        setDialogOpen(true);
        setError(null);
        setFormData({
            status: '',
            assignedTo: '',
            reason: ''
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const disputeIds = selectedDisputes.map(d => d.id);

            switch (actionType) {
                case 'status':
                    await api.post('/api/admin/disputes/bulk/status', {
                        disputeIds,
                        status: formData.status
                    });
                    break;

                case 'assign':
                    await api.post('/api/admin/disputes/bulk/assign', {
                        disputeIds,
                        assignedTo: formData.assignedTo
                    });
                    break;

                case 'escalate':
                    await api.post('/api/admin/disputes/bulk/escalate', {
                        disputeIds,
                        reason: formData.reason
                    });
                    break;

                default:
                    throw new Error('Invalid action type');
            }

            setDialogOpen(false);
            if (onActionComplete) {
                onActionComplete();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error performing bulk action');
        } finally {
            setLoading(false);
        }
    };

    const renderDialogContent = () => {
        switch (actionType) {
            case 'status':
                return (
                    <FormControl fullWidth>
                        <InputLabel>New Status</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                status: e.target.value
                            }))}
                            label="New Status"
                        >
                            <MenuItem value="investigating">Investigating</MenuItem>
                            <MenuItem value="resolved">Resolved</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                );

            case 'assign':
                return (
                    <FormControl fullWidth>
                        <InputLabel>Assign To</InputLabel>
                        <Select
                            value={formData.assignedTo}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                assignedTo: e.target.value
                            }))}
                            label="Assign To"
                        >
                            {admins.map(admin => (
                                <MenuItem key={admin.id} value={admin.id}>
                                    {admin.username}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            case 'escalate':
                return (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Escalation Reason"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reason: e.target.value
                        }))}
                        required
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                    {selectedDisputes.length} disputes selected
                </Typography>

                <Button
                    startIcon={<Update />}
                    onClick={() => handleActionClick('status')}
                    variant="outlined"
                    size="small"
                >
                    Update Status
                </Button>

                <Button
                    startIcon={<Assignment />}
                    onClick={() => handleActionClick('assign')}
                    variant="outlined"
                    size="small"
                >
                    Assign
                </Button>

                <Button
                    startIcon={<ArrowUpward />}
                    onClick={() => handleActionClick('escalate')}
                    variant="outlined"
                    size="small"
                    color="warning"
                >
                    Escalate
                </Button>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {actionType === 'status' && 'Update Status'}
                    {actionType === 'assign' && 'Assign Disputes'}
                    {actionType === 'escalate' && 'Escalate Disputes'}
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Selected Disputes:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {selectedDisputes.map(dispute => (
                                <Chip
                                    key={dispute.id}
                                    label={`#${dispute.id}`}
                                    size="small"
                                />
                            ))}
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button 
                        onClick={() => setDialogOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || (
                            (actionType === 'status' && !formData.status) ||
                            (actionType === 'assign' && !formData.assignedTo) ||
                            (actionType === 'escalate' && !formData.reason)
                        )}
                    >
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : (
                            'Confirm'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default BulkDisputeActions; 