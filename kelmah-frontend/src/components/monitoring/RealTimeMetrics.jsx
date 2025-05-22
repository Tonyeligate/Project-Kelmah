import React, { useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Tooltip,
    IconButton,
    Chip
} from '@mui/material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Speed,
    Memory,
    Error,
    Timeline,
    Refresh,
    WifiOff
} from '@mui/icons-material';
import { useRealTimeAnalytics } from '../../hooks/useRealTimeAnalytics';

function RealTimeMetrics() {
    const { metrics, connected, error } = useRealTimeAnalytics();

    const performanceData = useMemo(() => {
        if (!metrics?.performance) return [];
        return metrics.performance.map(m => ({
            name: m.workflow_name,
            executionTime: m.avg_execution_time,
            successRate: m.success_rate
        }));
    }, [metrics]);

    const resourceData = useMemo(() => {
        if (!metrics?.resources) return [];
        return [{
            avgMemory: metrics.resources.avg_memory / 1024, // Convert to MB
            peakMemory: metrics.resources.peak_memory / 1024,
            executions: metrics.resources.total_executions
        }];
    }, [metrics]);

    const errorData = useMemo(() => {
        if (!metrics?.errors) return [];
        return metrics.errors.map(e => ({
            message: e.error_message,
            count: e.occurrence_count
        }));
    }, [metrics]);

    if (!metrics) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline />
                    Real-Time Metrics
                    {!connected && (
                        <Chip
                            icon={<WifiOff />}
                            label="Disconnected"
                            color="error"
                            size="small"
                        />
                    )}
                </Typography>
                <Tooltip title="Auto-refreshing">
                    <IconButton>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Performance Overview */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Speed color="primary" />
                                <Typography variant="h6">
                                    Performance
                                </Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="executionTime"
                                        stroke="#8884d8"
                                        name="Execution Time (ms)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Resource Usage */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Memory color="primary" />
                                <Typography variant="h6">
                                    Resource Usage
                                </Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={resourceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="avgMemory"
                                        stroke="#82ca9d"
                                        fill="#82ca9d"
                                        name="Avg Memory (MB)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="peakMemory"
                                        stroke="#ffc658"
                                        fill="#ffc658"
                                        name="Peak Memory (MB)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Error Distribution */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Error color="error" />
                                <Typography variant="h6">
                                    Error Distribution
                                </Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={errorData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="message" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar
                                        dataKey="count"
                                        fill="#ff7043"
                                        name="Error Count"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Success Rate */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Workflow Success Rates
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar
                                    dataKey="successRate"
                                    fill="#4caf50"
                                    name="Success Rate (%)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default RealTimeMetrics; 