import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { Helmet } from 'react-helmet-async';
import { adminService } from '@/services/adminService';

const STATUS_COLOR = {
  queued: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
};

const EnqueueForm = ({ onSuccess }) => {
  const [user, setUser] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('mtn_momo');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!user || !amount || !paymentMethod) {
        throw new Error('User ID, amount, and payment method are required.');
      }

      await adminService.enqueuePayout({
        user,
        amount: Number(amount),
        currency: 'GHS',
        provider,
        paymentMethod,
      });

      setUser('');
      setAmount('');
      setPaymentMethod('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to queue payout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit}>
      <Grid container spacing={1.25}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="User ID"
            value={user}
            onChange={(event) => setUser(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Provider</InputLabel>
            <Select
              value={provider}
              label="Provider"
              onChange={(event) => setProvider(event.target.value)}
            >
              <MenuItem value="mtn_momo">MTN MoMo</MenuItem>
              <MenuItem value="vodafone_cash">Vodafone Cash</MenuItem>
              <MenuItem value="airteltigo">AirtelTigo</MenuItem>
              <MenuItem value="paystack">Paystack</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Payment Method ID"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{ minHeight: 40 }}
          >
            Queue
          </Button>
        </Grid>
      </Grid>
      {error ? (
        <Alert severity="error" sx={{ mt: 1.25 }}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
};

const PayoutQueuePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('queued');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await adminService.listPayouts({ status, page, limit });
      const normalized = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
      setItems(normalized);
    } catch (requestError) {
      setError(requestError?.message || 'Failed to fetch payout queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page, limit]);

  const processBatch = async () => {
    setProcessing(true);
    setError('');

    try {
      await adminService.processPayoutBatch(limit);
      await load();
    } catch (requestError) {
      setError(requestError?.message || 'Failed to process payout batch.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Helmet>
        <title>Payout Queue | Kelmah Admin</title>
      </Helmet>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Payout Queue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Queue payouts, process batches, and monitor payout status.
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.25 }}>
            Enqueue Payout
          </Typography>
          <EnqueueForm onSuccess={load} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ mb: 1.5 }}
          >
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(event) => setStatus(event.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="queued">Queued</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Page"
              type="number"
              value={page}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value) && value >= 1) {
                  setPage(value);
                }
              }}
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />

            <TextField
              size="small"
              label="Limit"
              type="number"
              value={limit}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value) && value >= 1 && value <= 100) {
                  setLimit(value);
                }
              }}
              sx={{ width: 100 }}
              inputProps={{ min: 1, max: 100 }}
            />

            <Button
              variant="contained"
              startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              disabled={processing}
              onClick={processBatch}
            >
              {processing ? 'Processing' : 'Process Batch'}
            </Button>

            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>
              Refresh
            </Button>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No payout items available for this filter.
            </Typography>
          ) : isMobile ? (
            <Stack spacing={1}>
              {items.map((item) => (
                <Box
                  key={item._id || `${item.user}-${item.createdAt}`}
                  sx={{
                    border: '1px solid rgba(17,24,39,0.08)',
                    borderRadius: 2,
                    p: 1.25,
                  }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{item.user}</Typography>
                    <Chip
                      label={item.status || 'queued'}
                      color={STATUS_COLOR[item.status] || 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.amount} {item.currency || 'GHS'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Provider: {item.provider || 'n/a'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id || `${item.user}-${item.createdAt}`} hover>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell>{item.currency || 'GHS'}</TableCell>
                      <TableCell>{item.provider || 'n/a'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status || 'queued'}
                          color={STATUS_COLOR[item.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.attempts ?? 0}</TableCell>
                      <TableCell>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayoutQueuePage;
