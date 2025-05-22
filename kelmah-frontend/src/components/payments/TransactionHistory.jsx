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
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
    Receipt as ReceiptIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [page, rowsPerPage, searchQuery]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {
                    page: page + 1,
                    limit: rowsPerPage,
                search: searchQuery
            };
            const response = await PaymentService.getTransactions(params);
            setTransactions(response.transactions);
            setError(null);
        } catch (err) {
            setError(err.message);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleMenuClick = (event, transaction) => {
        setAnchorEl(event.currentTarget);
        setSelectedTransaction(transaction);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTransaction(null);
    };

    const handleDownloadReceipt = async () => {
        try {
            const receipt = await PaymentService.getTransactionReceipt(selectedTransaction.id);
            const url = window.URL.createObjectURL(new Blob([receipt]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${selectedTransaction.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download receipt');
        }
        handleMenuClose();
    };

    const handleCancelTransaction = async () => {
        try {
            await PaymentService.cancelTransaction(selectedTransaction.id);
            fetchTransactions();
        } catch (err) {
            setError('Failed to cancel transaction');
        }
        handleMenuClose();
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'error';
            case 'cancelled':
                return 'default';
            default:
                return 'primary';
        }
    };

    const formatAmount = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
                <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Transaction History</Typography>
                <TextField
                    size="small"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
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
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>{formatAmount(transaction.amount, transaction.currency)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={transaction.status}
                                        color={getStatusColor(transaction.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{transaction.type}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, transaction)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={-1}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleDownloadReceipt}>
                    <DownloadIcon sx={{ mr: 1 }} /> Download Receipt
                </MenuItem>
                <MenuItem onClick={handleDownloadReceipt}>
                    <ReceiptIcon sx={{ mr: 1 }} /> View Receipt
                </MenuItem>
                {selectedTransaction?.status === 'pending' && (
                    <MenuItem onClick={handleCancelTransaction}>
                        <CancelIcon sx={{ mr: 1 }} /> Cancel Transaction
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};

export default TransactionHistory; 