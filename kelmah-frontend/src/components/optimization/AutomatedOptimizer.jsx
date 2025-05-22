import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    LinearProgress,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Speed,
    Tune,
    Timeline,
    CheckCircle,
    Warning,
    Error,
    PlayArrow,
    Stop,
    Refresh,
    Save,
    History,
    TrendingUp
} from '@mui/icons-material';
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
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function AutomatedOptimizer({ templateId }) {
    const [optimizationStatus, setOptimizationStatus] = useState(null);
    const [optimizationHistory, setOptimizationHistory] = useState([]);
    const [running, setRunning] = useState(false);
    const [selectedOptimization, setSelectedOptimization] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        initializeOptimizer();
        return () => wsRef.current?.close();
    }, [templateId]);

    const initializeOptimizer = async () => {
        try {
            // Initialize WebSocket for real-time optimization updates
            const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/optimize/${templateId}`);
            ws.onmessage = handleOptimizationUpdate;
            wsRef.current = ws;

            await loadOptimizationHistory();
        } catch (error) {
            console.error('Failed to initialize optimizer:', error);
        }
    };

    const handleOptimizationUpdate = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'progress':
                setOptimizationStatus(data.status);
                break;
            case 'complete':
                setRunning(false);
                loadOptimizationHistory();
                break;
            case 'error':
                handleOptimizationError(data.error);
                break;
        }
    };

    const startOptimization = async () => {
        try {
            setRunning(true);
            await api.post(`/api/templates/${templateId}/optimize`);
        } catch (error) {
            console.error('Failed to start optimization:', error);
            setRunning(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Automated Optimization</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={running ? <Stop /> : <PlayArrow />}
                        onClick={running ? stopOptimization : startOptimization}
                        color={running ? 'error' : 'primary'}
                    >
                        {running ? 'Stop Optimization' : 'Start Optimization'}
                    </Button>
                </Box>
            </Box>

            {running && optimizationStatus && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Optimization Progress
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={optimizationStatus.progress} 
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                        {optimizationStatus.currentPhase}: {optimizationStatus.message}
                    </Typography>
                </Box>
            )}

            <Grid container spacing={3}>
                {/* Optimization Metrics */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Performance Score
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={optimizationStatus?.score || 0}
                                size={60}
                                color={getScoreColor(optimizationStatus?.score)}
                            />
                            <Typography variant="h6">
                                {optimizationStatus?.score || 0}%
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Optimization History Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Optimization History
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={optimizationHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <ChartTooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="performanceScore" 
                                    stroke="#8884d8" 
                                    name="Performance Score"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="responseTime" 
                                    stroke="#82ca9d" 
                                    name="Response Time (ms)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Optimization History Table */}
                <Grid item xs={12}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Changes Made</TableCell>
                                <TableCell>Performance Impact</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {optimizationHistory.map(opt => (
                                <TableRow key={opt.id}>
                                    <TableCell>
                                        {new Date(opt.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                            {opt.changes.map((change, index) => (
                                                <li key={index}>{change}</li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={`${opt.performanceImprovement}%`}
                                            color={getImprovementColor(opt.performanceImprovement)}
                                            icon={<TrendingUp />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={opt.status}
                                            color={getStatusColor(opt.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRollback(opt.id)}
                                            disabled={!canRollback(opt)}
                                        >
                                            <History />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Grid>
            </Grid>
        </Paper>
    );
}

// Performance Monitoring Dashboard
function PerformanceDashboard({ templateId }) {
    const [metrics, setMetrics] = useState(null);
    const [timeRange, setTimeRange] = useState('1h');
    const [refreshInterval, setRefreshInterval] = useState(30000);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadPerformanceMetrics();
        const interval = setInterval(loadPerformanceMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [templateId, timeRange, refreshInterval]);

    const loadPerformanceMetrics = async () => {
        try {
            const [metricsRes, alertsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/performance-metrics`, {
                    params: { timeRange }
                }),
                api.get(`/api/templates/${templateId}/performance-alerts`)
            ]);
            setMetrics(metricsRes.data);
            setAlerts(alertsRes.data);
        } catch (error) {
            console.error('Failed to load performance metrics:', error);
        }
    };

    return (
        <Box>
            {/* Active Alerts */}
            {alerts.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {alerts.length} active performance alerts
                </Alert>
            )}

            {/* Performance Metrics Grid */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Response Time
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={getResponseTimeScore(metrics?.avgResponseTime)}
                                size={60}
                                color={getMetricColor(metrics?.avgResponseTime)}
                            />
                            <Typography variant="h6">
                                {metrics?.avgResponseTime}ms
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Throughput
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={getThroughputScore(metrics?.throughput)}
                                size={60}
                                color={getMetricColor(metrics?.throughput)}
                            />
                            <Typography variant="h6">
                                {metrics?.throughput} req/s
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Error Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={100 - (metrics?.errorRate || 0)}
                                size={60}
                                color={getErrorRateColor(metrics?.errorRate)}
                            />
                            <Typography variant="h6">
                                {metrics?.errorRate}%
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            CPU Usage
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={metrics?.cpuUsage || 0}
                                size={60}
                                color={getResourceColor(metrics?.cpuUsage)}
                            />
                            <Typography variant="h6">
                                {metrics?.cpuUsage}%
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Performance Timeline */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Performance Timeline
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={metrics?.timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <ChartTooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="responseTime"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.3}
                                    name="Response Time (ms)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="throughput"
                                    stroke="#82ca9d"
                                    fill="#82ca9d"
                                    fillOpacity={0.3}
                                    name="Throughput (req/s)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export { AutomatedOptimizer, PerformanceDashboard }; 