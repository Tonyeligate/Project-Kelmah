import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Chip,
  useTheme,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import { 
  FilterList, 
  Search, 
  GetApp, 
  CalendarToday, 
  Refresh,
  AttachMoney,
  BookmarkBorder,
  Receipt,
  PriceCheck,
  AccountBalanceWallet,
  History
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CartesianGrid, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';
import EarningsTracker from '../../components/dashboard/EarningsTracker';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MOCK_DATA = true; // Set to false when real API is available

const timeRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year', 'Custom range'];
const transactionTypes = ['All', 'Payments', 'Withdrawals', 'Refunds', 'Platform Fees'];
const transactionStatus = ['All', 'Completed', 'Pending', 'Failed', 'Cancelled'];

const EarningsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  // Chart data
  const [chartData, setChartData] = useState([]);
  const [withdrawalsData, setWithdrawalsData] = useState([]);

  // Handle custom time range
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event) => {
    const value = event.target.value;
    setTimeRange(value);
    setShowCustomRange(value === 'Custom range');
    
    // If not custom range, update the filtered data
    if (value !== 'Custom range') {
      applyFilters();
    }
  };

  const handleTypeChange = (event) => {
    setType(event.target.value);
    applyFilters();
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    applyFilters();
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    applyFilters();
  };

  const handleRefresh = () => {
    fetchEarningsData();
  };

  const applyCustomDateRange = () => {
    if (startDate && endDate) {
      applyFilters();
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Apply filters to transactions
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Filter by type
    if (type !== 'All') {
      filtered = filtered.filter(transaction => transaction.type === type.toLowerCase());
    }
    
    // Filter by status
    if (status !== 'All') {
      filtered = filtered.filter(transaction => transaction.status.toLowerCase() === status.toLowerCase());
    }
    
    // Filter by date range
    if (timeRange === 'Custom range' && startDate && endDate) {
      filtered = filtered.filter(transaction => {
        const txDate = new Date(transaction.date);
        return txDate >= startDate && txDate <= endDate;
      });
    } else {
      const now = new Date();
      let filterDate = new Date();
      
      switch (timeRange) {
        case 'Last 7 days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Last 30 days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'Last 90 days':
          filterDate.setDate(now.getDate() - 90);
          break;
        case 'This year':
          filterDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          filterDate = new Date(2000, 0, 1); // Show all
      }
      
      filtered = filtered.filter(transaction => new Date(transaction.date) >= filterDate);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(query) || 
        transaction.jobTitle?.toLowerCase().includes(query) || 
        transaction.id.toLowerCase().includes(query)
      );
    }
    
    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (MOCK_DATA) {
        // Mock data for development
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const mockEarnings = {
          currentPeriod: {
            earnings: 875.50,
            target: 1200,
            period: 'Monthly'
          },
          total: 12547.80,
          pending: 350.25,
          available: 1275.30,
          withdrawable: 1250.00,
          lastWithdrawal: {
            amount: 1000,
            date: '2023-04-15',
            status: 'completed'
          }
        };
        
        const mockTransactions = Array(25).fill(0).map((_, idx) => {
          const types = ['payment', 'withdrawal', 'refund', 'fee'];
          const statuses = ['completed', 'pending', 'failed', 'cancelled'];
          const type = types[Math.floor(Math.random() * types.length)];
          const daysAgo = Math.floor(Math.random() * 120);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          
          const amount = type === 'withdrawal' || type === 'refund' || type === 'fee' 
            ? -(Math.random() * 500).toFixed(2) 
            : (Math.random() * 500).toFixed(2);
            
          return {
            id: `tx-${Math.random().toString(36).substr(2, 9)}`,
            date: date.toISOString(),
            amount: parseFloat(amount),
            type,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            description: type === 'payment' 
              ? 'Payment for job completion' 
              : type === 'withdrawal' 
                ? 'Withdrawal to bank account' 
                : type === 'refund' 
                  ? 'Refund for cancelled job' 
                  : 'Platform service fee',
            jobTitle: type === 'payment' ? `Job #${Math.floor(Math.random() * 1000)}` : null
          };
        });
        
        // Sort transactions by date (newest first)
        mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate chart data
        const last12Months = Array(12).fill(0).map((_, idx) => {
          const date = new Date();
          date.setMonth(date.getMonth() - idx);
          return {
            month: format(date, 'MMM'),
            earnings: Math.random() * 1500 + 500,
            withdrawals: Math.random() * 1200 + 300
          };
        }).reverse();
        
        // Generate withdrawals chart data
        const withdrawalsHistory = Array(6).fill(0).map((_, idx) => {
          const date = new Date();
          date.setMonth(date.getMonth() - idx);
          return {
            month: format(date, 'MMM'),
            amount: Math.random() * 1000 + 200
          };
        }).reverse();
        
        setEarningsData(mockEarnings);
        setTransactions(mockTransactions);
        setFilteredTransactions(mockTransactions);
        setChartData(last12Months);
        setWithdrawalsData(withdrawalsHistory);
      } else {
        // Real API calls
        const earningsResponse = await axios.get(`${API_URL}/worker/earnings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const transactionsResponse = await axios.get(`${API_URL}/worker/transactions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const chartResponse = await axios.get(`${API_URL}/worker/earnings/chart`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        setEarningsData(earningsResponse.data.data);
        setTransactions(transactionsResponse.data.data);
        setFilteredTransactions(transactionsResponse.data.data);
        setChartData(chartResponse.data.data.monthly);
        setWithdrawalsData(chartResponse.data.data.withdrawals);
      }
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load earnings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + 'Date,Type,Description,Amount,Status\n'
      + filteredTransactions.map(tx => {
          return `${format(new Date(tx.date), 'yyyy-MM-dd')},${tx.type},"${tx.description}",${tx.amount},${tx.status}`;
        }).join('\n');
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `earnings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render transaction status chip with appropriate color
  const renderStatusChip = (status) => {
    let color = 'default';
    
    switch (status.toLowerCase()) {
      case 'completed':
        color = 'success';
        break;
      case 'pending':
        color = 'warning';
        break;
      case 'failed':
        color = 'error';
        break;
      case 'cancelled':
        color = 'default';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status.charAt(0).toUpperCase() + status.slice(1)} 
        size="small" 
        color={color}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Earnings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={8}>
          <EarningsTracker 
            currentEarnings={earningsData?.currentPeriod?.earnings || 0}
            targetEarnings={earningsData?.currentPeriod?.target || 1000}
            totalEarnings={earningsData?.total || 0}
            pendingPayments={earningsData?.pending || 0}
            period={earningsData?.currentPeriod?.period || 'Monthly'}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceWallet color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Wallet Balance
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {formatCurrency(earningsData?.available || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Withdrawable: {formatCurrency(earningsData?.withdrawable || 0)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      disabled={!earningsData?.withdrawable || earningsData.withdrawable <= 0}
                    >
                      Withdraw
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <History color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Last Withdrawal
                    </Typography>
                  </Box>
                  {earningsData?.lastWithdrawal ? (
                    <>
                      <Typography variant="h5" sx={{ mb: 1 }}>
                        {formatCurrency(earningsData.lastWithdrawal.amount)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(earningsData.lastWithdrawal.date), 'MMM d, yyyy')}
                        </Typography>
                        {renderStatusChip(earningsData.lastWithdrawal.status)}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No withdrawals yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Transactions" icon={<Receipt />} iconPosition="start" />
              <Tab label="Analytics" icon={<BarChart />} iconPosition="start" />
            </Tabs>
          </Box>
        </Grid>

        {/* Transactions Tab Content */}
        {tabValue === 0 && (
          <>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TextField
                    placeholder="Search transactions..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={handleSearch}
                    sx={{ minWidth: 250, flex: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="time-range-label">Time Range</InputLabel>
                    <Select
                      labelId="time-range-label"
                      value={timeRange}
                      label="Time Range"
                      onChange={handleTimeRangeChange}
                    >
                      {timeRanges.map(range => (
                        <MenuItem key={range} value={range}>{range}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      value={type}
                      label="Type"
                      onChange={handleTypeChange}
                    >
                      {transactionTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      value={status}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      {transactionStatus.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    startIcon={<GetApp />}
                    onClick={exportTransactions}
                  >
                    Export
                  </Button>
                </Box>
                
                {showCustomRange && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{ textField: { size: 'small' } }}
                      />
                    </LocalizationProvider>
                    <Button 
                      variant="contained" 
                      onClick={applyCustomDateRange}
                      disabled={!startDate || !endDate}
                    >
                      Apply
                    </Button>
                  </Box>
                )}
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {filteredTransactions.length} transactions found
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id} hover>
                            <TableCell>
                              {format(new Date(transaction.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {transaction.description}
                              </Typography>
                              {transaction.jobTitle && (
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.jobTitle}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} 
                                size="small" 
                                color={
                                  transaction.type === 'payment' 
                                    ? 'primary' 
                                    : transaction.type === 'withdrawal' 
                                      ? 'secondary' 
                                      : transaction.type === 'refund' 
                                        ? 'warning' 
                                        : 'default'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2" 
                                color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                                fontWeight={500}
                              >
                                {formatCurrency(transaction.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>{renderStatusChip(transaction.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No transactions found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </>
        )}

        {/* Analytics Tab Content */}
        {tabValue === 1 && (
          <>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Earnings Over Time
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          name="Earnings" 
                          stroke={theme.palette.primary.main} 
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="withdrawals" 
                          name="Withdrawals" 
                          stroke={theme.palette.secondary.main}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Withdrawals History
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={withdrawalsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar 
                          dataKey="amount" 
                          name="Amount" 
                          fill={theme.palette.secondary.main} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Earnings Breakdown
                  </Typography>
                  {/* Additional analytics charts can be added here */}
                  <Typography variant="body2" color="text.secondary">
                    More detailed analytics coming soon...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default EarningsPage; 