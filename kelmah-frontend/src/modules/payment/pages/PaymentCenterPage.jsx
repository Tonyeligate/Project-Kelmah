import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Divider,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  PhoneIphone as PhoneIphoneIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  HelpOutline as HelpOutlineIcon,
  Visibility as VisibilityIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { usePayments } from '../contexts/PaymentContext';
import TransactionsList from '../components/TransactionsList';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';

// Add currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

const WalletSummary = ({ balance, onDepositClick, onWithdrawClick }) => (
  <Paper elevation={4} sx={{ p: 3, borderRadius: 2, background: 'linear-gradient(to right, #28313b, #485461, #ffd700)', color: 'white', border: '2px solid', borderColor: 'secondary.main' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <AccountBalanceWalletIcon sx={{ mr: 1.5, fontSize: 32, opacity: 0.9, color: 'secondary.main' }} />
      <Typography variant="h6" sx={{ opacity: 0.9, color: 'secondary.main' }}>Wallet Balance</Typography>
    </Box>
    <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>{currencyFormatter.format(balance)}</Typography>
    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
      <Button variant="contained" color="success" startIcon={<ArrowUpwardIcon />} onClick={onDepositClick}>Deposit</Button>
      <Button variant="contained" color="warning" startIcon={<ArrowDownwardIcon />} onClick={onWithdrawClick}>Withdraw</Button>
    </Box>
  </Paper>
);

const TransactionHistory = ({ transactions }) => (
  <Paper sx={{ p: 3, borderRadius: 2 }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Transactions</Typography>
    <List>
      {transactions.slice(0, 5).map((tx, idx) => (
        <React.Fragment key={tx.id}>
          <ListItem>
            <ListItemIcon><Avatar sx={{ bgcolor: tx.type === 'deposit' ? 'success.light' : 'error.light' }}>{tx.type === 'deposit' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}</Avatar></ListItemIcon>
            <ListItemText primary={tx.title} secondary={format(new Date(tx.date), 'dd/MM/yyyy, hh:mm a')} />
            <Typography color={tx.type === 'deposit' ? 'success.main' : 'error.main'} fontWeight="bold">
              {(tx.type === 'deposit' ? '+' : '-') + currencyFormatter.format(tx.amount)}
            </Typography>
          </ListItem>
          {idx < transactions.slice(0, 4).length && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

const PaymentMethodsView = ({ methods }) => {
  // Empty state
  if (!methods || methods.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Methods
        </Typography>
        <Typography color="text.secondary">
          You have no methods saved.
        </Typography>
      </Paper>
    );
  }

  return (
  <Paper sx={{ p: 3, borderRadius: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Methods</Typography>
        <Tooltip title="Add method">
          <Button
            variant="contained"
            color="secondary"
            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/payment/methods"
          >
            Add
          </Button>
        </Tooltip>
    </Box>

    <Grid container spacing={2}>
      {methods.map(method => (
        <Grid item xs={12} md={6} key={method.id}>
            <Card variant="outlined" sx={{ p: 1, position: 'relative' }}>
              {method.isDefault && (
                <Tooltip title="Default method">
                  <Chip
                    label="Default"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Tooltip>
              )}
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Tooltip title={method.type === 'card' ? 'Card payment' : 'Mobile money'}>
                    {method.type === 'card'
                      ? <CreditCardIcon sx={{ mr: 1.5, fontSize: 30 }} color="action" />
                      : <PhoneIphoneIcon sx={{ mr: 1.5, fontSize: 30 }} color="action" />
                    }
                  </Tooltip>
                  <Typography variant="subtitle1">{method.name}</Typography>
              </Box>

                <Typography color="text.secondary" sx={{ ml: '38px' }}>
                  {method.cardNumber || method.phoneNumber}
                </Typography>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Tooltip title="Edit this method">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete this method">
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Paper>
);
};

const getStatusChip = (status) => {
    switch (status) {
        case 'Funded':
            return <Chip icon={<CheckCircleIcon />} label={status} color="success" size="small" variant="outlined" />;
        case 'Pending Release':
            return <Chip icon={<HourglassEmptyIcon />} label={status} color="warning" size="small" variant="outlined" />;
        default:
            return <Chip icon={<HelpOutlineIcon />} label={status} color="default" size="small" variant="outlined" />;
    }
};

const ActiveEscrows = ({ escrows }) => {
  // Empty state when no active escrows
  if (!escrows || escrows.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
      Active Escrows
    </Typography>
        <Typography color="text.secondary">
          You have no active escrows.
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Active Escrows ({escrows.length})</Typography>
        <Grid container spacing={3}>
            {escrows.map(escrow => (
                <Grid item xs={12} md={6} key={escrow.id}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              {/* Status icon for quick recognition */}
                              <Avatar sx={{ bgcolor: 'transparent', color: escrow.status === 'Funded' ? 'success.main' : escrow.status === 'Pending Release' ? 'warning.main' : 'text.secondary' }}>
                                {escrow.status === 'Funded' ? <CheckCircleIcon /> : escrow.status === 'Pending Release' ? <HourglassEmptyIcon /> : <HelpOutlineIcon />}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {escrow.otherParty}
                                    </Typography>
                                    <Typography variant="h6" component="div" fontWeight="bold">
                                        {escrow.title}
                                    </Typography>
                                </Box>
                                {getStatusChip(escrow.status)}
                            </Box>

                            <Typography sx={{ my: 2, fontSize: 24, fontWeight: 'bold' }} color="primary.main">
                                {currencyFormatter.format(escrow.amount)}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Tooltip title="View escrow contract details">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
                                    component={RouterLink}
                                    to={`/contracts/${escrow.contractId}`}
                                >
                                    View Contract
                                </Button>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Paper>
);
};

// NEW: big icon-plus-number cards for quick at-a-glance metrics
const SummaryCard = ({ icon: Icon, count, label }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 2, textAlign: 'center', transition: 'transform 0.2s', border: '2px solid', borderColor: 'secondary.main', '&:hover': { transform: 'scale(1.03)', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' } }}>
    <Icon sx={{ fontSize: 28, mb: 0.5, color: 'secondary.main' }} />
    <Typography variant="h5" fontWeight="bold" sx={{ color: 'secondary.main' }}>{count}</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
  </Paper>
);

// Updated: bills list view with icons, tooltips, and date formatting
const BillsView = ({ bills, actionLoading, onPayBill }) => {
  if (!bills || bills.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Your Bills
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          You have no bills to pay at this time.
    </Typography>
      </Paper>
    );
  }
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Your Bills
      </Typography>
      <List>
        {bills.map((bill, idx) => (
          <React.Fragment key={bill.id}>
            <ListItem
              secondaryAction={
                bill.status === 'unpaid' ? (
                  <Tooltip title="Pay this bill">
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
                      onClick={() => onPayBill(bill.id)}
                      disabled={actionLoading === bill.id}
                    >
                      {actionLoading === bill.id ? <CircularProgress size={20} /> : 'Pay'}
                    </Button>
                  </Tooltip>
                ) : null
              }
            >
              <ListItemIcon>
                {bill.status === 'paid' ? (
                  <CheckCircleIcon color="success" />
                ) : bill.status === 'unpaid' ? (
                  <HourglassEmptyIcon color="warning" />
                ) : (
                  <ErrorOutlineIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={bill.title}
                secondary={`Due: ${format(new Date(bill.dueDate), 'd MMMM yyyy')}`}
              />
              <Typography
                fontWeight="bold"
                color={
                  bill.status === 'overdue'
                    ? 'error.main'
                    : bill.status === 'paid'
                    ? 'success.main'
                    : 'text.primary'
                }
                sx={{ ml: 2 }}
              >
                {currencyFormatter.format(bill.amount)}
              </Typography>
              <Chip
                label={bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                size="small"
                color={
                  bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'error' : 'warning'
                }
                sx={{ ml: 1 }}
              />
            </ListItem>
            {idx < bills.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

const PaymentCenterPage = () => {
  const { loading, error, walletBalance, transactions, paymentMethods, escrows, bills, actionLoading, payBill, addFunds, withdrawFunds, fetchTransactions } = usePayments();
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  // Transaction filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const applyFilters = () => {
    setPage(1);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterType !== 'all') params.type = filterType;
    fetchTransactions(params);
  };
  // Pagination state and derived page items
  const [page, setPage] = useState(1);
  const perPage = 5;
  const pageCount = Math.ceil(transactions.length / perPage);
  const pagedTransactions = transactions.slice((page - 1) * perPage, page * perPage);

  // Bills filters & pagination
  const [billStartDate, setBillStartDate] = useState('');
  const [billEndDate, setBillEndDate] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('all');
  const [appliedBillStartDate, setAppliedBillStartDate] = useState('');
  const [appliedBillEndDate, setAppliedBillEndDate] = useState('');
  const [appliedBillStatus, setAppliedBillStatus] = useState('all');
  const [billPage, setBillPage] = useState(1);
  const billPerPage = 5;
  const applyBillFilters = () => {
    setAppliedBillStartDate(billStartDate);
    setAppliedBillEndDate(billEndDate);
    setAppliedBillStatus(billStatusFilter);
    setBillPage(1);
  };
  const clearBillFilters = () => {
    setBillStartDate('');
    setBillEndDate('');
    setBillStatusFilter('all');
    setAppliedBillStartDate('');
    setAppliedBillEndDate('');
    setAppliedBillStatus('all');
    setBillPage(1);
  };
  const filteredBills = bills.filter((b) => {
    let ok = true;
    if (appliedBillStartDate) ok = ok && new Date(b.dueDate) >= new Date(appliedBillStartDate);
    if (appliedBillEndDate) ok = ok && new Date(b.dueDate) <= new Date(appliedBillEndDate);
    if (appliedBillStatus !== 'all') ok = ok && b.status === appliedBillStatus;
    return ok;
  });
  const billPageCount = Math.ceil(filteredBills.length / billPerPage);
  const pagedBills = filteredBills.slice((billPage - 1) * billPerPage, billPage * billPerPage);

  // Escrows filters & pagination
  const [escrowStatusFilter, setEscrowStatusFilter] = useState('all');
  const [appliedEscrowStatus, setAppliedEscrowStatus] = useState('all');
  const [escrowPage, setEscrowPage] = useState(1);
  const escrowPerPage = 5;
  const applyEscrowFilters = () => {
    setAppliedEscrowStatus(escrowStatusFilter);
    setEscrowPage(1);
  };
  const filteredEscrows = escrows.filter(e =>
    appliedEscrowStatus === 'all' || e.status === appliedEscrowStatus
  );
  const escrowPageCount = Math.ceil(filteredEscrows.length / escrowPerPage);
  const pagedEscrows = filteredEscrows.slice(
    (escrowPage - 1) * escrowPerPage,
    escrowPage * escrowPerPage
  );

  const openDepositDialog = () => { setAmount(''); setMethodId(''); setDepositOpen(true); };
  const closeDepositDialog = () => setDepositOpen(false);
  const openWithdrawDialog = () => { setAmount(''); setMethodId(''); setWithdrawOpen(true); };
  const closeWithdrawDialog = () => setWithdrawOpen(false);

  const handleTabChange = (_, newVal) => setTabIndex(newVal);

  if (loading) return <Container sx={{ py: 4 }}><Skeleton variant="rectangular" height={300} /></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: 'secondary.main' }}>Payments</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Manage your wallet, transactions, and payment methods.</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={4}>
          <WalletSummary balance={walletBalance} onDepositClick={openDepositDialog} onWithdrawClick={openWithdrawDialog} />
        </Grid>
        
        <Grid item xs={12} lg={8}>
          {/* Summary row for illiterate-friendly icon counts */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <SummaryCard icon={ReceiptIcon} count={transactions.length} label="Transactions" />
            </Grid>
            <Grid item xs={3}>
              <SummaryCard icon={CreditCardIcon} count={paymentMethods.length} label="Methods" />
            </Grid>
            <Grid item xs={3}>
              <SummaryCard icon={GavelIcon} count={escrows.length} label="Escrows" />
            </Grid>
            <Grid item xs={3}>
              <SummaryCard icon={ReceiptLongIcon} count={bills.length} label="Bills" />
            </Grid>
          </Grid>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="payment center tabs"
              indicatorColor="secondary"
              textColor="inherit"
              sx={{ '& .MuiTab-root': { color: 'text.secondary' }, '& .Mui-selected': { color: 'secondary.main' } }}
            >
              <Tab icon={<ReceiptIcon />} iconPosition="start" label="Transactions" />
              <Tab icon={<CreditCardIcon />} iconPosition="start" label="Payment Methods" />
              <Tab icon={<GavelIcon />} iconPosition="start" label="Active Escrows" />
              <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Bills" />
            </Tabs>
          </Box>
          
          {tabIndex === 0 && (
            <>
              {/* Filters bar */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Transactions from this date">
                  <TextField
                    label="From"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Tooltip>
                <Tooltip title="Transactions up to this date">
                  <TextField
                    label="To"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Tooltip>
                <Tooltip title="Filter by type">
                  <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="deposit">Deposit</MenuItem>
                      <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
                <Tooltip title="Filter">
                  <Button variant="outlined" onClick={applyFilters}>Filter</Button>
                </Tooltip>
              </Box>
              <TransactionsList transactions={pagedTransactions} loading={loading} />
              {pageCount > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination count={pageCount} page={page} onChange={(e, val) => setPage(val)} color="primary" />
                </Box>
              )}
            </>
          )}
          {tabIndex === 1 && <PaymentMethodsView methods={paymentMethods} />}
          {tabIndex === 2 && (
            <>
              {/* Escrows filters */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Filter by status">
                  <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={escrowStatusFilter}
                      label="Status"
                      onChange={(e) => setEscrowStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="Funded">Funded</MenuItem>
                      <MenuItem value="Pending Release">Pending Release</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
                <Tooltip title="Filter">
                  <Button variant="outlined" onClick={applyEscrowFilters}>Filter</Button>
                </Tooltip>
              </Box>
              <ActiveEscrows escrows={pagedEscrows} />
              {escrowPageCount > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination count={escrowPageCount} page={escrowPage} onChange={(e, val) => setEscrowPage(val)} color="primary" />
                </Box>
              )}
            </>
          )}
          {tabIndex === 3 && (
            <>
              {/* Bills filters */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Bills from this date">
                  <TextField
                    label="From"
                    type="date"
                    value={billStartDate}
                    onChange={(e) => setBillStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Tooltip>
                <Tooltip title="Bills up to this date">
                  <TextField
                    label="To"
                    type="date"
                    value={billEndDate}
                    onChange={(e) => setBillEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Tooltip>
                <Tooltip title="Filter by status">
                  <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={billStatusFilter}
                      label="Status"
                      onChange={(e) => setBillStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="unpaid">Unpaid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
                <Tooltip title="Filter">
                  <Button variant="outlined" onClick={applyBillFilters}>Filter</Button>
                </Tooltip>
                <Tooltip title="Clear filters">
                  <Button variant="outlined" color="secondary" onClick={clearBillFilters}>Clear</Button>
                </Tooltip>
              </Box>
              {filteredBills.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {(billPage - 1) * billPerPage + 1} - {Math.min(filteredBills.length, billPage * billPerPage)} of {filteredBills.length} bills
                  </Typography>
                </Box>
              )}
              <BillsView bills={pagedBills} actionLoading={actionLoading} onPayBill={payBill} />
              {billPageCount > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination count={billPageCount} page={billPage} onChange={(e, val) => setBillPage(val)} color="primary" />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
      {/* Deposit & Withdraw Dialogs */}
      <Dialog
        open={depositOpen}
        onClose={closeDepositDialog}
        fullWidth
        maxWidth="xs"
        BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' } }}
        PaperProps={{ sx: {
          bgcolor: theme.palette.grey[900],
          color: theme.palette.text.primary,
          borderRadius: '24px',
          p: 3,
          border: `2px solid ${theme.palette.secondary.main}`,
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.5)'
        } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ArrowUpwardIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>Add Money</Typography>
        </DialogTitle>
        <Divider sx={{ borderColor: theme.palette.secondary.main, my: 1, height: 2 }} />
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Tooltip title="Enter amount in Ghana Cedi">
              <TextField
                variant="filled"
                label="Amount (GHS)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                InputProps={{ disableUnderline: true }}
                InputLabelProps={{ sx: { color: theme.palette.secondary.main } }}
                sx={{ bgcolor: theme.palette.grey[800], borderRadius: 1, p: 1, color: theme.palette.text.primary, border: `1px solid ${theme.palette.secondary.main}`, boxShadow: 'inset 0 0 8px rgba(255, 215, 0, 0.3)' }}
              />
            </Tooltip>
            <Tooltip title="Choose a payment method">
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.secondary.main }}>Method</InputLabel>
                <Select
                  variant="filled"
                  label="Method"
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  inputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: theme.palette.grey[800], borderRadius: 1, p: '8px 12px', color: theme.palette.text.primary, border: `1px solid ${theme.palette.secondary.main}`, boxShadow: 'inset 0 0 8px rgba(255, 215, 0, 0.3)' }}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDepositDialog} variant="outlined" color="secondary" sx={{ borderWidth: 2 }}>Cancel</Button>
          <Button
            onClick={() => { addFunds(Number(amount), methodId); closeDepositDialog(); }}
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            disabled={!amount || !methodId}
            sx={{ boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)' }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={withdrawOpen}
        onClose={closeWithdrawDialog}
        fullWidth
        maxWidth="xs"
        BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' } }}
        PaperProps={{ sx: {
          bgcolor: theme.palette.grey[900],
          color: theme.palette.text.primary,
          borderRadius: '24px',
          p: 3,
          border: `2px solid ${theme.palette.secondary.main}`,
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.5)'
        } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ArrowDownwardIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>Withdraw</Typography>
        </DialogTitle>
        <Divider sx={{ borderColor: theme.palette.secondary.main, my: 1, height: 2 }} />
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Tooltip title="Enter amount to withdraw">
              <TextField
                variant="filled"
                label="Amount (GHS)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                InputProps={{ disableUnderline: true }}
                InputLabelProps={{ sx: { color: theme.palette.secondary.main } }}
                sx={{ bgcolor: theme.palette.grey[800], borderRadius: 1, p: 1, color: theme.palette.text.primary, border: `1px solid ${theme.palette.secondary.main}`, boxShadow: 'inset 0 0 8px rgba(255, 215, 0, 0.3)' }}
              />
            </Tooltip>
            <Tooltip title="Choose a withdrawal method">
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.secondary.main }}>Method</InputLabel>
                <Select
                  variant="filled"
                  label="Method"
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  inputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: theme.palette.grey[800], borderRadius: 1, p: '8px 12px', color: theme.palette.text.primary, border: `1px solid ${theme.palette.secondary.main}`, boxShadow: 'inset 0 0 8px rgba(255, 215, 0, 0.3)' }}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWithdrawDialog} variant="outlined" color="secondary" sx={{ borderWidth: 2 }}>Cancel</Button>
          <Button
            onClick={() => { withdrawFunds(Number(amount), methodId); closeWithdrawDialog(); }}
            variant="contained"
            color="secondary"
            startIcon={<ArrowDownwardIcon />}
            disabled={!amount || !methodId}
            sx={{ boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)' }}
          >
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentCenterPage;
 