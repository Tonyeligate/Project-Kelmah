import React, { useEffect, useRef, useState } from 'react';
import { usePayments } from '../contexts/PaymentContext';
import BillPage from './BillPage';
import PaymentMethodsPage from './PaymentMethodsPage';
import PaymentSettingsPage from './PaymentSettingsPage';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Skeleton,
  Grow,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import TransactionsList from '../components/TransactionsList';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import { hasRole } from '../../../utils/userUtils';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { HEADER_HEIGHT_MOBILE, STICKY_CTA_HEIGHT, Z_INDEX } from '../../../constants/layout';

const PaymentsPage = () => {
  const isMobile = useBreakpointDown('md');
  const [selectedTab, setSelectedTab] = useState(0);
  const [animate] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { loading, error, walletBalance, walletMissing, transactions, fetchTransactions, refresh } =
    usePayments();
  const user = useSelector((state) => state.auth.user);
  const canManagePaymentMethods = hasRole(user, ['worker', 'admin']);
  const canViewPaymentSettings = hasRole(user, ['admin']);
  // Transaction filters & pagination
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 5;
  const applyFilters = () => {
    setPage(1);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterType !== 'all') params.type = filterType;
    fetchTransactions(params);
  };
  const pageCount = Math.ceil(
    (Array.isArray(transactions) ? transactions.length : 0) / perPage,
  );
  const pagedTransactions = Array.isArray(transactions)
    ? transactions.slice((page - 1) * perPage, page * perPage)
    : [];
  const [slowLoading, setSlowLoading] = useState(false);
  const slowLoadingTimerRef = useRef(null);
  const paymentErrorMessage = error
    ? `We could not load your latest payment data. ${error} You can tap Retry now.`
    : '';

  useEffect(() => {
    if (!loading) {
      setSlowLoading(false);
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
        slowLoadingTimerRef.current = null;
      }
      return;
    }

    slowLoadingTimerRef.current = setTimeout(() => {
      setSlowLoading(true);
    }, 8000);

    return () => {
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
        slowLoadingTimerRef.current = null;
      }
    };
  }, [loading]);

  const handleRetryPayments = () => {
    refresh();
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const tabs = [
    { label: 'Transactions', content: null },
    { label: 'Bills', content: <BillPage /> },
    ...(canManagePaymentMethods
      ? [{ label: 'Payment Methods', content: <PaymentMethodsPage /> }]
      : []),
    ...(canViewPaymentSettings
      ? [{ label: 'Settings', content: <PaymentSettingsPage /> }]
      : []),
  ];

  useEffect(() => {
    if (selectedTab >= tabs.length) {
      setSelectedTab(0);
    }
  }, [selectedTab, tabs.length]);

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 1.25, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 4 }, pb: { xs: 9, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
        <Helmet><title>Payments | Kelmah</title></Helmet>
        <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: { xs: 1.25, md: 3 },
          position: { xs: 'sticky', md: 'static' },
          top: { xs: HEADER_HEIGHT_MOBILE + 10, md: 'auto' },
          zIndex: Z_INDEX.sticky,
          py: { xs: 0.5, md: 0 },
          bgcolor: { xs: 'background.default', md: 'transparent' },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: 'secondary.main', fontSize: { xs: '1.15rem', md: '2rem' } }}>
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: { xs: 'none', md: 'block' } }}>
            Track transactions, review wallet activity, and manage billing safely.
          </Typography>
        </Box>
        <Button
          startIcon={<MoreVertIcon />}
          variant="outlined"
          color="secondary"
          sx={{ borderWidth: 2, boxShadow: '0 2px 8px rgba(255,215,0,0.4)', minHeight: 44 }}
          aria-label="Open payment actions menu"
          onClick={handleMenuOpen}
        >
          Actions
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            },
          }}
        >
          {canManagePaymentMethods && (
            <MenuItem
              component={RouterLink}
              to="/payment/methods"
              onClick={handleMenuClose}
            >
              Manage Payment Methods
            </MenuItem>
          )}
          <MenuItem
            component={RouterLink}
            to="/payment/bill"
            onClick={handleMenuClose}
          >
            View Bills
          </MenuItem>
        </Menu>
        </Box>
      {slowLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Payments are taking longer than usual to load. The service may be waking up.
          You can wait a bit more or retry now.
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetryPayments}>
              Retry
            </Button>
          }
        >
          {paymentErrorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {isMobile && (
          <Grid item xs={12}>
            <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', pb: 0.25, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              <Chip size="small" label={`Balance ${currencyFormatter.format(walletBalance || 0)}`} sx={{ fontWeight: 700 }} />
              <Chip size="small" variant="outlined" label={`${Array.isArray(transactions) ? transactions.length : 0} txns`} sx={{ fontWeight: 700 }} />
            </Stack>
          </Grid>
        )}
        {/* Wallet Balance */}
        <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper
            sx={(theme) => ({
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
              color: theme.palette.text.primary,
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            })}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              Wallet Balance
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={180} height={48} />
            ) : (
              <Grow in={animate} timeout={800}>
                <Typography variant="h3" sx={{ color: 'secondary.main' }}>
                  {currencyFormatter.format(walletBalance)}
                </Typography>
              </Grow>
            )}
            {walletMissing && !error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your wallet is empty because it has not been provisioned yet. It will be created automatically when you add funds or receive a payout.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Paper
            sx={{
              width: '100%',
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            }}
          >
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="secondary"
              textColor="inherit"
              aria-label="Payment page sections"
              sx={{
                position: { xs: 'sticky', md: 'static' },
                top: { xs: HEADER_HEIGHT_MOBILE + STICKY_CTA_HEIGHT - 2, md: 'auto' },
                zIndex: Z_INDEX.sticky,
                bgcolor: { xs: 'background.paper', md: 'transparent' },
                '& .MuiTab-root': { color: 'text.secondary' },
                '& .Mui-selected': { color: 'secondary.main' },
              }}
            >
              {tabs.map((tab) => (
                <Tab key={tab.label} label={tab.label} />
              ))}
            </Tabs>

            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
              {selectedTab === 0 && (
                <>
                  {/* Filters */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: { xs: 1, sm: 2 },
                      rowGap: { xs: 1, sm: 1.5 },
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      variant="filled"
                      label="From Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ 'aria-label': 'Filter transactions from date' }}
                      sx={{ backgroundColor: 'action.hover', borderRadius: 1, minWidth: { sm: 170 }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' }, '& .MuiInputBase-root': { minHeight: 44 } }}
                    />
                    <TextField
                      variant="filled"
                      label="To Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ 'aria-label': 'Filter transactions to date' }}
                      sx={{ backgroundColor: 'action.hover', borderRadius: 1, minWidth: { sm: 170 }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' }, '& .MuiInputBase-root': { minHeight: 44 } }}
                    />
                    <FormControl sx={{ minWidth: { xs: 0, sm: 170 }, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filterType}
                        label="Type"
                        onChange={(e) => setFilterType(e.target.value)}
                        inputProps={{ 'aria-label': 'Filter transactions by type' }}
                        sx={{ minHeight: 44 }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="deposit">Deposit</MenuItem>
                        <MenuItem value="withdrawal">Withdrawal</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{
                        borderWidth: 2,
                        boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                        minHeight: 44,
                        flex: { xs: '1 1 100%', sm: '0 1 auto' },
                      }}
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                  </Box>
                  <TransactionsList
                    transactions={pagedTransactions}
                    loading={loading}
                  />
                  {!loading && !error && Array.isArray(transactions) && transactions.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No transactions yet. Once deposits, withdrawals, or escrow events occur, they will appear here.
                    </Alert>
                  )}
                  {pageCount > 1 && (
                    <Box
                      sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
                    >
                      <Pagination
                        count={pageCount}
                        page={page}
                        onChange={(e, val) => setPage(val)}
                        color="secondary"
                      />
                    </Box>
                  )}
                </>
              )}

              {selectedTab > 0 && tabs[selectedTab]?.content}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      </Container>
    </PageCanvas>
  );
};

export default PaymentsPage;
