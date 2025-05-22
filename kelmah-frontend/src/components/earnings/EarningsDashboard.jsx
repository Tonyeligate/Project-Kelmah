import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    AccountBalance,
    TrendingUp,
    History,
    Withdraw,
    Receipt
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const EarningsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [earnings, setEarnings] = useState({
        total: 0,
        available: 0,
        pending: 0,
        withdrawn: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [withdrawalDialog, setWithdrawalDialog] = useState(false);
    const [withdrawalData, setWithdrawalData] = useState({
        amount: '',
        method: '',
        accountDetails: {}
    });
    const [paymentMethods] = useState([
        { id: 'mobile_money', name: 'Mobile Money', provider: 'MTN' },
        { id: 'bank_transfer', name: 'Bank Transfer', provider: 'Ghana Banks' },
        { id: 'cash', name: 'Cash Pickup', provider: 'Local Partners' }
    ]);

    useEffect(() => {
        fetchEarningsData();
    }, []);

    const fetchEarningsData = async () => {
        try {
            const [earningsResponse, transactionsResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/worker/earnings`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                axios.get(`${BACKEND_URL}/worker/transactions`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            setEarnings(earningsResponse.data.data);
            setTransactions(transactionsResponse.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load earnings data. Please try again later.');
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleWithdrawalSubmit = async () => {
        try {
            await axios.post(`${BACKEND_URL}/worker/withdraw`, withdrawalData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setWithdrawalDialog(false);
            fetchEarningsData();
        } catch (err) {
            setError('Failed to process withdrawal. Please try again.');
        }
    };

    const renderEarningsSummary = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Total Earnings</Typography>
                        </Box>
                        <Typography variant="h4">GHS {earnings.total.toFixed(2)}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h6">Available</Typography>
                        </Box>
                        <Typography variant="h4">GHS {earnings.available.toFixed(2)}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <History sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="h6">Pending</Typography>
                        </Box>
                        <Typography variant="h4">GHS {earnings.pending.toFixed(2)}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Withdraw sx={{ mr: 1, color: 'info.main' }} />
                            <Typography variant="h6">Withdrawn</Typography>
                        </Box>
                        <Typography variant="h4">GHS {earnings.withdrawn.toFixed(2)}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderTransactionHistory = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell>
                                {new Date(transaction.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{transaction.type}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell align="right">
                                GHS {transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <Typography
                                    color={
                                        transaction.status === 'completed'
                                            ? 'success.main'
                                            : transaction.status === 'pending'
                                            ? 'warning.main'
                                            : 'error.main'
                                    }
                                >
                                    {transaction.status}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderWithdrawalForm = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Request Withdrawal
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={withdrawalData.amount}
                            onChange={(e) =>
                                setWithdrawalData(prev => ({
                                    ...prev,
                                    amount: e.target.value
                                }))
                            }
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Withdrawal Method</InputLabel>
                            <Select
                                value={withdrawalData.method}
                                label="Withdrawal Method"
                                onChange={(e) =>
                                    setWithdrawalData(prev => ({
                                        ...prev,
                                        method: e.target.value
                                    }))
                                }
                            >
                                {paymentMethods.map(method => (
                                    <MenuItem key={method.id} value={method.id}>
                                        {method.name} ({method.provider})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setWithdrawalDialog(true)}
                            disabled={!withdrawalData.amount || !withdrawalData.method}
                        >
                            Request Withdrawal
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {renderEarningsSummary()}

            <Box sx={{ mt: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab icon={<Receipt />} label="Transaction History" />
                    <Tab icon={<Withdraw />} label="Withdrawals" />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                    {activeTab === 0 && renderTransactionHistory()}
                    {activeTab === 1 && renderWithdrawalForm()}
                </Box>
            </Box>

            {/* Withdrawal Confirmation Dialog */}
            <Dialog open={withdrawalDialog} onClose={() => setWithdrawalDialog(false)}>
                <DialogTitle>Confirm Withdrawal</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to withdraw GHS {withdrawalData.amount} using{' '}
                        {paymentMethods.find(m => m.id === withdrawalData.method)?.name}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWithdrawalDialog(false)}>Cancel</Button>
                    <Button onClick={handleWithdrawalSubmit} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EarningsDashboard; 