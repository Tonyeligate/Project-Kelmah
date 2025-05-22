import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import {
    Refresh,
    FileDownload,
    TrendingUp,
    Schedule,
    AttachMoney
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function DisputeAnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('30');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trends, setTrends] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [analyticsResponse, trendsResponse] = await Promise.all([
                api.get(`/api/analytics/disputes?timeRange=${timeRange}`),
                api.get(`/api/analytics/disputes/trends?timeRange=${timeRange}`)
            ]);
            setAnalytics(analyticsResponse.data);
            setTrends(trendsResponse.data);
        } catch (error) {
            setError('Error loading analytics data');
            enqueueSnackbar('Error loading analytics', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await api.get(`/api/analytics/disputes/export?timeRange=${timeRange}&format=${format}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `dispute_analytics_${new Date().toISOString()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            enqueueSnackbar('Error exporting analytics', { variant: 'error' });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">
                    Dispute Analytics Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            label="Time Range"
                        >
                            <MenuItem value="7">Last 7 days</MenuItem>
                            <MenuItem value="30">Last 30 days</MenuItem>
                            <MenuItem value="90">Last 90 days</MenuItem>
                            <MenuItem value="365">Last year</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadAnalytics}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Excel">
                        <IconButton onClick={() => handleExport('excel')}>
                            <FileDownload />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Disputes
                            </Typography>
                            <Typography variant="h4">
                                {analytics.summary.total_disputes}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {trends.dispute_growth > 0 ? '+' : ''}{trends.dispute_growth}% vs previous period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Resolution Rate
                            </Typography>
                            <Typography variant="h4">
                                {analytics.summary.resolution_rate}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {trends.resolution_rate_change > 0 ? '+' : ''}{trends.resolution_rate_change}% vs previous period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Avg Resolution Time
                            </Typography>
                            <Typography variant="h4">
                                {analytics.summary.avg_resolution_time}h
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {trends.resolution_time_change > 0 ? '+' : ''}{trends.resolution_time_change}% vs previous period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Customer Satisfaction
                            </Typography>
                            <Typography variant="h4">
                                {analytics.summary.avg_satisfaction}/5
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {trends.satisfaction_change > 0 ? '+' : ''}{trends.satisfaction_change}% vs previous period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dispute Trend Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Dispute Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip />
                                <Area 
                                    type="monotone" 
                                    dataKey="disputes" 
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.3}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="resolutions" 
                                    stroke="#82ca9d"
                                    fill="#82ca9d"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Category Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Dispute Categories
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.categories}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.categories.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Resolution Time Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Resolution Time Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.resolutionTimes}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DisputeAnalyticsDashboard;