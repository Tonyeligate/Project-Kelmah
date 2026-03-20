import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import { Helmet } from 'react-helmet-async';
import { adminService } from '../services/adminService';
import { useBreakpointDown } from '@/hooks/useResponsive';

const STATUS_COLOR_MAP = {
  queued: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
};

const EnqueueForm = ({ onSubmitted }) => {
  const [user, setUser] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [provider, setProvider] = useState('mtn_momo');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setOk('');

    try {
      if (!user || !amount || !paymentMethod) {
        throw new Error('User ID, amount, and payment method are required');
      }

      await adminService.enqueuePayout({
        user,
        amount: parseFloat(amount),
        currency,
        provider,
        paymentMethod,
      });

      setOk('Payout queued successfully');
      setUser('');
      setAmount('');
      setPaymentMethod('');
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to enqueue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={2}>
          <TextField fullWidth size="small" label="User ID" value={user} onChange={(event) => setUser(event.target.value)} placeholder="ObjectId" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} inputProps={{ min: 0, step: 0.01 }} />
        </Grid>
        <Grid item xs={6} sm={3} md={1}>
          <TextField fullWidth size="small" label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)} />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Provider</InputLabel>
            <Select value={provider} label="Provider" onChange={(event) => setProvider(event.target.value)}>
              <MenuItem value="mtn_momo">MTN MoMo</MenuItem>
              <MenuItem value="vodafone_cash">Vodafone Cash</MenuItem>
              <MenuItem value="airteltigo">AirtelTigo</MenuItem>
              <MenuItem value="paystack">Paystack</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TextField fullWidth size="small" label="Payment Method ID" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="ObjectId" />
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Button type="submit" variant="contained" fullWidth disabled={submitting} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}>
            Enqueue
          </Button>
        </Grid>
      </Grid>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mt: 1 }}>{ok}</Alert>}
    </Box>
  );
};

const PayoutQueuePage = () => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('queued');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.userType !== 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.listPayouts({ status, page, limit });
      setItems(response.data || response.items || []);
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page, limit]);

  const onProcessBatch = async () => {
    setProcessing(true);
    try {
      await adminService.processPayoutBatch(limit);
      await load();
    } catch (requestError) {
      setError(requestError?.message || 'Failed to process batch');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Helmet><title>Payout Queue | Kelmah</title></Helmet>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Payout Queue
      </Typography>

      <Accordion sx={{ mb: 3, borderRadius: 2, '&:before': { display: 'none' } }} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Enqueue Payout (Admin)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EnqueueForm onSubmitted={load} />
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="queued">Queued</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" label="Page" type="number" value={page} onChange={(event) => { const next = parseInt(event.target.value, 10); if (!Number.isNaN(next) && next >= 1) setPage(next); }} inputProps={{ min: 1 }} sx={{ width: 100 }} />
        <TextField size="small" label="Limit" type="number" value={limit} onChange={(event) => { const next = parseInt(event.target.value, 10); if (!Number.isNaN(next) && next >= 1 && next <= 100) setLimit(next); }} inputProps={{ min: 1, max: 100 }} sx={{ width: 100 }} />
        <Button variant="contained" startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />} onClick={onProcessBatch} disabled={processing}>
          {processing ? 'Processing...' : 'Process Batch'}
        </Button>
        <Button variant="outlined" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">No payout items found.</Typography>
        </Box>
      ) : isMobile ? (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} key={item._id}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: '55%' }}>
                      {item.user}
                    </Typography>
                    <Chip label={item.status} color={STATUS_COLOR_MAP[item.status] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.currency === 'GHS' ? 'GH₵' : item.currency || 'GH₵'}{item.amount} • {item.provider}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attempts: {item.attempts} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </Typography>
                  {item.lastError?.message && (
                    <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5 }}>
                      {item.lastError.message}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Attempts</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.user}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>{item.currency === 'GHS' ? 'GH₵' : item.currency || 'GH₵'}</TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>
                    <Chip label={item.status} color={STATUS_COLOR_MAP[item.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>{item.attempts}</TableCell>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{item.lastError?.message || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default PayoutQueuePage;