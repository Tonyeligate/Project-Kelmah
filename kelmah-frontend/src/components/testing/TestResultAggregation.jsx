import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    IconButton,
    Button,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Warning,
    Error,
    CheckCircle,
    Download,
    Refresh,
    Timeline,
    BugReport,
    Speed
} from '@mui/icons-material';
import {
    ResponsiveContainer,
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
    Legend
} from 'recharts';
import { useSnackbar } from 'notistack';

const COLORS = {
    passed: '#4caf50',
    failed: '#f44336',
    skipped: '#ff9800',
    error: '#d32f2f'
};

function TestResultAggregation({ filters }) {
    const [aggregation, setAggregation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMetric, setSelectedMetric] = useState('status');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAggregation();
    }, [filters]);

    const loadAggregation = async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/test-results/aggregate', filters);
            setAggregation(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading aggregation data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.post('/api/test-results/aggregate/export', {
                filters,
                format: 'xlsx'
            }, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'test-results-aggregation.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            enqueueSnackbar('Error exporting aggregation data', { variant: 'error' });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (!aggregation) {
        return (
            <Alert severity="error">
                Failed to load aggregation data
            </Alert>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Test Results Analysis</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<Refresh />}
                        onClick={loadAggregation}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Tests
                            </Typography>
                            <Typography variant="h4">
                                {aggregation.summary.total}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label={`${aggregation.summary.success_rate.toFixed(1)}% Success Rate`}
                                    color={aggregation.summary.success_rate >= 80 ? 'success' : 'warning'}
                                    size="small"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Execution Time
                            </Typography>
                            <Typography variant="h4">
                                {aggregation.summary.avg_execution_time.toFixed(0)}ms
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Tooltip title="Range: min-max">
                                    <Typography variant="body2" color="textSecondary">
                                        {aggregation.summary.min_execution_time}ms - {aggregation.summary.max_execution_time}ms
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                {/* Add more summary cards */}
            </Grid>

            {/* Main Content */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Status Distribution" icon={<CheckCircle />} />
                    <Tab label="Performance Trends" icon={<Timeline />} />
                    <Tab label="Error Analysis" icon={<BugReport />} />
                    <Tab label="Patterns" icon={<Speed />} />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Passed', value: aggregation.summary.passed },
                                                { name: 'Failed', value: aggregation.summary.failed },
                                                { name: 'Skipped', value: aggregation.summary.skipped },
                                                { name: 'Error', value: aggregation.summary.error }
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {Object.entries(COLORS).map(([key, color]) => (
                                                <Cell key={key} fill={color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Count</TableCell>
                                                <TableCell align="right">Percentage</TableCell>
                                                <TableCell align="right">Avg Time</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(aggregation.breakdowns.byStatus).map(([status, data]) => (
                                                <TableRow key={status}>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={status}
                                                            color={status === 'passed' ? 'success' : 'error'}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{data.count}</TableCell>
                                                    <TableCell align="right">
                                                        {((data.count / aggregation.summary.total) * 100).toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {data.avg_execution_time.toFixed(0)}ms
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={aggregation.trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="success_rate"
                                        stroke="#8884d8"
                                        name="Success Rate (%)"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="avg_execution_time"
                                        stroke="#82ca9d"
                                        name="Avg Execution Time (ms)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    )}

                    {/* Add more tab content */}
                </Box>
            </Paper>

            {/* Patterns and Insights */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Key Insights
                </Typography>
                <Grid container spacing={2}>
                    {aggregation.patterns.frequent_failures.map((pattern, index) => (
                        <Grid item xs={12} key={index}>
                            <Alert
                                severity={pattern.severity}
                                icon={pattern.severity === 'warning' ? <Warning /> : <Error />}
                            >
                                <Typography variant="subtitle2">{pattern.title}</Typography>
                                <Typography variant="body2">{pattern.description}</Typography>
                            </Alert>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
}

export default TestResultAggregation; 