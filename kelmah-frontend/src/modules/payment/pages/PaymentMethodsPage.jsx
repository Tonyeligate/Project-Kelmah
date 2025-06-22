import React, { useState, useEffect } from 'react';
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
  Divider,
  Card,
  CardContent,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  MobileFriendly as MobileIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import paymentsApi from '../../../api/services/paymentsApi';
import { useTheme } from '@mui/material/styles';

// Demo payment methods for initial display
const DEMO_PAYMENT_METHODS = [
  {
    id: 1,
    type: 'card',
    name: 'Visa Card',
    cardNumber: '•••• •••• •••• 4242',
    expiryDate: '05/25',
    isDefault: true,
    icon: 'credit'
  },
  {
    id: 2,
    type: 'card',
    name: 'Mastercard',
    cardNumber: '•••• •••• •••• 5678',
    expiryDate: '03/24',
    isDefault: false,
    icon: 'credit'
  },
  {
    id: 3,
    type: 'mobile',
    name: 'MTN Mobile Money',
    phoneNumber: '+233 •••• 7890',
    isDefault: false,
    icon: 'mobile'
  },
  {
    id: 4,
    type: 'bank',
    name: 'Ghana Commercial Bank',
    accountNumber: '•••• •••• 3456',
    isDefault: false,
    icon: 'bank'
  }
];

const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
    cvv: ''
  });
  
  const [newMobile, setNewMobile] = useState({
    provider: 'MTN',
    phoneNumber: '',
    name: ''
  });
  
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branchCode: ''
  });
  
  const [methodToDelete, setMethodToDelete] = useState(null);
  
  const user = useSelector(state => state.auth.user);
  const theme = useTheme();
  
  // Fetch payment methods from server
  const fetchMethods = async () => {
    setLoading(true);
    try {
      const methods = await paymentsApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize with loading effect
  useEffect(() => {
    fetchMethods();
  }, []);
  
  // Handle adding a new credit card via API
  const handleAddCard = async () => {
    setLoading(true);
    try {
      await paymentsApi.addPaymentMethod({
        type: 'credit_card',
        isDefault: paymentMethods.length === 0,
        cardDetails: {
          number: newCard.cardNumber,
          expMonth: Number(newCard.expiryMonth),
          expYear: Number(newCard.expiryYear),
          cvc: newCard.cvv,
          cardholderName: newCard.cardholderName
        },
        billingAddress: {} // include address if available
      });
      await fetchMethods();
    setOpenAddCard(false);
      setNewCard({ cardNumber: '', expiryMonth: '', expiryYear: '', cardholderName: '', cvv: '' });
    } catch (err) {
      setError(err.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding mobile money via API
  const handleAddMobile = async () => {
    setLoading(true);
    try {
      await paymentsApi.addPaymentMethod({
        type: 'mobile_money',
      isDefault: paymentMethods.length === 0,
        mobileDetails: {
          provider: newMobile.provider,
          phoneNumber: newMobile.phoneNumber,
          name: newMobile.name
        },
        billingAddress: {}
      });
      await fetchMethods();
    setOpenAddMobile(false);
      setNewMobile({ provider: 'MTN', phoneNumber: '', name: '' });
    } catch (err) {
      setError(err.message || 'Failed to add mobile money');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding bank account via API
  const handleAddBank = async () => {
    setLoading(true);
    try {
      await paymentsApi.addPaymentMethod({
        type: 'bank_account',
      isDefault: paymentMethods.length === 0,
        bankDetails: {
          bankName: newBank.bankName,
          accountNumber: newBank.accountNumber,
          accountName: newBank.accountName,
          branchCode: newBank.branchCode
        },
        billingAddress: {}
      });
      await fetchMethods();
    setOpenAddBank(false);
      setNewBank({ bankName: '', accountNumber: '', accountName: '', branchCode: '' });
    } catch (err) {
      setError(err.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle setting a payment method as default
  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      await paymentsApi.setDefaultPaymentMethod(id);
      await fetchMethods();
    } catch (err) {
      setError(err.message || 'Failed to set default payment method');
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
      await paymentsApi.deletePaymentMethod(methodToDelete);
      setOpenConfirmDelete(false);
      setMethodToDelete(null);
      await fetchMethods();
    } catch (err) {
      setError(err.message || 'Failed to delete payment method');
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon based on payment method type
  const getMethodIcon = (method) => {
    switch (method.icon) {
      case 'credit':
        return <CreditCardIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />;
      case 'mobile':
        return <MobileIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />;
      case 'bank':
        return <BankIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />;
      default:
        return <CreditCardIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>Methods</Typography>
        <Box>
          <Tooltip title="Add credit card">
            <IconButton color="secondary" sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }} onClick={() => setOpenAddCard(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add mobile money">
            <IconButton color="secondary" sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }} onClick={() => setOpenAddMobile(true)}>
              <MobileIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add bank account">
            <IconButton color="secondary" sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }} onClick={() => setOpenAddBank(true)}>
              <BankIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4, border: '2px solid', borderColor: 'secondary.main', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>Manage Your Payment Methods</Typography>
          <Typography variant="body2" color="text.secondary">
            Add and manage your payment methods to easily fund your wallet, pay for services, or receive payments.
            We support credit/debit cards, mobile money services, and bank accounts.
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.palette.info.light, p: 1, borderRadius: 1 }}>
              <CreditCardIcon sx={{ mr: 1, color: theme.palette.info.main }} />
              <Typography variant="body2">Credit/Debit Cards</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.palette.warning.light, p: 1, borderRadius: 1 }}>
              <MobileIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
              <Typography variant="body2">Mobile Money (MTN, Vodafone, AirtelTigo)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.palette.success.light, p: 1, borderRadius: 1 }}>
              <BankIcon sx={{ mr: 1, color: theme.palette.success.main }} />
              <Typography variant="body2">Bank Accounts</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : paymentMethods.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px solid', borderColor: 'secondary.main', borderRadius: 2, background: 'linear-gradient(to right, #28313b, #485461, #ffd700)', color: 'white' }}>
          <CreditCardIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" color="secondary.main" gutterBottom>
            No Payment Methods Added
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add a payment method to get started with transactions
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            startIcon={<AddIcon />}
            onClick={() => setOpenAddCard(true)}
          >
            Add Payment Method
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} md={6} key={method.id}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  borderLeft: method.isDefault ? `4px solid ${theme.palette.secondary.main}` : 'none',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                        <IconButton size="small" onClick={() => handleSetDefault(method.id)}>
                          <CheckCircleIcon color="action" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete method">
                      <IconButton size="small" color="error" onClick={() => handleDeleteRequest(method.id)}>
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
        PaperProps={{ sx: { border: '2px solid', borderColor: 'secondary.main', boxShadow: '0 0 16px rgba(255,215,0,0.5)' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: 'secondary.main', fontSize: 28 }} /> Card
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Tooltip title="16-digit card number">
              <TextField
                fullWidth
                label="Number"
                value={newCard.cardNumber}
                onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="1234 5678 9012 3456"
              />
            </Tooltip>
            
            <Tooltip title="Name on card">
              <TextField
                fullWidth
                label="Name"
                value={newCard.cardholderName}
                onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Tooltip>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Tooltip title="MM">
                  <TextField
                    fullWidth
                    label="MM"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                    placeholder="MM"
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="YYYY">
                  <TextField
                    fullWidth
                    label="YYYY"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                    placeholder="YYYY"
                  />
                </Tooltip>
              </Grid>
            </Grid>
            
            <Tooltip title="3-digit code on back">
              <TextField
                fullWidth
                label="CVV"
                value={newCard.cvv}
                onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                type="password"
                placeholder="123"
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
            disabled={!newCard.cardNumber || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv}
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
          >
            Add Card
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Mobile Money Dialog */}
      <Dialog open={openAddMobile} onClose={() => setOpenAddMobile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Mobile Money</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              fullWidth
              label="Provider"
              value={newMobile.provider}
              onChange={(e) => setNewMobile({ ...newMobile, provider: e.target.value })}
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
              label="Phone Number"
              value={newMobile.phoneNumber}
              onChange={(e) => setNewMobile({ ...newMobile, phoneNumber: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="0XX XXX XXXX"
            />
            
            <TextField
              fullWidth
              label="Account Name"
              value={newMobile.name}
              onChange={(e) => setNewMobile({ ...newMobile, name: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddMobile(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMobile}
            disabled={!newMobile.phoneNumber}
          >
            Add Mobile Money
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Bank Account Dialog */}
      <Dialog open={openAddBank} onClose={() => setOpenAddBank(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              fullWidth
              label="Bank"
              value={newBank.bankName}
              onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
              sx={{ mb: 2 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select a bank</option>
              <option value="Ghana Commercial Bank">Ghana Commercial Bank</option>
              <option value="Ecobank Ghana">Ecobank Ghana</option>
              <option value="Zenith Bank">Zenith Bank</option>
              <option value="Standard Chartered">Standard Chartered</option>
              <option value="Access Bank">Access Bank</option>
            </TextField>
            
            <TextField
              fullWidth
              label="Account Number"
              value={newBank.accountNumber}
              onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Account Name"
              value={newBank.accountName}
              onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Branch Code (Optional)"
              value={newBank.branchCode}
              onChange={(e) => setNewBank({ ...newBank, branchCode: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddBank(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddBank}
            disabled={!newBank.bankName || !newBank.accountNumber || !newBank.accountName}
          >
            Add Bank Account
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirmDelete} onClose={() => setOpenConfirmDelete(false)}>
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this payment method? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentMethodsPage; 