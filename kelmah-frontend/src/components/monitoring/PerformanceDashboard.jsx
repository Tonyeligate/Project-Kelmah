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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip
} from '@mui/material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
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
    Warning,
    CheckCircle,
    Timeline,
    Memory,
    Speed,
    Error
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

function PerformanceDashboard() {
    const [timeRange, setTimeRange] = useState('24');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [timeRange]);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const [metricsResponse, errorsResponse, utilizationResponse] = await Promise.all([
                api.get(`/api/monitoring/performance?timeRange=${timeRange}`),
                api.get(`/api/monitoring/errors?timeRange=${timeRange}`),
                api.get(`/api/monitoring/utilization?timeRange=${timeRange}`)
            ]);
            
            setMetrics({
                performance: metricsResponse.data,
                errors: errorsResponse.data,
                utilization: utilizationResponse.data
            });
        } catch (error) {
            setError('Error loading performance metrics');
            enqueueSnackbar('Error loading metrics', { variant: 'error' });
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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">
                    Workflow Performance Monitor
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            label="Time Range"
                        >
                            <MenuItem value="1">Last hour</MenuItem>
                            <MenuItem value="24">Last 24 hours</MenuItem>
                            <MenuItem value="168">Last 7 days</MenuItem>
                            <MenuItem value="720">Last 30 days</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadMetrics}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Performance Overview Cards */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Speed color="primary" />
                                <Typography color="textSecondary">
                                    Success Rate
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ mt: 2 }}>
                                {metrics.performance.success_rate.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                vs {metrics.performance.previous_success_rate.toFixed(1)}% last period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Timeline color="primary" />
                                <Typography color="textSecondary">
                                    Avg Response Time
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ mt: 2 }}>
                                {metrics.performance.avg_response_time.toFixed(2)}ms
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Peak: {metrics.performance.peak_response_time}ms
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Memory color="primary" />
                                <Typography color="textSecondary">
                                    Memory Usage
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ mt: 2 }}>
                                {(metrics.utilization.memory_usage / 1024).toFixed(2)}MB
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Peak: {(metrics.utilization.peak_memory / 1024).toFixed(2)}MB
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Error color="error" />
                                <Typography color="textSecondary">
                                    Error Rate
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ mt: 2 }}>
                                {metrics.performance.error_rate.toFixed(2)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {metrics.errors.total_errors} total errors
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Performance Trends */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={metrics.performance.trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <RechartsTooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="response_time"
                                    stroke="#8884d8"
                                    name="Response Time (ms)"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="success_rate"
                                    stroke="#82ca9d"
                                    name="Success Rate (%)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Resource Utilization */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Resource Utilization
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={metrics.utilization.history}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="memory_used"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    name="Memory Usage (MB)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cpu_usage"
                                    stroke="#82ca9d"
                                    fill="#82ca9d"
                                    name="CPU Usage (%)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Error Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Error Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metrics.errors.distribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="error_type" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#ff7043" name="Error Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Recent Errors */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Errors
                        </Typography>
                        <List>
                            {metrics.errors.recent.map((error, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        <Warning color="error" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={error.message}
                                        secondary={`${error.workflow_name} - ${new Date(error.timestamp).toLocaleString()}`}
                                    />
                                    <Chip
                                        label={error.error_type}
                                        color="error"
                                        size="small"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PerformanceDashboard; 