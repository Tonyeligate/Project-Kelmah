import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  MobileFriendly as MobileIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import paymentService from '../services/paymentService';
import { useTheme } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import { toUserMessage } from '@/services/responseNormalizer';
import PageCanvas from '@/modules/common/components/PageCanvas';
import {
  HEADER_HEIGHT_MOBILE,
  TOUCH_TARGET_MIN,
  Z_INDEX,
} from '../../../constants/layout';
import { withBottomNavSafeArea, withSafeAreaTop } from '@/utils/safeArea';

// Demo payment methods for initial display
const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoadingHint, setShowLoadingHint] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Dialog control states
  const [openAddCard, setOpenAddCard] = useState(false);
  const [openAddMobile, setOpenAddMobile] = useState(false);
  const [openAddBank, setOpenAddBank] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // Form states
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
    cvv: '',
  });

  const [newMobile, setNewMobile] = useState({
    provider: 'MTN',
    phoneNumber: '',
    name: '',
  });

  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branchCode: '',
  });

  const [methodToDelete, setMethodToDelete] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch payment methods from server
  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(
        toUserMessage(err, {
          fallback: 'Failed to load payment methods. Please try again.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoadingHint(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowLoadingHint(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Initialize with loading effect
  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  // Handle adding a new credit card via API
  const handleAddCard = async () => {
    setLoading(true);
    try {
      await paymentService.addPaymentMethod({
        type: 'credit_card',
        isDefault: paymentMethods.length === 0,
        cardDetails: {
          number: newCard.cardNumber,
          expMonth: Number(newCard.expiryMonth),
          expYear: Number(newCard.expiryYear),
          cvc: newCard.cvv,
          cardholderName: newCard.cardholderName,
        },
        billingAddress: {}, // include address if available
      });
      await fetchMethods();
      setOpenAddCard(false);
      setNewCard({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cardholderName: '',
        cvv: '',
      });
      enqueueSnackbar('Card added successfully', { variant: 'success' });
    } catch (err) {
      const message = toUserMessage(err, {
        fallback: 'Failed to add card. Please try again.',
      });
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle adding mobile money via API
  const handleAddMobile = async () => {
    setLoading(true);
    try {
      await paymentService.addPaymentMethod({
        type: 'mobile_money',
        isDefault: paymentMethods.length === 0,
        mobileDetails: {
          provider: newMobile.provider,
          phoneNumber: newMobile.phoneNumber,
          name: newMobile.name,
        },
        billingAddress: {},
      });
      await fetchMethods();
      setOpenAddMobile(false);
      setNewMobile({ provider: 'MTN', phoneNumber: '', name: '' });
      enqueueSnackbar('Mobile money added successfully', {
        variant: 'success',
      });
    } catch (err) {
      const message = toUserMessage(err, {
        fallback: 'Failed to add mobile money. Please try again.',
      });
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle adding bank account via API
  const handleAddBank = async () => {
    setLoading(true);
    try {
      await paymentService.addPaymentMethod({
        type: 'bank_account',
        isDefault: paymentMethods.length === 0,
        bankDetails: {
          bankName: newBank.bankName,
          accountNumber: newBank.accountNumber,
          accountName: newBank.accountName,
          branchCode: newBank.branchCode,
        },
        billingAddress: {},
      });
      await fetchMethods();
      setOpenAddBank(false);
      setNewBank({
        bankName: '',
        accountNumber: '',
        accountName: '',
        branchCode: '',
      });
      enqueueSnackbar('Bank account added successfully', {
        variant: 'success',
      });
    } catch (err) {
      const message = toUserMessage(err, {
        fallback: 'Failed to add bank account. Please try again.',
      });
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a payment method as default
  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      await paymentService.setDefaultPaymentMethod(id);
      await fetchMethods();
      enqueueSnackbar('Default payment method updated', { variant: 'success' });
    } catch (err) {
      const message = toUserMessage(err, {
        fallback: 'Failed to set default payment method. Please try again.',
      });
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteRequest = (id) => {
    setMethodToDelete(id);
    setOpenConfirmDelete(true);
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await paymentService.deletePaymentMethod(methodToDelete);
      setOpenConfirmDelete(false);
      setMethodToDelete(null);
      await fetchMethods();
      enqueueSnackbar('Payment method removed', { variant: 'success' });
    } catch (err) {
      const message = toUserMessage(err, {
        fallback: 'Failed to delete payment method. Please try again.',
      });
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Get icon based on payment method type
  const getMethodIcon = (method) => {
    switch (method.icon) {
      case 'credit':
        return (
          <CreditCardIcon
            sx={{ fontSize: 40, color: theme.palette.info.main }}
          />
        );
      case 'mobile':
        return (
          <MobileIcon
            sx={{ fontSize: 40, color: theme.palette.warning.main }}
          />
        );
      case 'bank':
        return (
          <BankIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
        );
      default:
        return (
          <CreditCardIcon
            sx={{ fontSize: 40, color: theme.palette.info.main }}
          />
        );
    }
  };

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: withBottomNavSafeArea(72), md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}
      >
        <Helmet>
          <title>Payment Methods | Kelmah</title>
        </Helmet>
        <Box
          sx={{
            mb: { xs: 1.5, sm: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            position: { xs: 'sticky', sm: 'static' },
            top: { xs: withSafeAreaTop(HEADER_HEIGHT_MOBILE), sm: 'auto' },
            zIndex: { xs: Z_INDEX.sticky, sm: 'auto' },
            py: { xs: 0.5, sm: 0 },
            backgroundColor: { xs: 'background.default', sm: 'transparent' },
          }}
        >
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{ color: 'secondary.main', lineHeight: 1.1 }}
          >
            Payment Methods
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Tooltip title="Add credit card">
              <IconButton
                color="secondary"
                aria-label="Add credit card"
                sx={{
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'secondary.main',
                    outlineOffset: '2px',
                  },
                }}
                onClick={() => setOpenAddCard(true)}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add mobile money">
              <IconButton
                color="secondary"
                aria-label="Add mobile money"
                sx={{
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'secondary.main',
                    outlineOffset: '2px',
                  },
                }}
                onClick={() => setOpenAddMobile(true)}
              >
                <MobileIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add bank account">
              <IconButton
                color="secondary"
                aria-label="Add bank account"
                sx={{
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'secondary.main',
                    outlineOffset: '2px',
                  },
                }}
                onClick={() => setOpenAddBank(true)}
              >
                <BankIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            px: { xs: 0.25, sm: 0 },
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
          }}
        >
          Use an add button to save a card, mobile money number, or bank
          account. Set one method as default to make checkout faster.
        </Typography>

        <Card
          sx={{
            mb: { xs: 2, sm: 4 },
            border: '2px solid',
            borderColor: 'secondary.main',
            boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography
              variant={isMobile ? 'subtitle1' : 'h6'}
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              Manage Your Payment Methods
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add and manage your payment methods to easily fund your wallet,
              pay for services, or receive payments. We support credit/debit
              cards, mobile money services, and bank accounts.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 2 },
                mt: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme.palette.info.light,
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <CreditCardIcon
                  sx={{ mr: 1, color: theme.palette.info.main }}
                />
                <Typography variant="body2">Credit/Debit Cards</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme.palette.warning.light,
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <MobileIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="body2">
                  Mobile Money (MTN, Vodafone, AirtelTigo)
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme.palette.success.light,
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <BankIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                <Typography variant="body2">Bank Accounts</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={fetchMethods}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 2 }}>
            {showLoadingHint && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Fetching payment methods is taking longer than usual. Please
                wait a bit or retry.
              </Alert>
            )}
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={`payment-methods-skeleton-${i}`}
                variant="rounded"
                height={80}
                sx={{ borderRadius: 2, mb: 2 }}
              />
            ))}
          </Box>
        ) : paymentMethods.length === 0 ? (
          <Paper
            sx={(theme) => ({
              p: 4,
              textAlign: 'center',
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 2,
              background: `linear-gradient(to right, #28313b, #485461, ${theme.palette.secondary.main})`,
              color: 'white',
            })}
          >
            <CreditCardIcon
              sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }}
            />
            <Typography variant="h6" color="secondary.main" gutterBottom>
              No payment methods yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add a card, mobile money number, or bank account to fund your
              wallet, pay workers, or receive payouts.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
              startIcon={<AddIcon />}
              onClick={() => setOpenAddCard(true)}
            >
              Add a payment method
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 1.25, sm: 3 }}>
            {paymentMethods.map((method) => (
              <Grid item xs={12} sm={6} md={4} key={method.id || method._id}>
                <Paper
                  elevation={1}
                  sx={{
                    p: { xs: 1.5, sm: 3 },
                    borderRadius: 2,
                    borderLeft: method.isDefault
                      ? `4px solid ${theme.palette.secondary.main}`
                      : 'none',
                  }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getMethodIcon(method)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6">{method.name}</Typography>
                        {method.cardNumber && (
                          <Typography variant="body2" color="text.secondary">
                            {method.cardNumber}
                          </Typography>
                        )}
                        {method.phoneNumber && (
                          <Typography variant="body2" color="text.secondary">
                            {method.phoneNumber}
                          </Typography>
                        )}
                        {method.accountNumber && (
                          <Typography variant="body2" color="text.secondary">
                            Account: {method.accountNumber}
                          </Typography>
                        )}
                        {method.expiryDate && (
                          <Typography variant="body2" color="text.secondary">
                            Expires: {method.expiryDate}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {method.isDefault ? (
                        <Tooltip title="Default method">
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Default"
                            color="primary"
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Set as default">
                          <IconButton
                            size="small"
                            aria-label={`Set ${method.name || 'payment method'} as default`}
                            onClick={() =>
                              handleSetDefault(method.id || method._id)
                            }
                            sx={{
                              minWidth: TOUCH_TARGET_MIN,
                              minHeight: TOUCH_TARGET_MIN,
                              '&:focus-visible': {
                                outline: '3px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px',
                              },
                            }}
                          >
                            <CheckCircleIcon color="action" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete method">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Remove ${method.name || 'payment method'}`}
                          onClick={() =>
                            handleDeleteRequest(method.id || method._id)
                          }
                          sx={{
                            minWidth: TOUCH_TARGET_MIN,
                            minHeight: TOUCH_TARGET_MIN,
                            '&:focus-visible': {
                              outline: '3px solid',
                              outlineColor: 'error.main',
                              outlineOffset: '2px',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Card Dialog */}
        <Dialog
          open={openAddCard}
          onClose={() => setOpenAddCard(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="add-card-dialog-title"
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
        >
          <DialogTitle
            id="add-card-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CreditCardIcon sx={{ color: 'secondary.main', fontSize: 28 }} />{' '}
            Add card
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Tooltip title="16-digit card number">
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Card number"
                  value={newCard.cardNumber}
                  onChange={(e) =>
                    setNewCard({ ...newCard, cardNumber: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  placeholder="1234 5678 9012 3456"
                  inputProps={{
                    inputMode: 'numeric',
                    'aria-label': 'Card number',
                  }}
                />
              </Tooltip>

              <Tooltip title="Name on card">
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="Name on card"
                  value={newCard.cardholderName}
                  onChange={(e) =>
                    setNewCard({ ...newCard, cardholderName: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  placeholder="e.g. Kwame Asante"
                  inputProps={{ 'aria-label': 'Name on card' }}
                />
              </Tooltip>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Tooltip title="MM">
                    <TextField
                      fullWidth
                      size={isMobile ? 'small' : 'medium'}
                      label="MM"
                      value={newCard.expiryMonth}
                      onChange={(e) =>
                        setNewCard({ ...newCard, expiryMonth: e.target.value })
                      }
                      placeholder="MM"
                      inputProps={{
                        inputMode: 'numeric',
                        'aria-label': 'Card expiry month',
                      }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="YYYY">
                    <TextField
                      fullWidth
                      size={isMobile ? 'small' : 'medium'}
                      label="YYYY"
                      value={newCard.expiryYear}
                      onChange={(e) =>
                        setNewCard({ ...newCard, expiryYear: e.target.value })
                      }
                      placeholder="YYYY"
                      inputProps={{
                        inputMode: 'numeric',
                        'aria-label': 'Card expiry year',
                      }}
                    />
                  </Tooltip>
                </Grid>
              </Grid>

              <Tooltip title="3-digit code on back">
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label="CVV"
                  value={newCard.cvv}
                  onChange={(e) =>
                    setNewCard({ ...newCard, cvv: e.target.value })
                  }
                  type="password"
                  placeholder="123"
                  inputProps={{
                    inputMode: 'numeric',
                    'aria-label': 'Card CVV code',
                  }}
                />
              </Tooltip>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenAddCard(false)}
              variant="outlined"
              color="secondary"
              sx={{ borderWidth: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleAddCard}
              disabled={
                loading ||
                !newCard.cardNumber ||
                !newCard.expiryMonth ||
                !newCard.expiryYear ||
                !newCard.cvv
              }
              sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            >
              Add Card
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Mobile Money Dialog */}
        <Dialog
          open={openAddMobile}
          onClose={() => setOpenAddMobile(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="add-mobile-dialog-title"
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          }}
        >
          <DialogTitle
            id="add-mobile-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <MobileIcon sx={{ color: 'secondary.main', fontSize: 28 }} /> Add
            Mobile Money
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                select
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Provider"
                value={newMobile.provider}
                onChange={(e) =>
                  setNewMobile({ ...newMobile, provider: e.target.value })
                }
                sx={{ mb: 2 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="Vodafone">Vodafone Cash</option>
                <option value="AirtelTigo">AirtelTigo Money</option>
              </TextField>

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Phone Number"
                value={newMobile.phoneNumber}
                onChange={(e) =>
                  setNewMobile({ ...newMobile, phoneNumber: e.target.value })
                }
                sx={{ mb: 2 }}
                placeholder="0XX XXX XXXX"
                inputProps={{ inputMode: 'tel' }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Account Name"
                value={newMobile.name}
                onChange={(e) =>
                  setNewMobile({ ...newMobile, name: e.target.value })
                }
                placeholder="e.g. Kwame Asante"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddMobile(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddMobile}
              disabled={loading || !newMobile.phoneNumber}
            >
              Add Mobile Money
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Bank Account Dialog */}
        <Dialog
          open={openAddBank}
          onClose={() => setOpenAddBank(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="add-bank-dialog-title"
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          }}
        >
          <DialogTitle
            id="add-bank-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BankIcon sx={{ color: 'secondary.main', fontSize: 28 }} /> Add Bank
            Account
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                select
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Bank"
                value={newBank.bankName}
                onChange={(e) =>
                  setNewBank({ ...newBank, bankName: e.target.value })
                }
                sx={{ mb: 2 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select a bank</option>
                <option value="Ghana Commercial Bank">
                  Ghana Commercial Bank
                </option>
                <option value="Ecobank Ghana">Ecobank Ghana</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="Standard Chartered">Standard Chartered</option>
                <option value="Access Bank">Access Bank</option>
              </TextField>

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Account Number"
                value={newBank.accountNumber}
                onChange={(e) =>
                  setNewBank({ ...newBank, accountNumber: e.target.value })
                }
                sx={{ mb: 2 }}
                placeholder="e.g. 1234567890"
                inputProps={{ inputMode: 'numeric' }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Account Name"
                value={newBank.accountName}
                onChange={(e) =>
                  setNewBank({ ...newBank, accountName: e.target.value })
                }
                sx={{ mb: 2 }}
                placeholder="e.g. Kwame Asante"
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label="Branch Code (Optional)"
                value={newBank.branchCode}
                onChange={(e) =>
                  setNewBank({ ...newBank, branchCode: e.target.value })
                }
                placeholder="e.g. 001"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddBank(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddBank}
              disabled={
                loading ||
                !newBank.bankName ||
                !newBank.accountNumber ||
                !newBank.accountName
              }
            >
              Add Bank Account
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openConfirmDelete}
          onClose={() => setOpenConfirmDelete(false)}
          aria-labelledby="delete-method-confirm-dialog-title"
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          }}
        >
          <DialogTitle
            id="delete-method-confirm-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <DeleteIcon sx={{ color: 'error.main', fontSize: 28 }} /> Remove
            Payment Method
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove this payment method? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDelete(false)}>Cancel</Button>
            <Button
              color="error"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
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
            sx={{ minHeight: TOUCH_TARGET_MIN }}
            onClick={() => setOpenAddCard(true)}
          >
            Card
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ minHeight: TOUCH_TARGET_MIN }}
            onClick={() => setOpenAddMobile(true)}
          >
            Mobile
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ minHeight: TOUCH_TARGET_MIN, boxShadow: '0 2px 8px rgba(255,215,0,0.35)' }}
            onClick={() => setOpenAddBank(true)}
          >
            Bank
          </Button>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default PaymentMethodsPage;
