import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Refresh,
    TrendingUp,
    Work,
    AttachMoney,
    Star
} from '@mui/icons-material';
import api from '../../api/axios';

function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('month');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/analytics/${user.role}/${timeRange}`);
            setAnalytics(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, trend }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4">
                    {value}
                </Typography>
                {trend && (
                    <Typography 
                        variant="body2" 
                        color={trend > 0 ? 'success.main' : 'error.main'}
                        sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                    >
                        <TrendingUp sx={{ mr: 0.5 }} />
                        {trend}% from last {timeRange}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3 
            }}>
                <Typography variant="h5">Analytics Dashboard</Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            label="Time Range"
                        >
                            <MenuItem value="week">Last Week</MenuItem>
                            <MenuItem value="month">Last Month</MenuItem>
                            <MenuItem value="year">Last Year</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchAnalytics}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Total Jobs"
                        value={analytics.totalJobs}
                        icon={<Work color="primary" />}
                        trend={analytics.jobsTrend}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Earnings"
                        value={`$${analytics.totalEarnings}`}
                        icon={<AttachMoney color="primary" />}
                        trend={analytics.earningsTrend}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard
                        title="Success Rate"
                        value={`${analytics.successRate}%`}
                        icon={<Star color="primary" />}
                        trend={analytics.successRateTrend}
                    />
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Earnings Overview
                        </Typography>
                        <ResponsiveContainer>
                            <LineChart data={analytics.earningsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#8884d8" 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Job Categories
                        </Typography>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={analytics.categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.categoryData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]} 
                                        />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default AnalyticsDashboard; 