import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Helmet } from 'react-helmet-async';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import { getRoleHomePath, hasRole } from '../../../utils/userUtils';
import { devError } from '@/modules/common/utils/devLogger';
import PageCanvas from '../../common/components/PageCanvas';

const EscrowDetailsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { escrowId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const { escrows, paymentMethods, loading, refresh } = usePayments();
  const { showToast } = useNotifications();
  // Support both MongoDB _id (string) and normalized id fields
  const escrow = (escrows || []).find(
    (e) => (e.id ?? String(e._id)) === escrowId,
  );
  const [openRelease, setOpenRelease] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [releasing, setReleasing] = useState(false);
  const backPath = hasRole(user, ['worker', 'admin'])
    ? '/worker/payment'
    : getRoleHomePath(user);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      setSelectedMethod(paymentMethods[0].id || String(paymentMethods[0]._id));
    }
  }, [paymentMethods]);

  if (loading) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Loading escrow details...
          </Typography>
        </Container>
      </PageCanvas>
    );
  }

  if (!escrow) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container sx={{ py: 4 }}>
          <Typography variant="h6">Escrow not found.</Typography>
        </Container>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: 10, md: 6 } }}
    >
      <Container
        maxWidth="md"
        sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}
      >
        <Helmet>
          <title>Escrow Details | Kelmah</title>
        </Helmet>
        {/* Page Heading */}
        <Box
          sx={{
            mb: { xs: 1.5, sm: 4 },
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <Box>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{ color: 'secondary.main', lineHeight: 1.1 }}
            >
              Escrow Details
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
            >
              Check escrow status and release funds when work is complete.
            </Typography>
          </Box>
        </Box>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1.5, sm: 4 },
            borderRadius: 2,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
            color: 'text.primary',
            border: '2px solid',
            borderColor: 'secondary.main',
            boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
          }}
        >
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight="bold"
            sx={{ mb: 1.5, color: 'secondary.main', lineHeight: 1.15 }}
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
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)', minHeight: 44 }}
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
                minHeight: 44,
              }}
              component={RouterLink}
              to={backPath}
            >
              Back to Payment Center
            </Button>
          </Box>

          <Paper
            elevation={8}
            sx={(theme) => ({
              display: { xs: 'flex', sm: 'none' },
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: theme.zIndex.appBar + 2,
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
              sx={{ minHeight: 42, borderWidth: 2 }}
              component={RouterLink}
              to={backPath}
            >
              Back
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              sx={{
                minHeight: 42,
                boxShadow: '0 2px 8px rgba(255,215,0,0.35)',
              }}
              onClick={() => setOpenRelease(true)}
            >
              Release
            </Button>
          </Paper>
        </Paper>

        {/* Release Funds Dialog */}
        <Dialog
          open={openRelease}
          onClose={() => setOpenRelease(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="release-funds-dialog-title"
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(4px)',
            },
          }}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
        >
          <DialogTitle
            id="release-funds-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select where the released amount should be sent.
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
                SelectDisplayProps={{
                  'aria-label': 'Choose payment method for release',
                }}
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  p: '8px 12px',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'secondary.main',
                  boxShadow: 'inset 0 0 8px rgba(255,215,0,0.3)',
                }}
              >
                {(paymentMethods || []).map((pm) => {
                  const pmId = pm.id || String(pm._id);
                  return (
                    <MenuItem key={pmId} value={pmId}>
                      {pm.name || pm.type}
                    </MenuItem>
                  );
                })}
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
                minHeight: 44,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setReleasing(true);
                try {
                  const resolvedId = escrow.id ?? String(escrow._id);
                  await paymentService.releaseEscrow(resolvedId, {
                    paymentMethodId: selectedMethod,
                  });
                  showToast('Funds released successfully.', 'success');
                  await refresh();
                } catch (err) {
                  devError('Release failed:', err);
                  showToast('Failed to release funds.', 'error');
                } finally {
                  setReleasing(false);
                  setOpenRelease(false);
                }
              }}
              variant="contained"
              color="secondary"
              disabled={releasing}
              sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)', minHeight: 44 }}
              aria-label="Confirm release of escrow funds"
            >
              {releasing ? 'Releasing...' : 'Release Now'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageCanvas>
  );
};

export default EscrowDetailsPage;
