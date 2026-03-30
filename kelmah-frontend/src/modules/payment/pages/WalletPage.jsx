import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { usePayments } from '../contexts/PaymentContext';
import { Helmet } from 'react-helmet-async';
import TransactionsList from '../components/TransactionsList';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import PageCanvas from '../../common/components/PageCanvas';
import { TOUCH_TARGET_MIN, Z_INDEX } from '@/constants/layout';
import { withBottomNavSafeArea } from '@/utils/safeArea';

const WalletPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loading,
    error,
    walletBalance,
    walletMissing,
    transactions,
    fetchTransactions,
  } = usePayments();
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  // Pagination state (moved above applyFilters so setPage is defined before use)
  const [page, setPage] = useState(1);
  const perPage = 5;
  const pageCount = Math.ceil(
    (Array.isArray(transactions) ? transactions.length : 0) / perPage,
  );
  const pagedTransactions = Array.isArray(transactions)
    ? transactions.slice((page - 1) * perPage, page * perPage)
    : [];
  const applyFilters = () => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterType !== 'all') params.type = filterType;
    fetchTransactions(params);
    setPage(1);
  };
  // New: clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterType('all');
    fetchTransactions({});
    setPage(1);
  };

  if (loading)
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, sm: 4 }, pb: { xs: withBottomNavSafeArea(12), md: 6 } }}
      >
        <Container sx={{ py: { xs: 2, sm: 4 } }}>
          <Skeleton variant="rectangular" height={300} />
        </Container>
      </PageCanvas>
    );
  if (error)
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, sm: 4 }, pb: { xs: withBottomNavSafeArea(12), md: 6 } }}
      >
        <Container sx={{ py: { xs: 2, sm: 4 } }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => fetchTransactions()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </PageCanvas>
    );

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: withBottomNavSafeArea(72), md: 6 } }}
    >
      <Container
        maxWidth="md"
        sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}
      >
        <Helmet>
          <title>Wallet | Kelmah</title>
        </Helmet>
        {/* Wallet Summary */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 1.5, sm: 3 },
            mb: { xs: 2, sm: 4 },
            borderRadius: 2,
            // ✅ MOBILE-AUDIT P4: solid bg instead of gradient
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'secondary.main',
          })}
        >
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            sx={{ opacity: 0.8, color: 'secondary.main' }}
          >
            Wallet Balance
          </Typography>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            fontWeight="bold"
            sx={{ my: 1, color: 'secondary.main' }}
          >
            {currencyFormatter.format(walletBalance)}
          </Typography>
          {walletMissing && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your wallet will be created automatically the first time you add
              funds or receive a payment.
            </Alert>
          )}
        </Paper>
        {/* Transaction Filters */}
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 0.75, sm: 2, md: 2, lg: 1.5 },
            alignItems: 'center',
          }}
        >
          <TextField
            size={isMobile ? 'small' : 'medium'}
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'aria-label': 'Filter transactions from this date' }}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
          />
          <TextField
            size={isMobile ? 'small' : 'medium'}
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'aria-label': 'Filter transactions up to this date' }}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
          />
          <FormControl
            size={isMobile ? 'small' : 'medium'}
            sx={{
              minWidth: { xs: 0, sm: 140 },
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
              inputProps={{
                'aria-label': 'Filter wallet transactions by type',
              }}
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
              flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' },
              minHeight: TOUCH_TARGET_MIN,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
            onClick={applyFilters}
          >
            Apply filters
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            sx={{
              borderWidth: 2,
              flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' },
              minHeight: TOUCH_TARGET_MIN,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
            onClick={clearFilters}
          >
            Reset filters
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Filter by date or type to narrow the transactions list.
        </Typography>
        {/* Summary above transactions list */}
        {(Array.isArray(transactions) ? transactions.length : 0) > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {(page - 1) * perPage + 1} -{' '}
            {Math.min(
              Array.isArray(transactions) ? transactions.length : 0,
              page * perPage,
            )}{' '}
            of {Array.isArray(transactions) ? transactions.length : 0}{' '}
            transactions
          </Typography>
        )}
        {/* Transactions List */}
        <TransactionsList transactions={pagedTransactions} loading={loading} />
        {/* Pagination */}
        {pageCount > 1 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(e, val) => setPage(val)}
              getItemAriaLabel={(type, pageNumber) =>
                type === 'page'
                  ? `Go to wallet transactions page ${pageNumber}`
                  : `Go to ${type} page`
              }
              color="secondary"
            />
          </Box>
        )}

        <Paper
          elevation={8}
          sx={(theme) => ({
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: withBottomNavSafeArea(0),
            zIndex: Z_INDEX.stickyCta,
            px: 1,
            py: 1,
            gap: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ minHeight: TOUCH_TARGET_MIN, borderWidth: 2 }}
            onClick={clearFilters}
          >
            Reset
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ minHeight: TOUCH_TARGET_MIN, boxShadow: '0 2px 8px rgba(255,215,0,0.35)' }}
            onClick={applyFilters}
          >
            Apply
          </Button>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default WalletPage;
