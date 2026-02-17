import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  GetApp as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Wallet as WalletIcon,
  Schedule as ScheduleIcon,
  Work as WorkIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import workerService from '../services/workerService';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';

// Styled components
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

const MetricCard = styled(GlassCard)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  textAlign: 'center',
  padding: theme.spacing(3),
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

// Custom colors for charts
const CHART_COLORS = ['#FFD700', '#1a1a1a', '#666666', '#999999', '#cccccc'];

const EarningsTracker = () => {
  const theme = useTheme();
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [timeRange, setTimeRange] = useState('thisMonth');
  const [chartType, setChartType] = useState('line');
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockEarningsData = {
    summary: {
      totalEarnings: 15250.75,
      monthlyEarnings: 3420.5,
      averageHourlyRate: 45.25,
      totalHours: 156,
      completedJobs: 23,
      pendingPayments: 850.0,
      growth: 12.5,
    },
    monthlyTrend: [
      { month: 'Jan', earnings: 2850, hours: 120, jobs: 18 },
      { month: 'Feb', earnings: 3200, hours: 140, jobs: 22 },
      { month: 'Mar', earnings: 2950, hours: 125, jobs: 19 },
      { month: 'Apr', earnings: 3420, hours: 156, jobs: 23 },
      { month: 'May', earnings: 3680, hours: 162, jobs: 25 },
      { month: 'Jun', earnings: 3150, hours: 145, jobs: 21 },
    ],
    categoryBreakdown: [
      { category: 'Electrical', earnings: 5200, percentage: 34 },
      { category: 'Plumbing', earnings: 4100, percentage: 27 },
      { category: 'HVAC', earnings: 3500, percentage: 23 },
      { category: 'General', earnings: 2450, percentage: 16 },
    ],
    recentTransactions: [
      {
        id: 1,
        date: '2024-01-15',
        description: 'Kitchen Wiring Installation',
        client: 'John Smith',
        amount: 450.0,
        status: 'completed',
        paymentMethod: 'bank_transfer',
        jobId: 'JOB-001',
      },
      {
        id: 2,
        date: '2024-01-14',
        description: 'Bathroom Plumbing Repair',
        client: 'Sarah Johnson',
        amount: 320.0,
        status: 'pending',
        paymentMethod: 'escrow',
        jobId: 'JOB-002',
      },
      {
        id: 3,
        date: '2024-01-12',
        description: 'AC Unit Installation',
        client: 'Mike Wilson',
        amount: 750.0,
        status: 'completed',
        paymentMethod: 'credit_card',
        jobId: 'JOB-003',
      },
    ],
  };

  // Load earnings data
  useEffect(() => {
    loadEarningsData();
  }, [timeRange]);

  const loadEarningsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate date range
      const dateRange = getDateRange(timeRange);

      // In a real app, this would call the API
      // const response = await workerService.getWorkerEarnings(user.id, dateRange);

      // For now, use mock data
      setTimeout(() => {
        setEarningsData(mockEarningsData);
        setTransactions(mockEarningsData.recentTransactions);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load earnings data. Please try again.');
      setLoading(false);
    }
  };

  const getDateRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'thisWeek':
        return { start: startOfWeek(now), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: now };
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
        };
      case 'last3Months':
        return { start: subMonths(now, 3), end: now };
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: now };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
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

  const handleExportData = () => {
    // Generate CSV export
    const csvData = transactions.map((t) => ({
      Date: format(parseISO(t.date), 'yyyy-MM-dd'),
      Description: t.description,
      Client: t.client,
      Amount: t.amount,
      Status: t.status,
      'Payment Method': t.paymentMethod,
    }));

    // Convert to CSV and download
    const csvString =
      Object.keys(csvData[0]).join(',') +
      '\n' +
      csvData.map((row) => Object.values(row).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const renderSummaryCards = () => {
    if (!earningsData) return null;

    const { summary } = earningsData;
    const metrics = [
      {
        title: 'Total Earnings',
        value: `GH₵${summary.totalEarnings.toLocaleString()}`,
        icon: <MoneyIcon />,
        growth: summary.growth,
        color: 'primary',
      },
      {
        title: 'This Month',
        value: `GH₵${summary.monthlyEarnings.toLocaleString()}`,
        icon: <TrendingUpIcon />,
        growth: 8.3,
        color: 'success',
      },
      {
        title: 'Average Rate',
        value: `$${summary.averageHourlyRate}/hr`,
        icon: <AssessmentIcon />,
        growth: 5.2,
        color: 'info',
      },
      {
        title: 'Completed Jobs',
        value: summary.completedJobs,
        icon: <WorkIcon />,
        growth: 15.7,
        color: 'warning',
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MetricCard>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${metric.color}.main`,
                      width: 56,
                      height: 56,
                      color: 'white',
                    }}
                  >
                    {metric.icon}
                  </Avatar>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="primary"
                  gutterBottom
                >
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.title}
                </Typography>
                {metric.growth && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpIcon
                      sx={{
                        fontSize: 16,
                        mr: 0.5,
                        color:
                          metric.growth > 0 ? 'success.main' : 'error.main',
                      }}
                    />
                    <Typography
                      variant="caption"
                      color={metric.growth > 0 ? 'success.main' : 'error.main'}
                      fontWeight={600}
                    >
                      {metric.growth > 0 ? '+' : ''}
                      {metric.growth}%
                    </Typography>
                  </Box>
                )}
              </MetricCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderEarningsChart = () => {
    if (!earningsData) return null;

    return (
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              Earnings Trend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="area">Area Chart</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' && (
                <LineChart data={earningsData.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={alpha(theme.palette.divider, 0.3)}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, r: 6 }}
                    name="Earnings ($)"
                  />
                </LineChart>
              )}

              {chartType === 'bar' && (
                <BarChart data={earningsData.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={alpha(theme.palette.divider, 0.3)}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="earnings"
                    fill={theme.palette.primary.main}
                    name="Earnings ($)"
                  />
                </BarChart>
              )}

              {chartType === 'area' && (
                <AreaChart data={earningsData.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={alpha(theme.palette.divider, 0.3)}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.3)}
                    name="Earnings ($)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </GlassCard>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!earningsData) return null;

    return (
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Earnings by Category
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={earningsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="earnings"
                    >
                      {earningsData.categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <List>
                {earningsData.categoryBreakdown.map((category, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={category.category}
                      secondary={`${category.percentage}% of total earnings`}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="h6" fontWeight={600}>
                        GH₵{category.earnings.toLocaleString()}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </GlassCard>
    );
  };

  const renderTransactionsTable = () => (
    <GlassCard>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Recent Transactions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <AnimatedButton
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportData}
              size="small"
            >
              Export
            </AnimatedButton>
            <IconButton onClick={loadEarningsData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {isMobile ? (
          <Stack spacing={1.5}>
            {transactions.map((transaction) => (
              <Paper key={transaction.id} sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          whiteSpace: { xs: 'normal', sm: 'nowrap' },
                          display: '-webkit-box',
                          WebkitLineClamp: { xs: 2, sm: 1 },
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {transaction.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Job ID: {transaction.jobId}
                      </Typography>
                    </Box>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        sx={{ minWidth: 44, minHeight: 44 }}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDetailsDialog(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(transaction.date), 'MMM dd, yyyy')} • {transaction.client}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} color="primary">
                      GH₵{transaction.amount.toFixed(2)}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(transaction.status)}
                      label={
                        transaction.status.charAt(0).toUpperCase() +
                        transaction.status.slice(1)
                      }
                      color={getStatusColor(transaction.status)}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Job ID: {transaction.jobId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.client}</TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight={600} color="primary">
                        GH₵{transaction.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(transaction.status)}
                        label={
                          transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)
                        }
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setDetailsDialog(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </GlassCard>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Earnings Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your income, analyze trends, and manage your finances
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="thisWeek">This Week</MenuItem>
            <MenuItem value="thisMonth">This Month</MenuItem>
            <MenuItem value="lastMonth">Last Month</MenuItem>
            <MenuItem value="last3Months">Last 3 Months</MenuItem>
            <MenuItem value="thisYear">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Charts */}
      {renderEarningsChart()}
      {renderCategoryBreakdown()}

      {/* Transactions Table */}
      {renderTransactionsTable()}

      {/* Transaction Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {format(parseISO(selectedTransaction.date), 'MMMM dd, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" color="primary">
                  GH₵{selectedTransaction.amount.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.client}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.paymentMethod
                    .replace('_', ' ')
                    .toUpperCase()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EarningsTracker;
