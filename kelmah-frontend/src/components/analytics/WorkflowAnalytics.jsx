import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {
    Timeline,
    Assessment,
    Speed,
    TrendingUp,
    Warning,
    CheckCircle
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function WorkflowAnalytics({ templateId }) {
    const [timeRange, setTimeRange] = useState('7d');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState([]);
    const [performanceData, setPerformanceData] = useState(null);

    useEffect(() => {
        loadAnalyticsData();
    }, [templateId, timeRange]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            const [metricsRes, trendRes, perfRes] = await Promise.all([
                api.get(`/api/analytics/workflow/${templateId}/metrics`, {
                    params: { timeRange }
                }),
                api.get(`/api/analytics/workflow/${templateId}/trends`, {
                    params: { timeRange }
                }),
                api.get(`/api/analytics/workflow/${templateId}/performance`, {
                    params: { timeRange }
                })
            ]);

            setMetrics(metricsRes.data);
            setTrendData(trendRes.data);
            setPerformanceData(perfRes.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Workflow Analytics</Typography>
                <FormControl size="small">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        label="Time Range"
                    >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="90d">Last 90 Days</MenuItem>
                        <MenuItem value="1y">Last Year</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Key Metrics */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Review Time
                            </Typography>
                            <Typography variant="h4">
                                {metrics.avgReviewTime}h
                            </Typography>
                            <Typography variant="body2" color={metrics.reviewTimeTrend > 0 ? 'error' : 'success'}>
                                {metrics.reviewTimeTrend}% vs previous period
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {/* Add more metric cards */}

                {/* Trend Charts */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Workflow Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="reviews" stroke="#8884d8" />
                                <Line type="monotone" dataKey="approvals" stroke="#82ca9d" />
                                <Line type="monotone" dataKey="rejections" stroke="#ff7300" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Performance Metrics */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Review Performance
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={performanceData.reviewers}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip />
                                <Legend />
                                <Bar dataKey="completed" fill="#8884d8" />
                                <Bar dataKey="pending" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// Automated Testing Features
function AutomatedTesting({ templateId }) {
    const [testSuites, setTestSuites] = useState([]);
    const [activeTest, setActiveTest] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [testConfig, setTestConfig] = useState({
        automated: true,
        schedule: 'daily',
        notifications: true
    });

    useEffect(() => {
        loadTestSuites();
    }, [templateId]);

    const loadTestSuites = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/test-suites`);
            setTestSuites(response.data);
        } catch (error) {
            console.error('Failed to load test suites:', error);
        }
    };

    const runTestSuite = async (suiteId) => {
        try {
            setActiveTest(suiteId);
            const response = await api.post(`/api/test-suites/${suiteId}/run`);
            setTestResults(prev => ({
                ...prev,
                [suiteId]: response.data
            }));
        } catch (error) {
            console.error('Test suite execution failed:', error);
        } finally {
            setActiveTest(null);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Automated Tests</Typography>
                <Button
                    variant="contained"
                    onClick={() => runTestSuite('all')}
                    disabled={Boolean(activeTest)}
                >
                    Run All Tests
                </Button>
            </Box>

            {testSuites.map(suite => (
                <Card key={suite.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1">
                                {suite.name}
                            </Typography>
                            <Box>
                                {testResults[suite.id]?.status === 'passed' && (
                                    <Tooltip title="All Tests Passed">
                                        <CheckCircle color="success" />
                                    </Tooltip>
                                )}
                                {testResults[suite.id]?.status === 'failed' && (
                                    <Tooltip title="Tests Failed">
                                        <Warning color="error" />
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>

                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            {suite.description}
                        </Typography>

                        {activeTest === suite.id ? (
                            <LinearProgress sx={{ mt: 2 }} />
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    size="small"
                                    onClick={() => runTestSuite(suite.id)}
                                >
                                    Run Tests
                                </Button>
                                {testResults[suite.id] && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            Last Run: {new Date(testResults[suite.id].timestamp).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            Tests: {testResults[suite.id].passed} passed, {testResults[suite.id].failed} failed
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ))}
        </Paper>
    );
}

export { WorkflowAnalytics, AutomatedTesting }; 