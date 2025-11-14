import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Stack,
  CircularProgress,
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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  selectHirerJobs,
  selectHirerLoading,
  selectHirerPayments,
  selectHirerError,
  fetchPaymentSummary,
} from '../services/hirerSlice';
import paymentService from '../../payment/services/paymentService';

// No mock data - using real API data only

const PAYMENT_SUMMARY_TIMEOUT_MS = 8000;
const PAYMENT_SUMMARY_TTL_MS = 60_000;
const PAYMENT_SUMMARY_MAX_RETRIES = 3;
const PAYMENT_SUMMARY_RETRY_BASE_DELAY_MS = 700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [manualRefreshPending, setManualRefreshPending] = useState(false);
  const [summaryTimeout, setSummaryTimeout] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const lastFetchRef = useRef(0);
  const summaryTimeoutRef = useRef(null);

  // Redux selectors
  const activeJobs = useSelector(selectHirerJobs('active'));
  const jobsLoading = useSelector(selectHirerLoading('jobs'));
  const paymentsLoading = useSelector(selectHirerLoading('payments'));
  const paymentSummary = useSelector(selectHirerPayments);
  const paymentsError = useSelector(selectHirerError('payments'));
  const pendingPayments = Array.isArray(paymentSummary?.pending)
    ? paymentSummary.pending
    : [];
  const paymentHistory = Array.isArray(paymentSummary?.history)
    ? paymentSummary.history
    : [];
  const refreshButtonLoading = manualRefreshPending || paymentsLoading;
  const showInitialLoading = (jobsLoading || paymentsLoading) && !paymentSummary;
  const formattedLastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('en-GH', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      })
    : 'Never';

  const ensurePaymentSummary = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && paymentSummary && now - lastFetchRef.current < PAYMENT_SUMMARY_TTL_MS) {
        return;
      }

      lastFetchRef.current = now;
      setSummaryTimeout(false);
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
      summaryTimeoutRef.current = setTimeout(() => {
        setSummaryTimeout(true);
      }, PAYMENT_SUMMARY_TIMEOUT_MS);

      let attempts = 0;
      const attemptFetch = async () => {
        attempts += 1;
        try {
          await dispatch(fetchPaymentSummary()).unwrap();
        } catch (err) {
          console.warn(`Failed to fetch payment summary (attempt ${attempts}):`, err);
          if (attempts < PAYMENT_SUMMARY_MAX_RETRIES) {
            const delay = PAYMENT_SUMMARY_RETRY_BASE_DELAY_MS * 2 ** (attempts - 1);
            await sleep(delay);
            return attemptFetch();
          }
        } finally {
          if (summaryTimeoutRef.current) {
            clearTimeout(summaryTimeoutRef.current);
            summaryTimeoutRef.current = null;
          }
          setSummaryTimeout(false);
          setManualRefreshPending(false);
        }
      };

      attemptFetch();
    },
    [dispatch, paymentSummary],
  );

  useEffect(() => {
    ensurePaymentSummary();
    return () => {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
    };
  }, [ensurePaymentSummary]);

  useEffect(() => {
    if (paymentSummary) {
      setLastSyncedAt(Date.now());
    }
  }, [paymentSummary]);

  const handleRefreshSummary = () => {
    setManualRefreshPending(true);
    ensurePaymentSummary(true);
  };

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
      if (!selectedPayment) return;
      // Prefer escrow release flow if escrowId is present
      if (selectedPayment.escrowId) {
        await paymentService.releaseEscrow(selectedPayment.escrowId, {
          milestone: selectedPayment.milestoneId || undefined,
          amount: selectedPayment.amount,
          method: paymentMethod,
          confirmationCode: confirmationCode || undefined,
        });
      } else {
        // Fallback: create a payout transaction
        await paymentService.createTransaction({
          amount: selectedPayment.amount,
          type: 'payout',
          paymentMethod: paymentMethod,
          metadata: {
            jobTitle: selectedPayment.jobTitle,
            workerId: selectedPayment.worker?.id,
            milestone: selectedPayment.milestone,
          },
        });
      }
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
                  {formatCurrency(paymentSummary?.totalPaid || 0)}
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
                  {formatCurrency(paymentSummary?.pendingPayments || 0)}
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
                  {formatCurrency(paymentSummary?.escrowBalance || 0)}
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
                  {paymentSummary?.averagePaymentTime || 'N/A'}
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

  if (showInitialLoading) {
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
      {(paymentsError || summaryTimeout) && (
        <Alert
          severity={paymentsError ? 'error' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefreshSummary}
              disabled={refreshButtonLoading}
            >
              Retry
            </Button>
          }
        >
          {paymentsError ||
            'Fetching your payment summary is taking longer than expected. Please try again.'}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="caption" color="text.secondary">
          Last synced: {formattedLastSynced}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={
            refreshButtonLoading ? <CircularProgress size={16} /> : <RefreshIcon />
          }
          onClick={handleRefreshSummary}
          disabled={refreshButtonLoading}
          sx={{ textTransform: 'none' }}
        >
          Refresh Summary
        </Button>
      </Stack>

      {paymentsLoading && paymentSummary && <LinearProgress sx={{ mb: 2 }} />}

      {/* Payment Summary */}
      <PaymentSummaryCards />

      {/* Pending Payments */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Pending Payments ({(pendingPayments || []).length})
          </Typography>

          {!pendingPayments || pendingPayments.length === 0 ? (
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
                  {(pendingPayments || []).map((payment) => (
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
                {(paymentHistory || []).map((payment) => (
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
