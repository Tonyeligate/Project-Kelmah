import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import earningsService from '../services/earningsService';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  Work as WorkIcon,
  Schedule as TimeIcon,
  Star as RatingIcon,
  Payment as PaymentIcon,
  Analytics as AnalyticsIcon,
  GetApp as DownloadIcon,
  DateRange as CalendarIcon,
  MonetizationOn as MoneyIcon,
  Assessment as ReportIcon,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { formatCurrency, formatDate, formatPercentage } from '../../../utils/formatters';

const EarningsAnalytics = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('earnings');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '12months', label: 'Last 12 Months' },
    { value: 'all', label: 'All Time' },
  ];

  const metrics = [
    { value: 'earnings', label: 'Earnings', icon: MoneyIcon },
    { value: 'jobs', label: 'Jobs Completed', icon: WorkIcon },
    { value: 'hours', label: 'Hours Worked', icon: TimeIcon },
    { value: 'rating', label: 'Average Rating', icon: RatingIcon },
  ];

  // Chart colors
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const pieColors = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.info];

  // Load earnings data
  const loadEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await earningsService.getEarningsAnalytics(user.id, timeRange);
      setEarningsData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load earnings data');
      enqueueSnackbar('Failed to load earnings analytics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.id, timeRange, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
    }
  }, [loadEarningsData, user]);

  // Handle export data
  const handleExportData = async () => {
    try {
      const blob = await earningsService.exportEarningsData(user.id, timeRange);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `earnings_report_${timeRange}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Earnings report exported successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to export earnings report', { variant: 'error' });
    }
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!earningsData) return null;

    const { summary } = earningsData;

    const cards = [
      {
        title: 'Total Earnings',
        value: formatCurrency(summary.totalEarnings),
        change: summary.earningsChange,
        icon: MoneyIcon,
        color: 'primary',
      },
      {
        title: 'Jobs Completed',
        value: summary.jobsCompleted,
        change: summary.jobsChange,
        icon: WorkIcon,
        color: 'success',
      },
      {
        title: 'Hours Worked',
        value: `${summary.hoursWorked}h`,
        change: summary.hoursChange,
        icon: TimeIcon,
        color: 'info',
      },
      {
        title: 'Average Rating',
        value: summary.averageRating.toFixed(1),
        change: summary.ratingChange,
        icon: RatingIcon,
        color: 'warning',
      },
    ];

    return (
      <Grid container spacing={3} mb={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                    {card.change !== undefined && (
                      <Box display="flex" alignItems="center" mt={1}>
                        {card.change >= 0 ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={card.change >= 0 ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5 }}
                        >
                          {formatPercentage(Math.abs(card.change))}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: alpha(theme.palette[card.color].main, 0.1),
                      color: theme.palette[card.color].main,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <card.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render earnings trend chart
  const renderEarningsTrend = () => {
    if (!earningsData?.chartData) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Earnings Trend</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              label="Metric"
            >
              {metrics.map((metric) => (
                <MenuItem key={metric.value} value={metric.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <metric.icon fontSize="small" />
                    {metric.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={earningsData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => 
                selectedMetric === 'earnings' ? formatCurrency(value) : value
              }
            />
            <Tooltip
              formatter={(value) => [
                selectedMetric === 'earnings' ? formatCurrency(value) : value,
                metrics.find(m => m.value === selectedMetric)?.label
              ]}
            />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={COLORS.primary}
              fill={alpha(COLORS.primary, 0.3)}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render category breakdown
  const renderCategoryBreakdown = () => {
    if (!earningsData?.categoryBreakdown) return null;

    return (
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Earnings by Category
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={earningsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${formatPercentage(percent * 100)})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="earnings"
                >
                  {earningsData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Details
            </Typography>
            <List>
              {earningsData.categoryBreakdown.map((category, index) => (
                <React.Fragment key={category.name}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: pieColors[index % pieColors.length],
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={category.name}
                      secondary={`${category.jobs} jobs • ${formatCurrency(category.earnings)}`}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatPercentage((category.earnings / earningsData.summary.totalEarnings) * 100)}
                    </Typography>
                  </ListItem>
                  {index < earningsData.categoryBreakdown.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render recent transactions
  const renderRecentTransactions = () => {
    if (!earningsData?.recentTransactions) return null;

    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const paginatedTransactions = earningsData.recentTransactions.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Recent Transactions</Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
            variant="outlined"
            size="small"
          >
            Export
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Client</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {transaction.jobTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.clientName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      size="small"
                      color={
                        transaction.status === 'completed' ? 'success' :
                        transaction.status === 'pending' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={earningsData.recentTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!earningsData?.performance) return null;

    const { performance } = earningsData;

    return (
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Score
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={performance.score}
                    size={80}
                    thickness={4}
                    color="primary"
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" component="div">
                      {performance.score}
                    </Typography>
                  </Box>
                </Box>
                <Box ml={2}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Performance
                  </Typography>
                  <Typography variant="body2">
                    {performance.level}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={performance.score}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Response Rate
                  </Typography>
                  <Typography variant="h6">
                    {formatPercentage(performance.responseRate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h6">
                    {formatPercentage(performance.completionRate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Delivery
                  </Typography>
                  <Typography variant="h6">
                    {formatPercentage(performance.onTimeRate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client Satisfaction
                  </Typography>
                  <Typography variant="h6">
                    {formatPercentage(performance.satisfactionRate)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Earnings Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            {timeRanges.map((range) => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Performance Metrics */}
      {renderPerformanceMetrics()}

      {/* Earnings Trend Chart */}
      {renderEarningsTrend()}

      {/* Category Breakdown */}
      {renderCategoryBreakdown()}

      {/* Recent Transactions */}
      {renderRecentTransactions()}
    </Box>
  );
};

export default EarningsAnalytics;