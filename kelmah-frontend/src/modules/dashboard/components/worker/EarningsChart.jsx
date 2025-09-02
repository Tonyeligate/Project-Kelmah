import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Skeleton,
  Alert,
  Tooltip,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as EarningsIcon,
  Assessment as StatsIcon,
  MoreVert as MoreVertIcon,
  ShowChart as ChartIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  Payment as PaymentIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardCard from '../common/DashboardCard';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../../auth/contexts/AuthContext';

const EnhancedEarningsChart = () => {
  const theme = useTheme();
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('6months');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced earnings data with more detail
  const [earningsData, setEarningsData] = useState({
    monthly: [],
    weekly: [],
    daily: [],
    byCategory: [],
    summary: {
      totalEarnings: 0,
      monthlyAverage: 0,
      totalJobs: 0,
      growthRate: 0,
      projectedMonthly: 0,
    }
  });

  // Mock data for demonstration (in real app, this would come from API)
  const generateEarningsData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const monthlyData = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const baseAmount = 2000 + Math.random() * 3000;
      const jobs = Math.floor(Math.random() * 15) + 5;
      return {
        name: month,
        earnings: Math.round(baseAmount),
        jobs: jobs,
        expenses: Math.round(baseAmount * 0.2),
        netEarnings: Math.round(baseAmount * 0.8),
        hoursWorked: jobs * 8,
        avgPerJob: Math.round(baseAmount / jobs),
      };
    });

    const weeklyData = Array.from({ length: 12 }, (_, index) => {
      const weekNum = index + 1;
      const earnings = 300 + Math.random() * 800;
      const jobs = Math.floor(Math.random() * 4) + 1;
      return {
        name: `Week ${weekNum}`,
        earnings: Math.round(earnings),
        jobs: jobs,
        hoursWorked: jobs * 8,
      };
    });

    const categoryData = [
      { name: 'Carpentry', value: 4500, jobs: 12, color: '#8D6E63' },
      { name: 'Plumbing', value: 3200, jobs: 8, color: '#2196F3' },
      { name: 'Electrical', value: 2800, jobs: 6, color: '#FFD700' },
      { name: 'Painting', value: 1800, jobs: 5, color: '#E91E63' },
      { name: 'Repairs', value: 1200, jobs: 7, color: '#607D8B' },
    ];

    const totalEarnings = monthlyData.reduce((sum, month) => sum + month.earnings, 0);
    const totalJobs = monthlyData.reduce((sum, month) => sum + month.jobs, 0);
    const monthlyAverage = totalEarnings / monthlyData.length;
    const growthRate = monthlyData.length > 1 
      ? ((monthlyData[monthlyData.length - 1].earnings - monthlyData[0].earnings) / monthlyData[0].earnings) * 100
      : 0;

    return {
      monthly: monthlyData,
      weekly: weeklyData,
      byCategory: categoryData,
      summary: {
        totalEarnings: Math.round(totalEarnings),
        monthlyAverage: Math.round(monthlyAverage),
        totalJobs,
        growthRate: Math.round(growthRate * 10) / 10,
        projectedMonthly: Math.round(monthlyAverage * 1.1),
      }
    };
  };

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = generateEarningsData();
        setEarningsData(data);
      } catch (err) {
        console.error('Error fetching earnings data:', err);
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateEarningsData();
      setEarningsData(data);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
  return (
        <Box
          sx={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            color: '#fff',
            p: 2,
            borderRadius: 2,
            border: '1px solid rgba(255,215,0,0.3)',
            minWidth: 150,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: GH₵{entry.value?.toLocaleString()}
        </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Format currency for Ghana
  const formatCurrency = (amount) => {
    return `GH₵${amount?.toLocaleString() || 0}`;
  };

  // Chart data based on time range
  const chartData = useMemo(() => {
    switch (timeRange) {
      case '3months':
        return earningsData.monthly.slice(-3);
      case '6months':
        return earningsData.monthly;
      case '12months':
        return earningsData.monthly;
      case 'weekly':
        return earningsData.weekly;
      default:
        return earningsData.monthly;
    }
  }, [earningsData, timeRange]);

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 12 }} />
            <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
            <ChartTooltip content={<CustomTooltip />} />
            <Bar dataKey="earnings" fill="#FFD700" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#FF5722" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 12 }} />
            <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
            <ChartTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#FFD700"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#earningsGradient)"
            />
          </AreaChart>
        );
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 12 }} />
            <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
            <ChartTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="earnings"
              stroke="#FFD700"
              strokeWidth={3}
              dot={{ fill: '#FFD700', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#FFC000' }}
            />
            <Line
              type="monotone"
              dataKey="netEarnings"
              stroke="#4CAF50"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <DashboardCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Earnings Overview 
            </Typography>
            <EarningsIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
          </Stack>
        }
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Box>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Earnings Overview">
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
            Try Again
          </Button>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
            Earnings Overview
          </Typography>
          <EarningsIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
        </Stack>
      }
      action={
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={timeRange.replace('months', 'M').replace('weekly', 'Weekly')}
            size="small"
            sx={{
              backgroundColor: alpha('#FFD700', 0.2),
              color: '#FFD700',
              fontWeight: 600,
            }}
          />
          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ color: '#FFD700' }}
            >
              <RefreshIcon
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>
      }
    >
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
                border: '1px solid rgba(76,175,80,0.2)',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Total Earnings
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                      {formatCurrency(earningsData.summary.totalEarnings)}
                    </Typography>
                  </Box>
                  <PaymentIcon sx={{ color: '#4CAF50' }} />
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Monthly Avg
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
                      {formatCurrency(earningsData.summary.monthlyAverage)}
                    </Typography>
                  </Box>
                  <StatsIcon sx={{ color: '#FFD700' }} />
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)',
                border: '1px solid rgba(33,150,243,0.2)',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Total Jobs
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 700 }}>
                      {earningsData.summary.totalJobs}
                    </Typography>
                  </Box>
                  <WorkIcon sx={{ color: '#2196F3' }} />
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${
                  earningsData.summary.growthRate >= 0 
                    ? 'rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%'
                    : 'rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%'
                })`,
                border: `1px solid ${
                  earningsData.summary.growthRate >= 0 
                    ? 'rgba(76,175,80,0.2)'
                    : 'rgba(244,67,54,0.2)'
                }`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Growth Rate
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: earningsData.summary.growthRate >= 0 ? '#4CAF50' : '#F44336', 
                        fontWeight: 700 
                      }}
                    >
                      {earningsData.summary.growthRate >= 0 ? '+' : ''}{earningsData.summary.growthRate}%
                    </Typography>
                  </Box>
                  {earningsData.summary.growthRate >= 0 ? (
                    <TrendingUpIcon sx={{ color: '#4CAF50' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#F44336' }} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Chart Controls */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {['3months', '6months', '12months', 'weekly'].map((range) => (
          <Chip
            key={range}
            label={range.replace('months', 'M').replace('weekly', 'Weekly')}
            clickable
            onClick={() => setTimeRange(range)}
            sx={{
              backgroundColor: timeRange === range ? alpha('#FFD700', 0.2) : 'rgba(255,255,255,0.05)',
              color: timeRange === range ? '#FFD700' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${timeRange === range ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              '&:hover': {
                backgroundColor: alpha('#FFD700', 0.1),
                color: '#FFD700',
              },
            }}
          />
        ))}
      </Stack>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 3,
            mb: 3,
          }}
        >
          <CardContent>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
      </motion.div>

      {/* Earnings by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 3,
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                Earnings by Category
              </Typography>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              {earningsData.byCategory.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={category.name}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                          {category.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {formatCurrency(category.value)} • {category.jobs} jobs
                        </Typography>
                      </Box>
                    </Stack>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setChartType('line'); setMenuAnchor(null); }}>
          <ChartIcon sx={{ mr: 1 }} /> Line Chart
        </MenuItem>
        <MenuItem onClick={() => { setChartType('bar'); setMenuAnchor(null); }}>
          <BarChartIcon sx={{ mr: 1 }} /> Bar Chart
        </MenuItem>
        <MenuItem onClick={() => { setChartType('area'); setMenuAnchor(null); }}>
          <DonutIcon sx={{ mr: 1 }} /> Area Chart
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <DownloadIcon sx={{ mr: 1 }} /> Export Data
        </MenuItem>
      </Menu>
    </DashboardCard>
  );
};

export default EnhancedEarningsChart;
