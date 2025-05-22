import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as TransferIcon,
  Receipt as ReceiptIcon,
  CreditCard as CardIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as BalanceIcon,
  Payment as PaymentIcon,
  LocalAtm as AtmIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import ContractService from '../../services/ContractService';
import PaymentService from '../../services/PaymentService';
import PaymentDialog from './PaymentDialog';

const Wallet = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletResponse, transactionsResponse, statsResponse] = await Promise.all([
        PaymentService.getWallet(),
        PaymentService.getTransactions(),
        PaymentService.getPaymentStats()
      ]);
      
      setWallet(walletResponse.data);
      setTransactions(transactionsResponse.data);
      setStats(statsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      await PaymentService.deposit(parseFloat(depositAmount));
      fetchWalletData();
      setDepositDialogOpen(false);
      setDepositAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > wallet.balance) {
      setError('Insufficient funds');
      return;
    }

    try {
      setProcessing(true);
      await PaymentService.withdraw(parseFloat(withdrawAmount));
      fetchWalletData();
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMenuOpen = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <AddIcon color="success" />;
      case 'withdrawal':
        return <RemoveIcon color="error" />;
      case 'escrow_funding':
        return <SecurityIcon color="primary" />;
      case 'escrow_release':
        return <CheckCircleIcon color="success" />;
      default:
        return <SwapHorizIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const renderBalanceCard = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BalanceIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4">
              {wallet ? formatAmount(wallet.balance) : 'Loading...'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Available Balance
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Escrow Balance
            </Typography>
            <Typography variant="h6">
              {wallet ? formatAmount(wallet.escrowBalance) : 'Loading...'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Pending Balance
            </Typography>
            <Typography variant="h6">
              {wallet ? formatAmount(wallet.pendingBalance) : 'Loading...'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStatsCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Statistics
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Deposits
            </Typography>
            <Typography variant="h6">
              {stats ? formatAmount(stats.totalDeposits) : 'Loading...'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Withdrawals
            </Typography>
            <Typography variant="h6">
              {stats ? formatAmount(stats.totalWithdrawals) : 'Loading...'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Escrow
            </Typography>
            <Typography variant="h6">
              {stats ? formatAmount(stats.totalEscrow) : 'Loading...'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Fees
            </Typography>
            <Typography variant="h6">
              {stats ? formatAmount(stats.totalFees) : 'Loading...'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderActionsCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDepositDialogOpen(true)}
            >
              Deposit
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RemoveIcon />}
              onClick={() => setWithdrawDialogOpen(true)}
            >
              Withdraw
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={() => setTransferDialogOpen(true)}
            >
              Transfer
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading && !wallet) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Wallet</Typography>
        <Tooltip title="Your wallet balance and transaction history">
          <IconButton>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderBalanceCard()}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderActionsCard()}
        </Grid>
        <Grid item xs={12}>
          {renderStatsCard()}
        </Grid>
      </Grid>

      <PaymentDialog
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        type="deposit"
        onSuccess={handleDeposit}
      />

      <PaymentDialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        type="withdrawal"
        onSuccess={handleWithdraw}
      />

      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Funds</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipient Email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!amount || !recipient}
            onClick={() => {
              // Handle transfer
              setTransferDialogOpen(false);
            }}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wallet; 