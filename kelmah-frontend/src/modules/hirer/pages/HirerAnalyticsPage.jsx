import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import hirerAnalyticsService from '../services/hirerAnalyticsService';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Work as JobsIcon,
  People as WorkersIcon,
  AttachMoney as SpendingIcon,
  Schedule as TimeIcon,
  Star as RatingIcon,
  Analytics as AnalyticsIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  CompareArrows as CompareIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
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
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useSnackbar } from 'notistack';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from '../../../utils/formatters';

const HirerAnalyticsPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const timeRanges = [
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '12months', label: 'Last 12 Months' },
    { value: 'all', label: 'All Time' },
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

  const pieColors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    COLORS.info,
  ];

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await hirerAnalyticsService.getHirerAnalytics(
        user.id,
        timeRange,
      );
      setAnalyticsData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      enqueueSnackbar('Failed to load hirer analytics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.id, timeRange, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
    }
  }, [loadAnalyticsData, user]);

  // Handle export data
  const handleExportData = async () => {
    try {
      const blob = await hirerAnalyticsService.exportAnalyticsData(
        user.id,
        timeRange,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hirer_analytics_${timeRange}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Analytics report exported successfully', {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar('Failed to export analytics report', {
        variant: 'error',
      });
    }
  };

  // Render overview cards
  const renderOverviewCards = () => {
    if (!analyticsData) return null;

    const { summary } = analyticsData;

    const cards = [
      {
        title: 'Total Spending',
        value: formatCurrency(summary.totalSpending),
        change: summary.spendingChange,
        icon: SpendingIcon,
        color: 'primary',
      },
      {
        title: 'Active Jobs',
        value: summary.activeJobs,
        change: summary.jobsChange,
        icon: JobsIcon,
        color: 'success',
      },
      {
        title: 'Workers Hired',
        value: summary.workersHired,
        change: summary.workersChange,
        icon: WorkersIcon,
        color: 'info',
      },
      {
        title: 'Success Rate',
        value: formatPercentage(summary.successRate),
        change: summary.successRateChange,
        icon: SuccessIcon,
        color: 'warning',
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
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
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
                          color={
                            card.change >= 0 ? 'success.main' : 'error.main'
                          }
                          sx={{ ml: 0.5 }}
                        >
                          {formatPercentage(Math.abs(card.change))}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: alpha(
                        theme.palette[card.color].main,
                        0.1,
                      ),
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

  // Render spending trend chart
  const renderSpendingTrend = () => {
    if (!analyticsData?.spendingData) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Spending Trend
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analyticsData.spendingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Spending']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={COLORS.primary}
              fill={alpha(COLORS.primary, 0.3)}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render job status distribution
  const renderJobStatusDistribution = () => {
    if (!analyticsData?.jobStatusData) return null;

    return (
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.jobStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${formatPercentage(percent * 100)})`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.jobStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Job Completion Rate</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(analyticsData.performance.completionRate)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.performance.completionRate}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">On-Time Completion</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(analyticsData.performance.onTimeRate)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.performance.onTimeRate}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Worker Satisfaction</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(
                      analyticsData.performance.workerSatisfaction,
                    )}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.performance.workerSatisfaction}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Budget Adherence</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(
                      analyticsData.performance.budgetAdherence,
                    )}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.performance.budgetAdherence}
                  color="info"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render category spending breakdown
  const renderCategoryBreakdown = () => {
    if (!analyticsData?.categoryBreakdown) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Spending by Category
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.categoryBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Spending']}
            />
            <Bar
              dataKey="spending"
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render top workers table
  const renderTopWorkers = () => {
    if (!analyticsData?.topWorkers) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Performing Workers
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Worker</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Jobs</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="right">Total Paid</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.topWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {worker.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {worker.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {worker.location}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={worker.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {worker.jobsCompleted}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={0.5}
                    >
                      <RatingIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        {worker.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(worker.totalPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Profile">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Compare">
                      <IconButton size="small">
                        <CompareIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  // Render recent activity
  const renderRecentActivity = () => {
    if (!analyticsData?.recentActivity) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {analyticsData.recentActivity.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemIcon>
                  {activity.type === 'job_completed' && (
                    <SuccessIcon color="success" />
                  )}
                  {activity.type === 'job_cancelled' && (
                    <CancelIcon color="error" />
                  )}
                  {activity.type === 'job_posted' && (
                    <JobsIcon color="primary" />
                  )}
                  {activity.type === 'payment_made' && (
                    <SpendingIcon color="info" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                {activity.amount && (
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(activity.amount)}
                  </Typography>
                )}
              </ListItem>
              {index < analyticsData.recentActivity.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

  // Render insights and recommendations
  const renderInsights = () => {
    if (!analyticsData?.insights) return null;

    return (
      <Grid container spacing={3} mb={3}>
        {analyticsData.insights.map((insight, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                borderLeft: `4px solid ${
                  insight.type === 'success'
                    ? COLORS.success
                    : insight.type === 'warning'
                      ? COLORS.warning
                      : insight.type === 'info'
                        ? COLORS.info
                        : COLORS.error
                }`,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {insight.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {insight.description}
                </Typography>
                {insight.action && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                  >
                    {insight.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
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
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4" component="h1">
          Hiring Analytics
        </Typography>
        <Stack direction="row" spacing={2}>
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
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
          >
            Export Report
          </Button>
        </Stack>
      </Box>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Insights and Recommendations */}
      {renderInsights()}

      {/* Spending Trend */}
      {renderSpendingTrend()}

      {/* Job Status and Performance */}
      {renderJobStatusDistribution()}

      {/* Category Breakdown */}
      {renderCategoryBreakdown()}

      {/* Top Workers */}
      {renderTopWorkers()}

      {/* Recent Activity */}
      {renderRecentActivity()}
    </Box>
  );
};

export default HirerAnalyticsPage;

