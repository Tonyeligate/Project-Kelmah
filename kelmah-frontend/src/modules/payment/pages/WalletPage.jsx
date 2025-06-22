import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button, Pagination, Alert, Skeleton } from '@mui/material';
import { usePayments } from '../contexts/PaymentContext';
import TransactionsList from '../components/TransactionsList';
// Add currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

const WalletPage = () => {
  const { loading, error, walletBalance, transactions, fetchTransactions } = usePayments();
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  // Pagination state (moved above applyFilters so setPage is defined before use)
  const [page, setPage] = useState(1);
  const perPage = 5;
  const pageCount = Math.ceil(transactions.length / perPage);
  const pagedTransactions = transactions.slice((page - 1) * perPage, page * perPage);
  const applyFilters = () => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterType !== 'all') params.type = filterType;
    fetchTransactions(params);
    setPage(1);
  };

  if (loading) return <Container sx={{ py: 4 }}><Skeleton variant="rectangular" height={300} /></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Wallet Summary */}
      <Paper elevation={4} sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        background: 'linear-gradient(to right, #28313b, #485461, #ffd700)',
        color: 'white',
        border: '2px solid',
        borderColor: 'secondary.main'
      }}>
        <Typography variant="h6" sx={{ opacity: 0.8, color: 'secondary.main' }}>Wallet Balance</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ my: 1, color: 'secondary.main' }}>{currencyFormatter.format(walletBalance)}</Typography>
      </Paper>
      {/* Transaction Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Start Date" type="date" value={startDate}
          onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date" type="date" value={endDate}
          onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
        />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="deposit">Deposit</MenuItem>
            <MenuItem value="withdrawal">Withdrawal</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" color="secondary" sx={{ borderWidth: 2 }} onClick={applyFilters}>Apply Filters</Button>
      </Box>
      {/* Transactions List */}
      <TransactionsList transactions={pagedTransactions} loading={loading} />
      {/* Pagination */}
      {pageCount > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={pageCount} page={page} onChange={(e, val) => setPage(val)} color="secondary" />
        </Box>
      )}
    </Container>
  );
};

export default WalletPage; 