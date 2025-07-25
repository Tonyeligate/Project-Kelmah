import React, { useState, useEffect } from 'react';
import { usePayments } from '../contexts/PaymentContext';
import BillPage from './BillPage';
import PaymentMethodsPage from './PaymentMethodsPage';
import PaymentSettingsPage from './PaymentSettingsPage';
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
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Skeleton,
  Grow,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import TransactionsList from '../components/TransactionsList';
import { Link as RouterLink } from 'react-router-dom';

// Currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
});

const PaymentsPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { loading, error, walletBalance, transactions, fetchTransactions } =
    usePayments();
  // Transaction filters & pagination
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 5;
  const applyFilters = () => {
    setPage(1);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filterType !== 'all') params.type = filterType;
    fetchTransactions(params);
  };
  const pageCount = Math.ceil(transactions.length / perPage);
  const pagedTransactions = transactions.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
          Payments
        </Typography>
        <Button
          startIcon={<MoreVertIcon />}
          variant="outlined"
          color="secondary"
          sx={{ borderWidth: 2, boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
          onClick={handleMenuOpen}
        >
          Actions
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            },
          }}
        >
          <MenuItem
            component={RouterLink}
            to="/payment/methods"
            onClick={handleMenuClose}
          >
            Manage Payment Methods
          </MenuItem>
          <MenuItem
            component={RouterLink}
            to="/payment/bill"
            onClick={handleMenuClose}
          >
            View Bills
          </MenuItem>
        </Menu>
      </Box>

      <Grid container spacing={3}>
        {/* Wallet Balance */}
        <Grid item xs={12}>
          <Paper
            sx={(theme) => ({
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              background: `linear-gradient(to right, #28313b, #485461, ${theme.palette.secondary.main})`,
              color: 'white',
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            })}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              Wallet Balance
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={180} height={48} />
            ) : (
              <Grow in={animate} timeout={800}>
                <Typography variant="h3" sx={{ color: 'secondary.main' }}>
                  {currencyFormatter.format(walletBalance)}
                </Typography>
              </Grow>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Paper
            sx={{
              width: '100%',
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            }}
          >
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="secondary"
              textColor="inherit"
              sx={{
                '& .MuiTab-root': { color: 'text.secondary' },
                '& .Mui-selected': { color: 'secondary.main' },
              }}
            >
              <Tab label="Transactions" />
              <Tab label="Bills" />
              <Tab label="Payment Methods" />
              <Tab label="Settings" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {selectedTab === 0 && (
                <>
                  {/* Filters */}
                  <Box
                    sx={{
                      mb: 3,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      variant="filled"
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'grey.800', borderRadius: 1 }}
                    />
                    <TextField
                      variant="filled"
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'grey.800', borderRadius: 1 }}
                    />
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
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{
                        borderWidth: 2,
                        boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                      }}
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                  </Box>
                  <TransactionsList
                    transactions={pagedTransactions}
                    loading={loading}
                  />
                  {pageCount > 1 && (
                    <Box
                      sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
                    >
                      <Pagination
                        count={pageCount}
                        page={page}
                        onChange={(e, val) => setPage(val)}
                        color="secondary"
                      />
                    </Box>
                  )}
                </>
              )}

              {selectedTab === 1 && <BillPage />}

              {selectedTab === 2 && <PaymentMethodsPage />}

              {selectedTab === 3 && <PaymentSettingsPage />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentsPage;
