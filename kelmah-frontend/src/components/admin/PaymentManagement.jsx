import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Visibility,
    Receipt,
    Warning
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function PaymentManagement() {
    const { token } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        paymentMethod: '',
        search: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchPayments();
    }, [page, rowsPerPage, filters]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                'http://localhost:3000/api/admin/payments',
                {
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        ...filters
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setPayments(response.data.payments);
            setError(null);
        } catch (err) {
            setError('Failed to fetch payments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setOpenDialog(true);
    };

    const handleGenerateReceipt = async (paymentId) => {
        try {
            const response = await axios.get(
                `http://localhost:3000/api/admin/payments/${paymentId}/receipt`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to generate receipt');
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Payment Management
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search payments..."
                            value={filters.search}
                            onChange={(e) => setFilters({
                                ...filters,
                                search: e.target.value
                            })}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({
                                    ...filters,
                                    status: e.target.value
                                })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={filters.paymentMethod}
                                label="Payment Method"
                                onChange={(e) => setFilters({
                                    ...filters,
                                    paymentMethod: e.target.value
                                })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="bank">Bank</MenuItem>
                                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({
                                ...filters,
                                startDate: e.target.value
                            })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Payer</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{payment.id}</TableCell>
                                <TableCell>{payment.amount} XOF</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={payment.payment_method}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={payment.status}
                                        color={getStatusColor(payment.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{payment.payer_name}</TableCell>
                                <TableCell>{payment.recipient_name}</TableCell>
                                <TableCell>
                                    {new Date(payment.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleViewDetails(payment)}
                                    >
                                        <Visibility />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleGenerateReceipt(payment.id)}
                                    >
                                        <Receipt />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={payments.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Payment Details</DialogTitle>
                <DialogContent>
                    {selectedPayment && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Payment Details
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {/* Add your payment details here */}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PaymentManagement; 