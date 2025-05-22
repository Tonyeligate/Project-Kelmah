import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Visibility,
    CheckCircle,
    Cancel,
    AttachFile
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../api/axios';

function PaymentVerification() {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [verificationNote, setVerificationNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/payments/pending');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (approved) => {
        try {
            await api.post(`/api/admin/payments/${selectedTransaction.id}/verify`, {
                approved,
                notes: verificationNote
            });
            
            setDialogOpen(false);
            setVerificationNote('');
            fetchTransactions();
        } catch (error) {
            console.error('Error verifying payment:', error);
            setError('Failed to verify payment');
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending':
                return <Chip label="Pending" color="warning" size="small" />;
            case 'completed':
                return <Chip label="Completed" color="success" size="small" />;
            case 'failed':
                return <Chip label="Failed" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Payment Verification
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Payment Method</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{transaction.reference_number}</TableCell>
                                        <TableCell>
                                            {format(new Date(transaction.created_at), 'PPp')}
                                        </TableCell>
                                        <TableCell>
                                            KES {transaction.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.payment_method} ({transaction.provider})
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(transaction.status)}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    setSelectedTransaction(transaction);
                                                    setDialogOpen(true);
                                                }}
                                                size="small"
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTransaction && (
                    <>
                        <DialogTitle>
                            Verify Payment - {selectedTransaction.reference_number}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Payment Details
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Typography>Amount:</Typography>
                                    <Typography>KES {selectedTransaction.amount.toLocaleString()}</Typography>
                                    
                                    <Typography>Payment Method:</Typography>
                                    <Typography>{selectedTransaction.payment_method}</Typography>
                                    
                                    <Typography>Provider:</Typography>
                                    <Typography>{selectedTransaction.provider}</Typography>
                                    
                                    <Typography>Date:</Typography>
                                    <Typography>
                                        {format(new Date(selectedTransaction.created_at), 'PPp')}
                                    </Typography>
                                </Box>
                            </Box>

                            {selectedTransaction.proof_of_payment && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Proof of Payment
                                    </Typography>
                                    <Button
                                        startIcon={<AttachFile />}
                                        href={`/uploads/${selectedTransaction.proof_of_payment}`}
                                        target="_blank"
                                    >
                                        View Attachment
                                    </Button>
                                </Box>
                            )}

                            <TextField
                                fullWidth
                                label="Verification Notes"
                                multiline
                                rows={3}
                                value={verificationNote}
                                onChange={(e) => setVerificationNote(e.target.value)}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                startIcon={<Cancel />}
                                color="error"
                                onClick={() => handleVerify(false)}
                            >
                                Reject
                            </Button>
                            <Button
                                startIcon={<CheckCircle />}
                                color="success"
                                variant="contained"
                                onClick={() => handleVerify(true)}
                            >
                                Approve
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
}

export default PaymentVerification; 