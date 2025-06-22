import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Slide,
  IconButton,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Gavel as GavelIcon, // For Escrow
} from '@mui/icons-material';
import { usePayments } from '../contexts/PaymentContext';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';

// --- Re-styled Components integrated directly for simplicity ---

const WalletSummary = ({ balance, onWithdrawClick, onDepositClick }) => (
  <Paper
    elevation={4}
    sx={{
      p: 4,
      borderRadius: 4,
      color: '#fff',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Typography variant="h6" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
        Current Balance
      </Typography>
      <Typography variant="h2" fontWeight="bold" sx={{ mb: 3 }}>
        ${balance.toFixed(2)}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={onDepositClick}
            sx={{
              py: 1.5,
              bgcolor: 'success.light',
              '&:hover': { bgcolor: 'success.main' },
            }}
          >
            Deposit
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<RemoveCircleIcon />}
            onClick={onWithdrawClick}
            sx={{
              py: 1.5,
              bgcolor: 'error.light',
              '&:hover': { bgcolor: 'error.main' },
            }}
          >
            Withdraw
          </Button>
        </Grid>
      </Grid>
    </Box>
  </Paper>
);

const ActiveEscrows = ({ escrows }) => (
  <Paper elevation={2} sx={{ p: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
      Active Escrows
    </Typography>
    <List>
      {escrows.map((escrow, index) => (
        <React.Fragment key={escrow.id}>
          <ListItem
            secondaryAction={
              <Button
                variant="outlined"
                size="small"
                component={RouterLink}
                to={`/contracts/${escrow.contractId}`}
              >
                View
              </Button>
            }
          >
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <GavelIcon />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body1" fontWeight="500">{escrow.title}</Typography>}
              secondary={`With ${escrow.otherParty} - Status: ${escrow.status}`}
            />
            <Typography variant="body1" fontWeight="bold">
              ${escrow.amount.toFixed(2)}
            </Typography>
          </ListItem>
          {index < escrows.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

const TransactionHistory = ({ transactions }) => (
  <Paper elevation={2} sx={{ p: 3, backgroundColor: 'background.paper', borderRadius: 2, mt: 4 }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
      Recent Transactions
    </Typography>
    <List>
      {transactions.slice(0, 5).map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <ListItem>
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: transaction.type === 'deposit' ? 'success.main' : 'error.main',
                }}
              >
                {transaction.type === 'deposit' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" fontWeight="500">
                  {transaction.title}
                </Typography>
              }
              secondary={format(new Date(transaction.date), 'MMMM d, yyyy')}
            />
            <Typography
              variant="body1"
              fontWeight="bold"
              color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
            >
              {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </Typography>
          </ListItem>
          {index < transactions.slice(0, 5).length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- Main Payment Center Page ---

const PaymentCenterPage = () => {
  const { loading, error, walletBalance, transactions, addFunds, withdrawFunds } = usePayments();
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [amount, setAmount] = useState('');
  const [dialogMode, setDialogMode] = useState('deposit'); // 'deposit' or 'withdraw'

  // Mock data for escrows, as it's not in the context yet
  const mockEscrows = [
    { id: 1, contractId: 'c1', title: 'Kitchen Renovation Project', otherParty: 'Jane Doe', amount: 1500, status: 'Funded' },
    { id: 2, contractId: 'c2', title: 'Website Development', otherParty: 'John Smith', amount: 800, status: 'Pending Release' },
    { id: 3, contractId: 'c3', title: 'Garden Landscaping', otherParty: 'Emily White', amount: 550, status: 'Funded' },
  ];

  const handleOpenDialog = (mode) => {
    setDialogMode(mode);
    setAmount('');
    if (mode === 'deposit') setOpenDeposit(true);
    if (mode === 'withdraw') setOpenWithdraw(true);
  };

  const handleCloseDialog = () => {
    setOpenDeposit(false);
    setOpenWithdraw(false);
  };
  
  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    if (dialogMode === 'deposit') {
      addFunds(numericAmount);
    } else {
      withdrawFunds(numericAmount);
    }
    handleCloseDialog();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 36, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Payment Center
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/payment/methods"
          startIcon={<SettingsIcon />}
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        >
          Payment Methods
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <WalletSummary
            balance={walletBalance}
            onDepositClick={() => handleOpenDialog('deposit')}
            onWithdrawClick={() => handleOpenDialog('withdraw')}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <ActiveEscrows escrows={mockEscrows} />
          <TransactionHistory transactions={transactions} />
        </Grid>
      </Grid>
      
      {/* Re-styled Dialog */}
      <Dialog
        open={openDeposit || openWithdraw}
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {dialogMode === 'deposit' ? 'Add Funds to Wallet' : 'Withdraw Funds'}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" gutterBottom>
            Enter the amount you wish to {dialogMode}.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <Box sx={{ mr: 1, color: 'text.secondary' }}>$</Box>,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === 'deposit' ? 'Deposit Funds' : 'Confirm Withdrawal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentCenterPage; 