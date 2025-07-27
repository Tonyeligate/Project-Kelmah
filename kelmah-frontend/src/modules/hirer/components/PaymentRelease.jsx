import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { selectHirerJobs, selectHirerLoading } from '../services/hirerSlice';

// Mock payment data with comprehensive financial information
const mockPaymentData = {
  summary: {
    totalPaid: 87500,
    pendingPayments: 23500,
    escrowBalance: 45000,
    thisMonthPaid: 23500,
    averagePaymentTime: '2.3 days',
    paymentMethods: [
      { method: 'Mobile Money', percentage: 65 },
      { method: 'Bank Transfer', percentage: 30 },
      { method: 'Card Payment', percentage: 5 },
    ],
  },

  pendingPayments: [
    {
      id: 'payment-1',
      jobId: 'job-h1',
      jobTitle: 'Kitchen Renovation - Custom Cabinets',
      worker: {
        id: 'worker-1',
        name: 'Tony Gate',
        avatar: '/api/placeholder/40/40',
        rating: 4.8,
      },
      milestone: 'Cabinet Construction',
      amount: 1650,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      status: 'ready_for_release',
      completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      escrowId: 'escrow-001',
    },
    {
      id: 'payment-2',
      jobId: 'job-h2',
      jobTitle: 'Office Interior Design & Setup',
      worker: {
        id: 'worker-2',
        name: 'Sarah Williams',
        avatar: '/api/placeholder/40/40',
        rating: 4.9,
      },
      milestone: 'Furniture Selection & Ordering',
      amount: 5250,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      status: 'pending_approval',
      submittedDate: new Date(Date.now() - 1000 * 60 * 60 * 12),
      escrowId: 'escrow-002',
    },
  ],

  paymentHistory: [
    {
      id: 'payment-h1',
      jobId: 'job-h1',
      jobTitle: 'Kitchen Renovation - Custom Cabinets',
      worker: {
        id: 'worker-1',
        name: 'Tony Gate',
        avatar: '/api/placeholder/40/40',
      },
      milestone: 'Material Purchase & Preparation',
      amount: 1100,
      paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      status: 'completed',
      paymentMethod: 'Mobile Money',
      transactionId: 'TXN-001234',
    },
    {
      id: 'payment-h2',
      jobId: 'job-h1',
      jobTitle: 'Kitchen Renovation - Custom Cabinets',
      worker: {
        id: 'worker-1',
        name: 'Tony Gate',
        avatar: '/api/placeholder/40/40',
      },
      milestone: 'Initial Measurements & Design',
      amount: 1100,
      paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      status: 'completed',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-001233',
    },
    {
      id: 'payment-h3',
      jobId: 'job-h2',
      jobTitle: 'Office Interior Design & Setup',
      worker: {
        id: 'worker-2',
        name: 'Sarah Williams',
        avatar: '/api/placeholder/40/40',
      },
      milestone: 'Space Planning & Design',
      amount: 4500,
      paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      status: 'completed',
      paymentMethod: 'Mobile Money',
      transactionId: 'TXN-001235',
    },
  ],
};

const PaymentRelease = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Redux selectors
  const activeJobs = useSelector(selectHirerJobs('active'));
  const jobsLoading = useSelector(selectHirerLoading('jobs'));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready_for_release':
        return 'success';
      case 'pending_approval':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ready_for_release':
        return 'Ready to Release';
      case 'pending_approval':
        return 'Pending Approval';
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  const handleDialogOpen = (type, payment) => {
    setDialogType(type);
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedPayment(null);
    setPaymentMethod('mobile_money');
    setConfirmationCode('');
  };

  const handlePaymentRelease = async () => {
    setLoading(true);
    try {
      // Mock payment release
      console.log(
        `Releasing payment of ${selectedPayment.amount} via ${paymentMethod}`,
      );

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      handleDialogClose();
    } catch (error) {
      console.error('Error releasing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Payment Summary Cards
  const PaymentSummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(mockPaymentData.summary.totalPaid)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Paid Out
                </Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(mockPaymentData.summary.pendingPayments)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending Payments
                </Typography>
              </Box>
              <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(mockPaymentData.summary.escrowBalance)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Escrow Balance
                </Typography>
              </Box>
              <BankIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {mockPaymentData.summary.averagePaymentTime}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Avg Payment Time
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (jobsLoading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Payment Summary */}
      <PaymentSummaryCards />

      {/* Pending Payments */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Pending Payments ({mockPaymentData.pendingPayments.length})
          </Typography>

          {mockPaymentData.pendingPayments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <MoneyIcon
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No pending payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All payments are up to date
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Job & Worker</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Milestone</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Due Date</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPaymentData.pendingPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={payment.worker.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {payment.worker.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {payment.jobTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {payment.worker.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.milestone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(payment.status)}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.dueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleDialogOpen('view', payment)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {payment.status === 'ready_for_release' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<MoneyIcon />}
                              onClick={() =>
                                handleDialogOpen('release', payment)
                              }
                            >
                              Release
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Recent Payment History
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Job & Worker</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Milestone</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date Paid</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Method</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Transaction ID</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPaymentData.paymentHistory.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={payment.worker.avatar}
                          sx={{ width: 32, height: 32 }}
                        >
                          {payment.worker.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {payment.jobTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payment.worker.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.milestone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="success.main"
                      >
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.paidDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentMethod}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payment.transactionId}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Payment Release Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'release'}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <MoneyIcon color="primary" />
            Release Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                You are about to release payment for completed work. This action
                cannot be undone.
              </Alert>

              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Payment Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar src={selectedPayment.worker.avatar}>
                    {selectedPayment.worker.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedPayment.worker.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPayment.jobTitle}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Milestone: {selectedPayment.milestone}
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {formatCurrency(selectedPayment.amount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Payment Method
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {['mobile_money', 'bank_transfer', 'card'].map((method) => (
                    <Button
                      key={method}
                      variant={
                        paymentMethod === method ? 'contained' : 'outlined'
                      }
                      onClick={() => setPaymentMethod(method)}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {method.replace('_', ' ')}
                    </Button>
                  ))}
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Confirmation Code (Optional)"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter any reference code for your records"
                helperText="This will be included in the payment receipt"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handlePaymentRelease}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <LinearProgress /> : <MoneyIcon />}
          >
            {loading ? 'Processing...' : 'Release Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'view'}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Job Information
                  </Typography>
                  <Typography variant="body2">
                    {selectedPayment.jobTitle}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Worker
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={selectedPayment.worker.avatar}>
                      {selectedPayment.worker.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {selectedPayment.worker.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Amount
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedPayment.status)}
                    color={getStatusColor(selectedPayment.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Escrow ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPayment.escrowId}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentRelease;
