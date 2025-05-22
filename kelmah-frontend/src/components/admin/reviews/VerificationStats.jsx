import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CheckCircle,
  Cancel,
  Warning,
  HourglassEmpty,
  AutoAwesome,
  ErrorOutline
} from '@mui/icons-material';

/**
 * Component for displaying verification statistics in the admin dashboard
 */
const VerificationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart colors
  const COLORS = {
    pending: '#1976d2',
    suspicious: '#ff9800',
    verified: '#4caf50',
    rejected: '#f44336',
    autoApproved: '#9c27b0'
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/reviews/verification/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching verification stats:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching verification statistics');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format flag label for display
   */
  const formatFlagLabel = (flag) => {
    return flag
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Get icon for status type
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle sx={{ color: COLORS.verified }} />;
      case 'rejected':
        return <Cancel sx={{ color: COLORS.rejected }} />;
      case 'suspicious':
        return <Warning sx={{ color: COLORS.suspicious }} />;
      case 'pending':
        return <HourglassEmpty sx={{ color: COLORS.pending }} />;
      case 'autoApproved':
        return <AutoAwesome sx={{ color: COLORS.autoApproved }} />;
      default:
        return <ErrorOutline />;
    }
  };

  /**
   * Prepare data for status pie chart
   */
  const prepareStatusChartData = (counts) => {
    return [
      { name: 'Pending', value: counts.pending, color: COLORS.pending },
      { name: 'Suspicious', value: counts.suspicious, color: COLORS.suspicious },
      { name: 'Verified', value: counts.verified, color: COLORS.verified },
      { name: 'Rejected', value: counts.rejected, color: COLORS.rejected }
    ].filter(item => item.value > 0);
  };

  /**
   * Prepare data for flags bar chart
   */
  const prepareFlagChartData = (flagDistribution) => {
    // Take only top 6 flags for readability
    return flagDistribution.slice(0, 6).map(flag => ({
      name: formatFlagLabel(flag._id),
      count: flag.count
    }));
  };

  /**
   * Custom tooltip for pie chart
   */
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {`${payload[0].name}: ${payload[0].value} (${((payload[0].value / stats.counts.total) * 100).toFixed(1)}%)`}
          </Typography>
        </Paper>
      );
    }

    return null;
  };

  /**
   * Custom tooltip for bar chart
   */
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {`${payload[0].payload.name}: ${payload[0].value} instances`}
          </Typography>
        </Paper>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="info">No verification statistics available.</Alert>;
  }

  const statusData = prepareStatusChartData(stats.counts);
  const flagData = stats.flagDistribution ? prepareFlagChartData(stats.flagDistribution) : [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review Verification Statistics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Review Status Distribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Review Status Counts" />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon('pending')}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Pending: <strong>{stats.counts.pending}</strong>
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon('suspicious')}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Suspicious: <strong>{stats.counts.suspicious}</strong>
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon('verified')}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Verified: <strong>{stats.counts.verified}</strong>
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon('rejected')}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Rejected: <strong>{stats.counts.rejected}</strong>
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon('autoApproved')}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Auto-Approved: <strong>{stats.counts.autoApproved}</strong>
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" fontWeight="bold">
                    Total: {stats.counts.total}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {flagData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Common Flag Distribution" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={flagData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                  />
                  <YAxis />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title="Flag Details" />
        <CardContent>
          <Grid container spacing={1}>
            {stats.flagDistribution && stats.flagDistribution.map((flag) => (
              <Grid item key={flag._id}>
                <Chip
                  label={`${formatFlagLabel(flag._id)}: ${flag.count}`}
                  color="error"
                  variant="outlined"
                  icon={<ErrorOutline fontSize="small" />}
                  sx={{ mb: 1 }}
                />
              </Grid>
            ))}
            {(!stats.flagDistribution || stats.flagDistribution.length === 0) && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No flags have been detected yet.
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerificationStats; 