import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

function PerformanceTrends({ workflowId }) {
    const [data, setData] = useState(null);
    const [timeframe, setTimeframe] = useState('week');
    const [metric, setMetric] = useState('executionTime');

    useEffect(() => {
        loadTrendData();
    }, [workflowId, timeframe, metric]);

    const loadTrendData = async () => {
        try {
            const response = await api.get(`/api/workflows/${workflowId}/performance`, {
                params: { timeframe, metric }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    };

    if (!data) return null;

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Performance Trends</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl size="small">
                                    <InputLabel>Timeframe</InputLabel>
                                    <Select
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        label="Timeframe"
                                    >
                                        <MenuItem value="day">24 Hours</MenuItem>
                                        <MenuItem value="week">Week</MenuItem>
                                        <MenuItem value="month">Month</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small">
                                    <InputLabel>Metric</InputLabel>
                                    <Select
                                        value={metric}
                                        onChange={(e) => setMetric(e.target.value)}
                                        label="Metric"
                                    >
                                        <MenuItem value="executionTime">Execution Time</MenuItem>
                                        <MenuItem value="successRate">Success Rate</MenuItem>
                                        <MenuItem value="errorRate">Error Rate</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Summary Cards */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average
                            </Typography>
                            <Typography variant="h4">
                                {data.summary.average}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Peak
                            </Typography>
                            <Typography variant="h4">
                                {data.summary.peak}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Trend
                            </Typography>
                            <Typography variant="h4" color={data.summary.trend >= 0 ? 'success.main' : 'error.main'}>
                                {data.summary.trend > 0 ? '+' : ''}{data.summary.trend}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PerformanceTrends; 