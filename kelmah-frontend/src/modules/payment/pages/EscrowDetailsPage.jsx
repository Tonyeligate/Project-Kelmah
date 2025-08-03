import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { usePayments } from '../contexts/PaymentContext';
import paymentService from '../services/paymentService';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: "GHS",
});

const EscrowDetailsPage = () => {
  const { escrowId } = useParams();
  const { escrows, paymentMethods, refresh } = usePayments();
  const { showToast } = useNotifications();
  const escrow = escrows.find((e) => e.id === escrowId);
  const [openRelease, setOpenRelease] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      setSelectedMethod(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  if (!escrow) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h6">Escrow not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Heading */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start' }}>
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
          Escrow Details
        </Typography>
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: 'linear-gradient(to right, #28313b, #485461, #ffd700)',
          color: 'white',
          border: '2px solid',
          borderColor: 'secondary.main',
          boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 2, color: 'secondary.main' }}
        >
          {escrow.title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Other Party:
          </Typography>
          <Typography variant="body1">{escrow.otherParty}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Amount:
          </Typography>
          <Typography variant="body1">
            {currencyFormatter.format(escrow.amount)}
          </Typography>
        </Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Status:
          </Typography>
          <Typography variant="body1">{escrow.status}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            onClick={() => setOpenRelease(true)}
          >
            Release Funds
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            sx={{
              borderWidth: 2,
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            }}
            component={RouterLink}
            to="/worker/payment"
          >
            Back to Payment Center
          </Button>
        </Box>
      </Paper>

      {/* Release Funds Dialog */}
      <Dialog
        open={openRelease}
        onClose={() => setOpenRelease(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
          },
        }}
        PaperProps={{
          sx: {
            bgcolor: 'grey.900',
            color: 'text.primary',
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'secondary.main',
            boxShadow: '0 0 16px rgba(255,215,0,0.5)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{ color: 'secondary.main', fontWeight: 'bold' }}
          >
            Release Funds to {escrow.otherParty}
          </Typography>
        </DialogTitle>
        <Divider sx={{ borderColor: 'secondary.main', my: 1, height: 2 }} />
        <DialogContent>
          <Typography gutterBottom>
            Amount: {currencyFormatter.format(escrow.amount)}
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel sx={{ color: 'secondary.main' }}>
              Payment Method
            </InputLabel>
            <Select
              variant="filled"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              inputProps={{ disableUnderline: true }}
              sx={{
                bgcolor: 'grey.800',
                borderRadius: 1,
                p: '8px 12px',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'secondary.main',
                boxShadow: 'inset 0 0 8px rgba(255,215,0,0.3)',
              }}
            >
              {paymentMethods.map((pm) => (
                <MenuItem key={pm.id} value={pm.id}>
                  {pm.name || pm.type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenRelease(false)}
            variant="outlined"
            color="secondary"
            sx={{
              borderWidth: 2,
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await paymentService.releaseEscrow(escrow.id, {
                  paymentMethodId: selectedMethod,
                });
                showToast('Funds released successfully.', 'success');
                await refresh();
              } catch (err) {
                console.error('Release failed:', err);
                showToast('Failed to release funds.', 'error');
              } finally {
                setOpenRelease(false);
              }
            }}
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
          >
            Confirm Release
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EscrowDetailsPage;
