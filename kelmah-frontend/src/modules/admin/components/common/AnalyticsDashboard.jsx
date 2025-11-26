import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../../auth/hooks/useAuth';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    systemHealth: 'good',
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system stats
      const systemStats = await adminService.getSystemStats();
      setStats(systemStats);

      // Mock data for other analytics (in a real app, these would be API calls)
      setRecentActivity([
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered: John Doe',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          icon: PersonIcon,
          color: 'success',
        },
        {
          id: 2,
          type: 'job_posted',
          message: 'New job posted: Web Developer',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          icon: WorkIcon,
          color: 'primary',
        },
        {
          id: 3,
          type: 'payment',
          message: 'Payment processed: GH₵ 500.00',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          icon: MoneyIcon,
          color: 'success',
        },
      ]);

      setUserGrowth([
        { month: 'Jan', users: 120, growth: 12 },
        { month: 'Feb', users: 145, growth: 21 },
        { month: 'Mar', users: 180, growth: 24 },
        { month: 'Apr', users: 210, growth: 17 },
        { month: 'May', users: 240, growth: 14 },
        { month: 'Jun', users: 280, growth: 17 },
      ]);

      setSystemAlerts([
        {
          id: 1,
          type: 'info',
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          id: 2,
          type: 'warning',
          message: 'High memory usage detected on server',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ]);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <SpeedIcon />;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 3 months</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="overline"
                  >
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalUsers)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon
                      color="success"
                      sx={{ fontSize: 16, mr: 0.5 }}
                    />
                    <Typography variant="body2" color="success.main">
                      +12% from last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="overline"
                  >
                    Active Jobs
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.activeJobs || 156)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon
                      color="success"
                      sx={{ fontSize: 16, mr: 0.5 }}
                    />
                    <Typography variant="body2" color="success.main">
                      +8% from last week
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <WorkIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="overline"
                  >
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats.monthlyRevenue || 25000)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon
                      color="success"
                      sx={{ fontSize: 16, mr: 0.5 }}
                    />
                    <Typography variant="body2" color="success.main">
                      +15% from last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="overline"
                  >
                    System Health
                  </Typography>
                  <Typography variant="h4">
                    <Chip
                      label={stats.systemHealth.toUpperCase()}
                      color={getHealthColor(stats.systemHealth)}
                      size="small"
                    />
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      All systems operational
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  {getHealthIcon(stats.systemHealth)}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Tables Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="User Growth Trend"
              subheader="Monthly user registrations"
            />
            <CardContent>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {userGrowth.map((item, index) => (
                  <Box key={item.month} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{item.month}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.users} users
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.users / 300) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: `${activity.color}.main`,
                        }}
                      >
                        <activity.icon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={formatTime(activity.timestamp)}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row - Tables and Alerts */}
      <Grid container spacing={3}>
        {/* Top Performers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Performing Workers" />
            <CardContent sx={{ pt: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Worker</TableCell>
                      <TableCell>Jobs Completed</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Earnings</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      {
                        name: 'Alice Johnson',
                        jobs: 23,
                        rating: 4.9,
                        earnings: 3400,
                      },
                      {
                        name: 'Bob Smith',
                        jobs: 19,
                        rating: 4.8,
                        earnings: 2800,
                      },
                      {
                        name: 'Carol Davis',
                        jobs: 17,
                        rating: 4.7,
                        earnings: 2600,
                      },
                    ].map((worker, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1,
                                bgcolor: 'primary.main',
                              }}
                            >
                              {worker.name[0]}
                            </Avatar>
                            {worker.name}
                          </Box>
                        </TableCell>
                        <TableCell>{worker.jobs}</TableCell>
                        <TableCell>
                          <Chip
                            label={worker.rating}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(worker.earnings)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Alerts" />
            <CardContent sx={{ pt: 0 }}>
              {systemAlerts.length > 0 ? (
                <List dense>
                  {systemAlerts.map((alert) => (
                    <ListItem key={alert.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {alert.type === 'warning' ? (
                          <WarningIcon color="warning" />
                        ) : alert.type === 'error' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          <NotificationIcon color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={formatTime(alert.timestamp)}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 2 }}
                >
                  No system alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;

