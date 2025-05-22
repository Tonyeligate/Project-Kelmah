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
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
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
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    Scatter,
    ScatterChart
} from 'recharts';
import {
    Refresh,
    FileDownload,
    TrendingUp,
    Assessment,
    Timeline
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function AdvancedAnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('30');
    const [analytics, setAnalytics] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [analyticsResponse, predictionsResponse] = await Promise.all([
                api.get(`/api/analytics/advanced?timeRange=${timeRange}`),
                api.get('/api/analytics/predictions')
            ]);
            setAnalytics(analyticsResponse.data);
            setPredictions(predictionsResponse.data);
        } catch (error) {
            setError('Error loading analytics data');
            enqueueSnackbar('Error loading analytics', { variant: 'error' });
        } finally {
            setLoading(false);
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
                    Advanced Analytics Dashboard
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
                    <Tooltip title="Export">
                        <IconButton>
                            <FileDownload />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label="Performance Metrics" />
                <Tab label="Workflow Analytics" />
                <Tab label="Predictive Analytics" />
                <Tab label="Risk Analysis" />
            </Tabs>

            {/* Performance Metrics Tab */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {/* Performance Cards */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Resolution Rate
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.performanceMetrics.resolution_rate}%
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    vs {analytics.performanceMetrics.previous_rate}% last period
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Add more performance metric cards */}

                    {/* Time Series Chart */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Dispute Resolution Trends
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analytics.timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="new_disputes"
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

                    {/* Category Performance */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Category Performance
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.categoryTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="resolved" fill="#82ca9d" />
                                    <Bar dataKey="total" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Add more performance charts */}
                </Grid>
            )}

            {/* Workflow Analytics Tab */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {/* Workflow efficiency metrics */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Automation Success Rate
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.workflowMetrics.success_rate}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Add more workflow metric cards */}

                    {/* Workflow performance charts */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Automation Performance
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.workflowPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="automations"
                                        stroke="#8884d8"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="success_rate"
                                        stroke="#82ca9d"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Predictive Analytics Tab */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    {/* Prediction metrics */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Expected Dispute Volume
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour_of_day" />
                                    <YAxis dataKey="expected_count" />
                                    <RechartsTooltip />
                                    <Scatter
                                        data={predictions.volumePredictions}
                                        fill="#8884d8"
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Risk Analysis Tab */}
            {activeTab === 3 && (
                <Grid container spacing={3}>
                    {/* Risk factor analysis */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Risk Factors by Category
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.riskFactors}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="risk_score" fill="#ff7043" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default AdvancedAnalyticsDashboard; 