import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const Escrow = () => {
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [releaseReason, setReleaseReason] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);
      const [balanceResponse, transactionsResponse] = await Promise.all([
        PaymentService.getEscrowBalance(),
        PaymentService.getEscrowTransactions()
      ]);
      setEscrowBalance(balanceResponse.balance);
      setEscrowTransactions(transactionsResponse);
      setError(null);
    } catch (err) {
      setError(err.message);
      setEscrowBalance(0);
      setEscrowTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!selectedEscrow || !releaseReason) return;

    try {
      await PaymentService.releaseEscrow(selectedEscrow.id, { reason: releaseReason });
      fetchEscrowData();
      setReleaseDialogOpen(false);
      setReleaseReason('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefundEscrow = async () => {
    if (!selectedEscrow || !refundReason) return;

    try {
      await PaymentService.refundEscrow(selectedEscrow.id, { reason: refundReason });
      fetchEscrowData();
      setRefundDialogOpen(false);
      setRefundReason('');
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'primary';
      case 'released':
        return 'success';
      case 'refunded':
        return 'error';
      case 'disputed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <SecurityIcon />;
      case 'released':
        return <CheckCircleIcon />;
      case 'refunded':
        return <CancelIcon />;
      case 'disputed':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Escrow Management</Typography>
        <Typography variant="h6" color="primary">
          Escrow Balance: {formatAmount(escrowBalance)}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {escrowTransactions.map((escrow) => (
          <Grid item xs={12} md={6} key={escrow.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Escrow #{escrow.id}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(escrow.status)}
                    label={escrow.status}
                    color={getStatusColor(escrow.status)}
                    size="small"
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  Amount: {formatAmount(escrow.amount, escrow.currency)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Created: {formatDate(escrow.createdAt)}
                </Typography>
                {escrow.expiresAt && (
                  <Typography variant="body2" color="textSecondary">
                    Expires: {formatDate(escrow.expiresAt)}
                  </Typography>
                )}
                {escrow.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {escrow.description}
                  </Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions>
                {escrow.status === 'active' && (
                  <>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setReleaseDialogOpen(true);
                      }}
                    >
                      Release Funds
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setRefundDialogOpen(true);
                      }}
                    >
                      Refund
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Release Escrow Funds</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to release the funds from escrow #{selectedEscrow?.id}?
            </Typography>
            <TextField
              fullWidth
              label="Reason for Release"
              multiline
              rows={4}
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReleaseEscrow}
            variant="contained"
            disabled={!releaseReason}
          >
            Release Funds
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refund Escrow Funds</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to refund the funds from escrow #{selectedEscrow?.id}?
            </Typography>
            <TextField
              fullWidth
              label="Reason for Refund"
              multiline
              rows={4}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRefundEscrow}
            variant="contained"
            color="error"
            disabled={!refundReason}
          >
            Refund Funds
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Escrow; 