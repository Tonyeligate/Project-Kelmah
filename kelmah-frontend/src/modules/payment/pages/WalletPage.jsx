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
} from '@mui/material';
import { usePayments } from '../contexts/PaymentContext';
import { Helmet } from 'react-helmet-async';
import TransactionsList from '../components/TransactionsList';
import { currencyFormatter } from '@/modules/common/utils/formatters';

const WalletPage = () => {
  const { loading, error, walletBalance, walletMissing, transactions, fetchTransactions } =
    usePayments();
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
      <Container sx={{ py: { xs: 2, sm: 4 } }}>
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  if (error)
    return (
      <Container sx={{ py: { xs: 2, sm: 4 } }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => fetchTransactions()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Wallet | Kelmah</title></Helmet>
      {/* Wallet Summary */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 2, sm: 3 },
          mb: 4,
          borderRadius: 2,
          // ✅ MOBILE-AUDIT P4: solid bg instead of gradient
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'secondary.main',
        })}
      >
        <Typography variant="h6" sx={{ opacity: 0.8, color: 'secondary.main' }}>
          Wallet Balance
        </Typography>
        <Typography
          variant="h3"
          fontWeight="bold"
          sx={{ my: 1, color: 'secondary.main' }}
        >
          {currencyFormatter.format(walletBalance)}
        </Typography>
        {walletMissing && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Your wallet has not been funded yet. It will be created automatically the first time you add funds or receive a payment.
          </Alert>
        )}
      </Paper>
      {/* Transaction Filters */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2, md: 2, lg: 1.5 }, alignItems: 'center' }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
        />
        <FormControl sx={{ minWidth: { xs: 0, sm: 140 }, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="deposit">Deposit</MenuItem>
            <MenuItem value="withdrawal">Withdrawal</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ borderWidth: 2, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
          onClick={applyFilters}
        >
          Filter
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ borderWidth: 2, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
          onClick={clearFilters}
        >
          Clear
        </Button>
      </Box>
      {/* Summary above transactions list */}
      {(Array.isArray(transactions) ? transactions.length : 0) > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {(page - 1) * perPage + 1} -{' '}
          {Math.min(
            Array.isArray(transactions) ? transactions.length : 0,
            page * perPage,
          )}{' '}
          of {Array.isArray(transactions) ? transactions.length : 0} transactions
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
            color="secondary"
          />
        </Box>
      )}
    </Container>
  );
};

export default WalletPage;
