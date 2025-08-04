import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Phone as MobileMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../auth/contexts/AuthContext';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PaymentOverview = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalTransactions: 0,
    platformFees: 0,
    payoutsPending: 0
  });

  const [paymentMethods, setPaymentMethods] = useState({
    mobileMoney: 0,
    bankTransfer: 0,
    creditCard: 0,
    cash: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [searchTerm, filterStatus, filterMethod, activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock payment data for demonstration
      const mockPayments = [
        {
          id: 'PAY001',
          amount: 500.00,
          currency: 'GHS',
          status: 'completed',
          method: 'mobile_money',
          methodDetails: 'MTN Mobile Money - *****1234',
          payerName: 'John Doe',
          payeeName: 'Alice Johnson',
          jobTitle: 'Website Development',
          transactionFee: 15.00,
          platformFee: 25.00,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          description: 'Payment for completed web development project'
        },
        {
          id: 'PAY002',
          amount: 300.00,
          currency: 'GHS',
          status: 'pending',
          method: 'bank_transfer',
          methodDetails: 'Ecobank Ghana - ****5678',
          payerName: 'Jane Smith',
          payeeName: 'Bob Wilson',
          jobTitle: 'Graphic Design',
          transactionFee: 10.00,
          platformFee: 15.00,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          description: 'Payment for graphic design services'
        },
        {
          id: 'PAY003',
          amount: 750.00,
          currency: 'GHS',
          status: 'failed',
          method: 'mobile_money',
          methodDetails: 'Vodafone Cash - *****9876',
          payerName: 'Mike Davis',
          payeeName: 'Carol Brown',
          jobTitle: 'Content Writing',
          transactionFee: 0.00,
          platformFee: 0.00,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          description: 'Failed payment - insufficient funds',
          failureReason: 'Insufficient balance in mobile money account'
        },
        {
          id: 'PAY004',
          amount: 1200.00,
          currency: 'GHS',
          status: 'in_escrow',
          method: 'credit_card',
          methodDetails: 'Visa ending in 4321',
          payerName: 'Sarah Johnson',
          payeeName: 'David Lee',
          jobTitle: 'Mobile App Development',
          transactionFee: 36.00,
          platformFee: 60.00,
          createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
          description: 'Payment held in escrow pending project completion'
        }
      ];

      // Filter based on active tab and filters
      let filteredPayments = mockPayments;
      
      if (activeTab === 0) { // All
        filteredPayments = mockPayments;
      } else if (activeTab === 1) { // Pending
        filteredPayments = mockPayments.filter(p => p.status === 'pending' || p.status === 'in_escrow');
      } else if (activeTab === 2) { // Failed
        filteredPayments = mockPayments.filter(p => p.status === 'failed');
      }

      if (searchTerm) {
        filteredPayments = filteredPayments.filter(
          payment => 
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterStatus !== 'all') {
        filteredPayments = filteredPayments.filter(
          payment => payment.status === filterStatus
        );
      }

      if (filterMethod !== 'all') {
        filteredPayments = filteredPayments.filter(
          payment => payment.method === filterMethod
        );
      }

      setPayments(filteredPayments);

      // Calculate analytics
      const completed = mockPayments.filter(p => p.status === 'completed');
      const pending = mockPayments.filter(p => p.status === 'pending' || p.status === 'in_escrow');
      const failed = mockPayments.filter(p => p.status === 'failed');

      const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
      const platformFeesTotal = completed.reduce((sum, p) => sum + p.platformFee, 0);

      setAnalytics({
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.8, // Mock monthly revenue
        pendingPayments: pending.length,
        completedPayments: completed.length,
        failedPayments: failed.length,
        totalTransactions: mockPayments.length,
        platformFees: platformFeesTotal,
        payoutsPending: 3 // Mock pending payouts
      });

      // Calculate payment method distribution
      setPaymentMethods({
        mobileMoney: mockPayments.filter(p => p.method === 'mobile_money').length,
        bankTransfer: mockPayments.filter(p => p.method === 'bank_transfer').length,
        creditCard: mockPayments.filter(p => p.method === 'credit_card').length,
        cash: mockPayments.filter(p => p.method === 'cash').length
      });

    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in_escrow': return 'info';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'mobile_money': return <MobileMoneyIcon />;
      case 'bank_transfer': return <BankIcon />;
      case 'credit_card': return <CardIcon />;
      case 'cash': return <MoneyIcon />;
      default: return <MoneyIcon />;
    }
  };

  const formatCurrency = (amount, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payment Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPayments}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Financial Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(analytics.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" color="success.main">
                      +15% this month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Platform Fees
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(analytics.platformFees)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" color="success.main">
                      +8% this month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Pending Payments
                  </Typography>
                  <Typography variant="h4">
                    {analytics.pendingPayments}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      Requires attention
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Transactions
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalTransactions}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {analytics.completedPayments} completed
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <CardIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Methods Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Payment Methods Distribution" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <MobileMoneyIcon color="primary" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {paymentMethods.mobileMoney}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Mobile Money
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(paymentMethods.mobileMoney / analytics.totalTransactions) * 100}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <BankIcon color="success" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {paymentMethods.bankTransfer}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Bank Transfer
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(paymentMethods.bankTransfer / analytics.totalTransactions) * 100}
                      color="success"
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <CardIcon color="warning" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {paymentMethods.creditCard}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Credit Card
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(paymentMethods.creditCard / analytics.totalTransactions) * 100}
                      color="warning"
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <MoneyIcon color="info" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {paymentMethods.cash}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Cash
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(paymentMethods.cash / analytics.totalTransactions) * 100}
                      color="info"
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Quick Stats" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
                <Typography variant="h4" color="success.main">
                  {((analytics.completedPayments / analytics.totalTransactions) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Failed Payments
                </Typography>
                <Typography variant="h6" color="error.main">
                  {analytics.failedPayments}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Payouts
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {analytics.payoutsPending}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Payments" />
          <Tab 
            label={
              <Badge badgeContent={analytics.pendingPayments} color="warning">
                Pending
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={analytics.failedPayments} color="error">
                Failed
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </Box>
            </Grid>
          </Grid>

          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_escrow">In Escrow</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={filterMethod}
                      label="Payment Method"
                      onChange={(e) => setFilterMethod(e.target.value)}
                    >
                      <MenuItem value="all">All Methods</MenuItem>
                      <MenuItem value="mobile_money">Mobile Money</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Transactions ({payments.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payer</TableCell>
                    <TableCell>Payee</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {payment.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(payment.amount)}
                        </Typography>
                        {payment.transactionFee > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Fee: {formatCurrency(payment.transactionFee)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                            {payment.payerName[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {payment.payerName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'success.main' }}>
                            {payment.payeeName[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {payment.payeeName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getMethodIcon(payment.method)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2">
                              {payment.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payment.methodDetails}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleViewPayment(payment)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {payments.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No payments found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment ID: {selectedPayment.id}
                </Typography>
                <Chip 
                  label={selectedPayment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                  color={getStatusColor(selectedPayment.status)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Amount:
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {formatCurrency(selectedPayment.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Fees:
                </Typography>
                <Typography variant="body1">
                  Transaction Fee: {formatCurrency(selectedPayment.transactionFee)}
                </Typography>
                <Typography variant="body1">
                  Platform Fee: {formatCurrency(selectedPayment.platformFee)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Payer:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>{selectedPayment.payerName[0]}</Avatar>
                  <Typography>{selectedPayment.payerName}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Payee:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>{selectedPayment.payeeName[0]}</Avatar>
                  <Typography>{selectedPayment.payeeName}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Job:
                </Typography>
                <Typography>{selectedPayment.jobTitle}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Method:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getMethodIcon(selectedPayment.method)}
                  <Typography sx={{ ml: 1 }}>{selectedPayment.methodDetails}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Date:
                </Typography>
                <Typography>{formatDate(selectedPayment.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description:
                </Typography>
                <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {selectedPayment.description}
                </Typography>
              </Grid>
              {selectedPayment.failureReason && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Failure Reason:
                  </Typography>
                  <Alert severity="error">
                    {selectedPayment.failureReason}
                  </Alert>
                </Grid>
              )}
            </Grid>
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
};

export default PaymentOverview;
