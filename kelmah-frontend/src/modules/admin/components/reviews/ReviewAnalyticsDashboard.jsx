import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  Flag as FlagIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { motion } from 'framer-motion';
import reviewsApi from '../../../../services/reviewsApi';

/**
 * Comprehensive Review Analytics Dashboard
 * Provides detailed insights into review patterns, trends, and quality metrics
 */
const ReviewAnalyticsDashboard = () => {
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalReviews: 0,
      averageRating: 0,
      reviewsThisMonth: 0,
      averageResponseTime: 0,
      moderationBacklog: 0,
      qualityScore: 0
    },
    trends: [],
    categoryBreakdown: [],
    moderationStats: [],
    topWorkers: [],
    ratingDistribution: [],
    recentActivity: [],
    qualityMetrics: {
      authenticity: 0,
      helpfulness: 0,
      completeness: 0,
      timeliness: 0
    }
  });

  // Color schemes
  const colors = {
    primary: '#FFD700',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    chart: ['#FFD700', '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4']
  };

  // Mock API for development (replace with actual API calls)
  const analyticsApi = {
    async getReviewAnalytics(timeRange = '30d') {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        overview: {
          totalReviews: 1247,
          averageRating: 4.3,
          reviewsThisMonth: 156,
          averageResponseTime: 4.2, // hours
          moderationBacklog: 23,
          qualityScore: 87.5
        },
        trends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reviews: Math.floor(Math.random() * 20) + 5,
          averageRating: (Math.random() * 1.5 + 3.5).toFixed(1),
          approved: Math.floor(Math.random() * 15) + 3,
          rejected: Math.floor(Math.random() * 3) + 1,
          flagged: Math.floor(Math.random() * 2)
        })),
        categoryBreakdown: [
          { name: 'Carpentry', reviews: 324, averageRating: 4.6, growth: 12.5 },
          { name: 'Plumbing', reviews: 289, averageRating: 4.2, growth: -3.2 },
          { name: 'Electrical', reviews: 267, averageRating: 4.4, growth: 8.7 },
          { name: 'Painting', reviews: 198, averageRating: 4.1, growth: 15.3 },
          { name: 'Masonry', reviews: 169, averageRating: 4.5, growth: -1.8 }
        ],
        moderationStats: [
          { status: 'Approved', count: 956, percentage: 76.7, color: '#4CAF50' },
          { status: 'Pending', count: 156, percentage: 12.5, color: '#FF9800' },
          { status: 'Rejected', count: 89, percentage: 7.1, color: '#F44336' },
          { status: 'Flagged', count: 46, percentage: 3.7, color: '#9C27B0' }
        ],
        topWorkers: [
          { 
            id: 1, 
            name: 'James Garcia', 
            profession: 'Carpenter',
            totalReviews: 87, 
            averageRating: 4.9, 
            recentTrend: 'up',
            profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
          },
          { 
            id: 2, 
            name: 'Maria Rodriguez', 
            profession: 'Electrician',
            totalReviews: 76, 
            averageRating: 4.8, 
            recentTrend: 'up',
            profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b3fd?w=100&h=100&fit=crop&crop=face'
          },
          { 
            id: 3, 
            name: 'Robert Martinez', 
            profession: 'Plumber',
            totalReviews: 69, 
            averageRating: 4.7, 
            recentTrend: 'stable',
            profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          },
          { 
            id: 4, 
            name: 'Jennifer Lopez', 
            profession: 'Painter',
            totalReviews: 58, 
            averageRating: 4.6, 
            recentTrend: 'down',
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
          },
          { 
            id: 5, 
            name: 'William Davis', 
            profession: 'Mason',
            totalReviews: 52, 
            averageRating: 4.5, 
            recentTrend: 'up',
            profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
          }
        ],
        ratingDistribution: [
          { rating: 5, count: 634, percentage: 50.8 },
          { rating: 4, count: 374, percentage: 30.0 },
          { rating: 3, count: 149, percentage: 11.9 },
          { rating: 2, count: 62, percentage: 5.0 },
          { rating: 1, count: 28, percentage: 2.3 }
        ],
        qualityMetrics: {
          authenticity: 92.3, // AI-verified authenticity score
          helpfulness: 78.9,  // Community helpfulness votes
          completeness: 85.6, // Review content completeness
          timeliness: 91.2    // Review submission timeliness
        },
        recentActivity: [
          { type: 'approved', reviewer: 'Admin Sarah', count: 12, timestamp: '2 hours ago' },
          { type: 'flagged', reviewer: 'Auto-Moderation', count: 3, timestamp: '4 hours ago' },
          { type: 'rejected', reviewer: 'Admin Mike', count: 5, timestamp: '6 hours ago' },
          { type: 'approved', reviewer: 'Admin Sarah', count: 8, timestamp: '8 hours ago' },
          { type: 'escalated', reviewer: 'System', count: 2, timestamp: '12 hours ago' }
        ]
      };
    }
  };

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getReviewAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(40,40,40,0.95)', border: '1px solid rgba(255,215,0,0.3)' }}>
          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Overview metrics cards
  const OverviewCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[
        { 
          title: 'Total Reviews', 
          value: analytics.overview.totalReviews.toLocaleString(), 
          icon: AssessmentIcon, 
          color: colors.primary,
          trend: '+12.5%'
        },
        { 
          title: 'Average Rating', 
          value: analytics.overview.averageRating.toFixed(1), 
          icon: StarIcon, 
          color: colors.success,
          trend: '+0.2'
        },
        { 
          title: 'Monthly Reviews', 
          value: analytics.overview.reviewsThisMonth, 
          icon: TimelineIcon, 
          color: colors.info,
          trend: '+8.3%'
        },
        { 
          title: 'Response Time', 
          value: `${analytics.overview.averageResponseTime}h`, 
          icon: SpeedIcon, 
          color: colors.warning,
          trend: '-15.2%'
        },
        { 
          title: 'Moderation Backlog', 
          value: analytics.overview.moderationBacklog, 
          icon: PendingIcon, 
          color: analytics.overview.moderationBacklog > 20 ? colors.error : colors.success,
          trend: analytics.overview.moderationBacklog > 20 ? '+23.1%' : '-12.4%'
        },
        { 
          title: 'Quality Score', 
          value: `${analytics.overview.qualityScore}%`, 
          icon: SecurityIcon, 
          color: colors.success,
          trend: '+2.1%'
        }
      ].map((metric, index) => (
        <Grid item xs={12} sm={6} md={2} key={metric.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(metric.color, 0.1)} 0%, ${alpha(metric.color, 0.05)} 100%)`,
              border: `1px solid ${alpha(metric.color, 0.2)}`,
              height: '100%'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <metric.icon sx={{ fontSize: 32, color: metric.color, mb: 1 }} />
                <Typography variant="h4" sx={{ color: metric.color, fontWeight: 800, mb: 0.5 }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                  {metric.title}
                </Typography>
                <Chip 
                  label={metric.trend} 
                  size="small"
                  sx={{ 
                    backgroundColor: metric.trend.startsWith('+') ? alpha(colors.success, 0.2) : alpha(colors.error, 0.2),
                    color: metric.trend.startsWith('+') ? colors.success : colors.error,
                    fontSize: '0.7rem'
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );

  // Quality metrics radial chart
  const QualityMetricsChart = () => {
    const data = Object.entries(analytics.qualityMetrics).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: colors.chart[Object.keys(analytics.qualityMetrics).indexOf(key)]
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
          <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RadialBarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#FFD700' }} size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
          Review Analytics Dashboard
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,215,0,0.5)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' }
              }}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            sx={{ 
              borderColor: 'rgba(255,215,0,0.5)',
              color: '#FFD700',
              '&:hover': { borderColor: '#FFD700', backgroundColor: alpha('#FFD700', 0.1) }
            }}
            variant="outlined"
          >
            Refresh
          </Button>
          
          <Button
            startIcon={<ExportIcon />}
            sx={{ 
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
            }}
            variant="contained"
          >
            Export Report
          </Button>
        </Stack>
      </Stack>

      {/* Overview Cards */}
      <OverviewCards />

      {/* Main Analytics Grid */}
      <Grid container spacing={3}>
        {/* Review Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            height: 400
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Review Trends & Moderation Activity
                </Typography>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke={colors.primary} 
                    fill={alpha(colors.primary, 0.3)}
                    name="Total Reviews"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stroke={colors.success} 
                    fill={alpha(colors.success, 0.3)}
                    name="Approved"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    stroke={colors.error} 
                    fill={alpha(colors.error, 0.3)}
                    name="Rejected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality Metrics */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            height: 400
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Quality Metrics
                </Typography>
              }
            />
            <CardContent>
              <QualityMetricsChart />
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Category Performance
                </Typography>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {analytics.categoryBreakdown.map((category, index) => (
                  <Box key={category.name}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Rating value={category.averageRating} readOnly size="small" />
                        <Typography variant="body2" sx={{ color: '#FFD700' }}>
                          {category.averageRating}
                        </Typography>
                        <Chip 
                          label={`${category.growth > 0 ? '+' : ''}${category.growth}%`}
                          size="small"
                          icon={category.growth > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          sx={{
                            backgroundColor: category.growth > 0 ? alpha(colors.success, 0.2) : alpha(colors.error, 0.2),
                            color: category.growth > 0 ? colors.success : colors.error,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Stack>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={(category.reviews / Math.max(...analytics.categoryBreakdown.map(c => c.reviews))) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': { 
                          backgroundColor: colors.chart[index % colors.chart.length],
                          borderRadius: 4
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {category.reviews} reviews
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Rated Workers */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Top Rated Workers
                </Typography>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                {analytics.topWorkers.map((worker, index) => (
                  <ListItem key={worker.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <ListItemIcon>
                      <Avatar src={worker.profilePicture} sx={{ width: 40, height: 40 }}>
                        {worker.name[0]}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                            {worker.name}
                          </Typography>
                          {worker.recentTrend === 'up' && <TrendingUpIcon sx={{ color: colors.success, fontSize: 16 }} />}
                          {worker.recentTrend === 'down' && <TrendingDownIcon sx={{ color: colors.error, fontSize: 16 }} />}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {worker.profession} • {worker.totalReviews} reviews
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Rating value={worker.averageRating} readOnly size="small" />
                            <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                              {worker.averageRating}
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="h6" sx={{ color: colors.primary, fontWeight: 700 }}>
                        #{index + 1}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Moderation Statistics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            height: 350
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Moderation Statistics
                </Typography>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.moderationStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.moderationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            height: 350
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Rating Distribution
                </Typography>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="rating" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewAnalyticsDashboard;