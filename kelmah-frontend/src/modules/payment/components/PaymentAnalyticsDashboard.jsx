import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Smartphone as MobileIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  DateRange as DateIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  MonetizationOn as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSnackbar } from 'notistack';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
} from '../../../utils/formatters';
import paymentService from '../services/paymentService';

const PaymentAnalyticsDashboard = ({
  userType = 'worker', // 'worker', 'hirer', 'admin'
  timeRange = '30d',
  showHeader = true,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(timeRange);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    type: 'all',
  });

  // Colors for charts
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
    loadTransactions();
  }, [selectedPeriod, filters, user.id]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentAnalytics({
        userId: user.id,
        userType,
        period: selectedPeriod,
        ...filters,
      });
      setAnalyticsData(response);
    } catch (error) {
      enqueueSnackbar('Failed to load payment analytics', { variant: 'error' });
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await paymentService.getTransactionHistory({
        userId: user.id,
        period: selectedPeriod,
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      });
      setTransactions(response?.data?.transactions || response?.transactions || []);
    } catch (error) {
      console.error('Transaction history error:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method.toLowerCase()) {
      case 'momo':
      case 'mobile_money':
        return <MobileIcon />;
      case 'bank':
      case 'bank_transfer':
        return <BankIcon />;
      case 'card':
      case 'credit_card':
        return <CardIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  // Export data
  const handleExportData = async (format = 'csv') => {
    try {
      const response = await paymentService.exportPaymentData({
        userId: user.id,
        period: selectedPeriod,
        format,
        ...filters,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `payment_analytics_${selectedPeriod}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar('Data exported successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!analyticsData?.summary) return null;

    const { summary } = analyticsData;

    const cards = [
      {
        title: 'Total Earnings',
        value: formatCurrency(summary.totalEarnings || 0),
        change: summary.earningsChange || 0,
        icon: <MoneyIcon />,
        color: 'primary',
      },
      {
        title: 'Transactions',
        value: summary.totalTransactions || 0,
        change: summary.transactionsChange || 0,
        icon: <ReceiptIcon />,
        color: 'secondary',
      },
      {
        title: 'Success Rate',
        value: `${summary.successRate || 0}%`,
        change: summary.successRateChange || 0,
        icon: <CheckIcon />,
        color: 'success',
      },
      {
        title: 'Average Transaction',
        value: formatCurrency(summary.averageTransaction || 0),
        change: summary.averageChange || 0,
        icon: <AnalyticsIcon />,
        color: 'info',
      },
    ];

    return (
      <Grid container spacing={3} mb={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={`${card.color}.main`}
                    >
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette[card.color].main, 0.1),
                      color: `${card.color}.main`,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>

                {card.change !== 0 && (
                  <Box display="flex" alignItems="center" mt={1}>
                    {card.change > 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={card.change > 0 ? 'success.main' : 'error.main'}
                      ml={0.5}
                    >
                      {Math.abs(card.change)}% vs last period
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render earnings chart
  const renderEarningsChart = () => {
    if (!analyticsData?.earningsChart) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Earnings Trend
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.earningsChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <RechartsTooltip
                formatter={(value) => [formatCurrency(value), 'Earnings']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke={theme.palette.primary.main}
                fill={alpha(theme.palette.primary.main, 0.1)}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render payment methods chart
  const renderPaymentMethodsChart = () => {
    if (!analyticsData?.paymentMethods) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Methods Usage
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.paymentMethods}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
              >
                {analyticsData.paymentMethods.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => [`${value}%`, 'Usage']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render transaction trends
  const renderTransactionTrends = () => {
    if (!analyticsData?.transactionTrends) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction Volume
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="count" fill={theme.palette.secondary.main} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render recent transactions
  const renderRecentTransactions = () => {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Recent Transactions</Typography>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportData('csv')}
            >
              Export
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(transaction.createdAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(transaction.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPaymentMethodIcon(transaction.method)}
                          <Typography variant="body2">
                            {transaction.methodName || transaction.method}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={getStatusColor(transaction.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={transactions.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    );
  };

  // Render insights
  const renderInsights = () => {
    if (!analyticsData?.insights) return null;

    return (
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            display="flex"
            alignItems="center"
            gap={1}
          >
            <InfoIcon />
            Payment Insights
          </Typography>

          <List>
            {analyticsData.insights.map((insight, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {insight.type === 'positive' && (
                    <TrendingUpIcon color="success" />
                  )}
                  {insight.type === 'negative' && (
                    <TrendingDownIcon color="error" />
                  )}
                  {insight.type === 'warning' && (
                    <WarningIcon color="warning" />
                  )}
                  {insight.type === 'info' && <InfoIcon color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={insight.title}
                  secondary={insight.description}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="error">
        Failed to load payment analytics. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon color="primary" />
            Payment Analytics
          </Typography>

          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Period"
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 3 months</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" startIcon={<FilterIcon />} size="small">
              Filters
            </Button>
          </Box>
        </Box>
      )}

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Charts Grid */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          {renderEarningsChart()}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderPaymentMethodsChart()}
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          {renderTransactionTrends()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderInsights()}
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      {renderRecentTransactions()}
    </Box>
  );
};

export default PaymentAnalyticsDashboard;

