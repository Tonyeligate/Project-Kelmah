import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import earningsService from '../services/earningsService';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  MonetizationOn as MoneyIcon,
  CalendarMonth as CalendarIcon,
  DateRange as WeekIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../../utils/formatters';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const EarningsAnalytics = () => {
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform backend byMonth array into chart-friendly data
  const buildChartData = (byMonth = []) =>
    byMonth.map((entry) => ({
      month: MONTH_NAMES[(entry.month - 1) % 12] || `M${entry.month}`,
      amount: entry.amount ?? 0,
    }));

  const loadEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await earningsService.getEarnings(user.id);
      setEarningsData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load earnings data');
      enqueueSnackbar('Failed to load earnings analytics', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [user.id, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
    }
  }, [loadEarningsData, user]);

  // Summary cards derived from backend totals
  const renderSummaryCards = () => {
    if (!earningsData?.totals) return null;
    const { totals } = earningsData;

    // Derive a simple change indicator: last30Days as % of allTime
    const changePercent =
      totals.allTime > 0
        ? ((totals.last30Days / totals.allTime) * 100).toFixed(1)
        : 0;

    const monthlyAvg =
      earningsData.breakdown?.byMonth?.length > 0
        ? (
            earningsData.breakdown.byMonth.reduce(
              (sum, m) => sum + (m.amount || 0),
              0,
            ) / earningsData.breakdown.byMonth.length
          ).toFixed(2)
        : 0;

    const cards = [
      {
        title: 'Total Earnings',
        value: formatCurrency(totals.allTime),
        subtitle: totals.currency || 'GHS',
        icon: MoneyIcon,
        color: 'primary',
      },
      {
        title: 'Last 30 Days',
        value: formatCurrency(totals.last30Days),
        subtitle: `${changePercent}% of all-time`,
        icon: CalendarIcon,
        color: 'success',
        change: totals.last30Days > 0 ? 1 : 0,
      },
      {
        title: 'Last 7 Days',
        value: formatCurrency(totals.last7Days),
        subtitle: 'Recent activity',
        icon: WeekIcon,
        color: 'info',
        change: totals.last7Days > 0 ? 1 : 0,
      },
      {
        title: 'Monthly Average',
        value: formatCurrency(Number(monthlyAvg)),
        subtitle: `Over ${earningsData.breakdown?.byMonth?.length || 0} months`,
        icon: BankIcon,
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
                    <Box display="flex" alignItems="center" mt={1}>
                      {card.change !== undefined &&
                        (card.change > 0 ? (
                          <TrendingUpIcon
                            color="success"
                            fontSize="small"
                            sx={{ mr: 0.5 }}
                          />
                        ) : (
                          <TrendingDownIcon
                            color="error"
                            fontSize="small"
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                      <Typography variant="body2" color="text.secondary">
                        {card.subtitle}
                      </Typography>
                    </Box>
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

  // Monthly earnings area chart
  const renderEarningsTrend = () => {
    const chartData = buildChartData(earningsData?.breakdown?.byMonth);
    if (!chartData.length) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Earnings Trend
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Earnings']} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={theme.palette.primary.main}
              fill={alpha(theme.palette.primary.main, 0.3)}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Monthly bar chart
  const renderMonthlyBars = () => {
    const chartData = buildChartData(earningsData?.breakdown?.byMonth);
    if (!chartData.length) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Earnings by Month
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Earnings']} />
            <Bar
              dataKey="amount"
              fill={theme.palette.success.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
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
      <Box mb={3}>
        <Typography variant="h4" component="h1">
          Earnings Analytics
        </Typography>
        {earningsData?.source && (
          <Typography variant="body2" color="text.secondary">
            Data source: {earningsData.source}
          </Typography>
        )}
      </Box>

      {renderSummaryCards()}
      {renderEarningsTrend()}
      {renderMonthlyBars()}
    </Box>
  );
};

export default EarningsAnalytics;
