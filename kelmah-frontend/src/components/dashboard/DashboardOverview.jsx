import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    IconButton,
    Button,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Refresh,
    TrendingUp,
    TrendingDown,
    Warning,
    CheckCircle,
    Timer,
    BugReport
} from '@mui/icons-material';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

function DashboardOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/dashboard/overview');
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return null;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Test Dashboard</Typography>
                <Button
                    startIcon={<Refresh />}
                    onClick={loadDashboardData}
                >
                    Refresh
                </Button>
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Success Rate
                            </Typography>
                            <Typography variant="h4">
                                {data.successRate}%
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                {data.successRateTrend > 0 ? (
                                    <TrendingUp color="success" />
                                ) : (
                                    <TrendingDown color="error" />
                                )}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    {Math.abs(data.successRateTrend)}% vs last week
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Similar cards for other metrics */}
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Test Execution Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data.executionTrends}>
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

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Issues
                        </Typography>
                        {data.recentIssues.map((issue, index) => (
                            <Alert
                                key={index}
                                severity={issue.severity}
                                sx={{ mb: 1 }}
                            >
                                {issue.message}
                            </Alert>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardOverview; 