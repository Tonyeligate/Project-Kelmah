import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Snackbar,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  MonetizationOn as EarningsIcon,
  Work as JobsIcon,
  Star as RatingIcon,
  Visibility as ViewsIcon,
  Schedule as TimeIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  CalendarToday as CalendarIcon,
  Group as ClientsIcon,
  Assignment as ContractsIcon,
  Payment as PaymentIcon,
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
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subDays,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';

// Enhanced Analytics Dashboard
const EnhancedAnalyticsPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('30-days');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Mock analytics data
  const mockAnalyticsData = {
    overview: {
      totalEarnings: 12500,
      totalJobs: 23,
      averageRating: 4.7,
      profileViews: 156,
      responseRate: 94,
      completionRate: 96,
      repeatClients: 8,
      totalHours: 187,
      trends: {
        earnings: 15.2,
        jobs: 8.7,
        rating: 2.1,
        views: -5.3,
      },
    },
    earnings: {
      thisMonth: 3200,
      lastMonth: 2800,
      thisYear: 12500,
      lastYear: 9800,
      byCategory: [
        { name: 'Carpentry', value: 5200, percentage: 41.6 },
        { name: 'Plumbing', value: 3800, percentage: 30.4 },
        { name: 'Electrical', value: 2500, percentage: 20.0 },
        { name: 'Painting', value: 1000, percentage: 8.0 },
      ],
      monthly: [
        { month: 'Jan', earnings: 980, jobs: 2 },
        { month: 'Feb', earnings: 1200, jobs: 3 },
        { month: 'Mar', earnings: 1500, jobs: 4 },
        { month: 'Apr', earnings: 1100, jobs: 2 },
        { month: 'May', earnings: 1800, jobs: 3 },
        { month: 'Jun', earnings: 2200, jobs: 4 },
        { month: 'Jul', earnings: 1900, jobs: 3 },
        { month: 'Aug', earnings: 2800, jobs: 5 },
        { month: 'Sep', earnings: 3200, jobs: 4 },
        { month: 'Oct', earnings: 0, jobs: 0 },
        { month: 'Nov', earnings: 0, jobs: 0 },
        { month: 'Dec', earnings: 0, jobs: 0 },
      ],
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        earnings: Math.floor(Math.random() * 300) + 50,
        hours: Math.floor(Math.random() * 8) + 1,
      })),
    },
    jobs: {
      total: 23,
      completed: 22,
      active: 1,
      cancelled: 0,
      byStatus: [
        { name: 'Completed', value: 22, color: '#4CAF50' },
        { name: 'Active', value: 1, color: '#FFD700' },
        { name: 'Cancelled', value: 0, color: '#F44336' },
      ],
      byCategory: [
        { name: 'Carpentry', jobs: 9, earnings: 5200 },
        { name: 'Plumbing', jobs: 7, earnings: 3800 },
        { name: 'Electrical', jobs: 4, earnings: 2500 },
        { name: 'Painting', jobs: 3, earnings: 1000 },
      ],
      performance: {
        averageCompletionTime: 5.2,
        onTimeDelivery: 96,
        clientSatisfaction: 4.7,
        repeatBookings: 35,
      },
    },
    clients: {
      total: 18,
      repeat: 8,
      new: 10,
      topClients: [
        { name: 'Sarah Mitchell', jobs: 3, earnings: 2100, rating: 5.0 },
        { name: 'David Chen', jobs: 2, earnings: 1500, rating: 4.8 },
        { name: 'Lisa Thompson', jobs: 2, earnings: 3200, rating: 4.9 },
        { name: 'Mike Johnson', jobs: 2, earnings: 800, rating: 4.5 },
      ],
      satisfaction: [
        { rating: 5, count: 15, percentage: 65.2 },
        { rating: 4, count: 6, percentage: 26.1 },
        { rating: 3, count: 2, percentage: 8.7 },
        { rating: 2, count: 0, percentage: 0 },
        { rating: 1, count: 0, percentage: 0 },
      ],
    },
    performance: {
      profileViews: {
        thisMonth: 156,
        lastMonth: 142,
        trend: 9.9,
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'MMM dd'),
          views: Math.floor(Math.random() * 15) + 2,
        })),
      },
      responseTime: {
        average: 2.3,
        target: 4.0,
        thisMonth: 2.1,
        lastMonth: 2.5,
      },
      skills: [
        { name: 'Carpentry', level: 95, jobs: 9, rating: 4.8 },
        { name: 'Plumbing', level: 88, jobs: 7, rating: 4.6 },
        { name: 'Electrical', level: 82, jobs: 4, rating: 4.7 },
        { name: 'Painting', level: 75, jobs: 3, rating: 4.5 },
      ],
    },
  };

  // Initialize data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setAnalyticsData(mockAnalyticsData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        showFeedback('Failed to load analytics data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod]);

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  const formatCurrency = (amount) => `GH₵${amount.toLocaleString()}`;

  const getTrendIcon = (trend) => {
    if (trend > 0)
      return <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 20 }} />;
    if (trend < 0)
      return <TrendingDownIcon sx={{ color: '#F44336', fontSize: 20 }} />;
    return <TrendingFlatIcon sx={{ color: '#9E9E9E', fontSize: 20 }} />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return '#4CAF50';
    if (trend < 0) return '#F44336';
    return '#9E9E9E';
  };

  // Overview Statistics Component
  const OverviewStatistics = () => {
    const stats = [
      {
        title: 'Total Earnings',
        value: formatCurrency(analyticsData.overview?.totalEarnings || 0),
        trend: analyticsData.overview?.trends?.earnings || 0,
        icon: <EarningsIcon />,
        color: '#4CAF50',
        subtitle: 'This year',
      },
      {
        title: 'Jobs Completed',
        value: analyticsData.overview?.totalJobs || 0,
        trend: analyticsData.overview?.trends?.jobs || 0,
        icon: <JobsIcon />,
        color: '#2196F3',
        subtitle: 'Total projects',
      },
      {
        title: 'Average Rating',
        value: (analyticsData.overview?.averageRating || 0).toFixed(1),
        trend: analyticsData.overview?.trends?.rating || 0,
        icon: <RatingIcon />,
        color: '#FFD700',
        subtitle: 'Client satisfaction',
      },
      {
        title: 'Profile Views',
        value: analyticsData.overview?.profileViews || 0,
        trend: analyticsData.overview?.trends?.views || 0,
        icon: <ViewsIcon />,
        color: '#9C27B0',
        subtitle: 'This month',
      },
      {
        title: 'Response Rate',
        value: `${analyticsData.overview?.responseRate || 0}%`,
        trend: 0,
        icon: <TimeIcon />,
        color: '#FF9800',
        subtitle: 'Message responses',
      },
      {
        title: 'Completion Rate',
        value: `${analyticsData.overview?.completionRate || 0}%`,
        trend: 0,
        icon: <ContractsIcon />,
        color: '#00BCD4',
        subtitle: 'Project success',
      },
    ];

    return (
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(stat.color, 0.2)}`,
                  borderRadius: 3,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          mb: 0.5,
                          display: 'block',
                        }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          color: stat.color,
                          fontWeight: 800,
                          fontSize: { xs: '1.5rem', sm: '1.75rem' },
                          lineHeight: 1.2,
                          mb: 0.5,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {stat.subtitle}
                      </Typography>
                      {stat.trend !== 0 && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{ mt: 1 }}
                        >
                          {getTrendIcon(stat.trend)}
                          <Typography
                            variant="caption"
                            sx={{
                              color: getTrendColor(stat.trend),
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          >
                            {stat.trend > 0 ? '+' : ''}
                            {stat.trend.toFixed(1)}%
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <Box
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: '50%',
                        background: alpha(stat.color, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                        flexShrink: 0,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Earnings Chart Component
  const EarningsChart = () => (
    <Paper
      sx={{
        p: 3,
        background:
          'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#FFD700',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LineChartIcon />
          Earnings Overview
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            sx={{
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,215,0,0.3)',
              },
              '& .MuiSvgIcon-root': {
                color: '#FFD700',
              },
            }}
          >
            <MenuItem value="7-days">Last 7 Days</MenuItem>
            <MenuItem value="30-days">Last 30 Days</MenuItem>
            <MenuItem value="3-months">Last 3 Months</MenuItem>
            <MenuItem value="12-months">Last 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analyticsData.earnings?.monthly || []}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              tickFormatter={(value) => `GH₵${value}`}
            />
            <ChartTooltip
              contentStyle={{
                backgroundColor: 'rgba(30,30,30,0.95)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value, name) => [
                name === 'earnings' ? formatCurrency(value) : value,
                name === 'earnings' ? 'Earnings' : 'Jobs',
              ]}
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#FFD700"
              strokeWidth={3}
              fill="url(#earningsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );

  // Job Categories Chart
  const JobCategoriesChart = () => (
    <Paper
      sx={{
        p: 3,
        background:
          'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#FFD700',
          fontWeight: 700,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <PieChartIcon />
        Jobs by Category
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.jobs?.byCategory || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="jobs"
                  label={({ name, jobs }) => `${name}: ${jobs}`}
                >
                  {(analyticsData.jobs?.byCategory || []).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ['#FFD700', '#4CAF50', '#2196F3', '#FF9800'][
                            index % 4
                          ]
                        }
                      />
                    ),
                  )}
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30,30,30,0.95)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {(analyticsData.jobs?.byCategory || []).map((category, index) => (
              <Stack
                key={category.name}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: [
                        '#FFD700',
                        '#4CAF50',
                        '#2196F3',
                        '#FF9800',
                      ][index % 4],
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: '#fff', fontWeight: 600 }}
                  >
                    {category.name}
                  </Typography>
                </Stack>
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#4CAF50', fontWeight: 700 }}
                  >
                    {formatCurrency(category.earnings)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {category.jobs} jobs
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  // Performance Metrics Component
  const PerformanceMetrics = () => (
    <Paper
      sx={{
        p: 3,
        background:
          'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#FFD700',
          fontWeight: 700,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <BarChartIcon />
        Skills Performance
      </Typography>

      <Stack spacing={3}>
        {(analyticsData.performance?.skills || []).map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography
                  variant="body1"
                  sx={{ color: '#fff', fontWeight: 600 }}
                >
                  {skill.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {skill.jobs} jobs
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <RatingIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: '#FFD700', fontWeight: 600 }}
                    >
                      {skill.rating.toFixed(1)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: '#4CAF50', fontWeight: 700, minWidth: '45px' }}
                  >
                    {skill.level}%
                  </Typography>
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={skill.level}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${
                      skill.level >= 90
                        ? '#4CAF50'
                        : skill.level >= 70
                          ? '#FFD700'
                          : '#FF9800'
                    } 0%, ${alpha(
                      skill.level >= 90
                        ? '#4CAF50'
                        : skill.level >= 70
                          ? '#FFD700'
                          : '#FF9800',
                      0.8,
                    )} 100%)`,
                  },
                }}
              />
            </Box>
          </motion.div>
        ))}
      </Stack>
    </Paper>
  );

  // Client Satisfaction Component
  const ClientSatisfaction = () => (
    <Paper
      sx={{
        p: 3,
        background:
          'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#FFD700',
          fontWeight: 700,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <RatingIcon />
        Client Satisfaction
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h2"
                sx={{
                  color: '#FFD700',
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  mb: 1,
                }}
              >
                {analyticsData.overview?.averageRating?.toFixed(1) || '0.0'}
              </Typography>
              <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <RatingIcon
                    key={star}
                    sx={{
                      color:
                        star <= (analyticsData.overview?.averageRating || 0)
                          ? '#FFD700'
                          : 'rgba(255,255,255,0.3)',
                      fontSize: 32,
                    }}
                  />
                ))}
              </Stack>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Based on {analyticsData.overview?.totalJobs || 0} reviews
              </Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={1}>
            {(analyticsData.clients?.satisfaction || []).map((rating) => (
              <Stack
                key={rating.rating}
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '20px' }}
                >
                  {rating.rating}
                </Typography>
                <RatingIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                <LinearProgress
                  variant="determinate"
                  value={rating.percentage}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700',
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '40px' }}
                >
                  {rating.count}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  // Tab panels
  const tabPanels = [
    { label: 'Overview', value: 0 },
    { label: 'Earnings', value: 1 },
    { label: 'Jobs', value: 2 },
    { label: 'Performance', value: 3 },
    { label: 'Reports', value: 4 },
  ];

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <OverviewStatistics />
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#FFD700',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 0.5,
              }}
            >
              Analytics Dashboard
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Track your performance and business insights
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                background: alpha('#FFD700', 0.1),
                border: '1px solid rgba(255,215,0,0.3)',
                '&:hover': {
                  background: alpha('#FFD700', 0.2),
                },
              }}
            >
              <RefreshIcon sx={{ color: '#FFD700' }} />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{
                borderColor: 'rgba(255,215,0,0.3)',
                color: '#FFD700',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: alpha('#FFD700', 0.1),
                },
              }}
            >
              Export Report
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Overview Statistics */}
      <Box sx={{ mb: 4 }}>
        <OverviewStatistics />
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FFD700',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
            },
          }}
        >
          {tabPanels.map((panel) => (
            <Tab key={panel.value} label={panel.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EarningsChart />
              </Grid>
              <Grid item xs={12} lg={6}>
                <JobCategoriesChart />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ClientSatisfaction />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EarningsChart />
              </Grid>
              <Grid item xs={12}>
                <JobCategoriesChart />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <JobCategoriesChart />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <PerformanceMetrics />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ClientSatisfaction />
              </Grid>
            </Grid>
          )}

          {activeTab === 4 && (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 3,
              }}
            >
              <ReportIcon
                sx={{ fontSize: 64, color: 'rgba(255,215,0,0.5)', mb: 2 }}
              />
              <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                Advanced Reports
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
              >
                Detailed reporting features with export capabilities coming
                soon!
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: 'rgba(255,215,0,0.3)',
                    color: '#FFD700',
                    '&:hover': {
                      borderColor: '#FFD700',
                      backgroundColor: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  Download PDF Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  sx={{
                    borderColor: 'rgba(255,215,0,0.3)',
                    color: '#FFD700',
                    '&:hover': {
                      borderColor: '#FFD700',
                      backgroundColor: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  Share Analytics
                </Button>
              </Stack>
            </Paper>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAnalyticsPage;

