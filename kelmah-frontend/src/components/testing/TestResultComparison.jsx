import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    CompareArrows,
    TrendingUp,
    TrendingDown,
    Remove,
    CheckCircle,
    Error,
    Warning,
    Info,
    Download
} from '@mui/icons-material';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    BarChart,
    Bar
} from 'recharts';
import { useSnackbar } from 'notistack';
import ReactDiffViewer from 'react-diff-viewer';

function TestResultComparison() {
    const [baselineRun, setBaselineRun] = useState(null);
    const [comparisonRun, setComparisonRun] = useState(null);
    const [testRuns, setTestRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [comparison, setComparison] = useState(null);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadTestRuns();
    }, []);

    const loadTestRuns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/test-runs');
            setTestRuns(response.data);
        } catch (error) {
            setError('Error loading test runs');
            enqueueSnackbar('Error loading test runs', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!baselineRun || !comparisonRun) {
            enqueueSnackbar('Please select both test runs to compare', { variant: 'warning' });
            return;
        }

        try {
            setComparing(true);
            const response = await api.post('/api/test-runs/compare', {
                baseline_id: baselineRun,
                comparison_id: comparisonRun
            });
            setComparison(response.data);
        } catch (error) {
            enqueueSnackbar('Error comparing test runs', { variant: 'error' });
        } finally {
            setComparing(false);
        }
    };

    const renderTrendIcon = (trend) => {
        if (trend > 0) return <TrendingUp color="success" />;
        if (trend < 0) return <TrendingDown color="error" />;
        return <Remove />;
    };

    const renderDiff = (baseline, comparison) => {
        if (typeof baseline === 'object' || typeof comparison === 'object') {
            return (
                <ReactDiffViewer
                    oldValue={JSON.stringify(baseline, null, 2)}
                    newValue={JSON.stringify(comparison, null, 2)}
                    splitView={true}
                    hideLineNumbers={true}
                />
            );
        }
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>{baseline}</Typography>
                <CompareArrows />
                <Typography>{comparison}</Typography>
            </Box>
        );
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
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Compare Test Runs
                </Typography>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                            <InputLabel>Baseline Run</InputLabel>
                            <Select
                                value={baselineRun}
                                onChange={(e) => setBaselineRun(e.target.value)}
                                label="Baseline Run"
                            >
                                {testRuns.map(run => (
                                    <MenuItem key={run.id} value={run.id}>
                                        {run.name} ({new Date(run.executed_at).toLocaleDateString()})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                        <CompareArrows sx={{ fontSize: 40, color: 'text.secondary' }} />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                            <InputLabel>Comparison Run</InputLabel>
                            <Select
                                value={comparisonRun}
                                onChange={(e) => setComparisonRun(e.target.value)}
                                label="Comparison Run"
                            >
                                {testRuns.map(run => (
                                    <MenuItem key={run.id} value={run.id}>
                                        {run.name} ({new Date(run.executed_at).toLocaleDateString()})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={handleCompare}
                            disabled={comparing || !baselineRun || !comparisonRun}
                            startIcon={<CompareArrows />}
                        >
                            Compare Runs
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {comparison && (
                <Box>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Success Rate Change
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {renderTrendIcon(comparison.success_rate_change)}
                                    <Typography variant="h6">
                                        {comparison.success_rate_change > 0 ? '+' : ''}
                                        {comparison.success_rate_change.toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Execution Time Change
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {renderTrendIcon(-comparison.execution_time_change)}
                                    <Typography variant="h6">
                                        {comparison.execution_time_change > 0 ? '+' : ''}
                                        {comparison.execution_time_change.toFixed(1)}ms
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        {/* Add more summary cards */}
                    </Grid>

                    {/* Detailed Comparison */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Test Case Comparison
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Test Case</TableCell>
                                        <TableCell align="center">Baseline Result</TableCell>
                                        <TableCell align="center">Comparison Result</TableCell>
                                        <TableCell align="right">Change</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {comparison.test_cases.map(testCase => (
                                        <TableRow key={testCase.id}>
                                            <TableCell>{testCase.name}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    label={testCase.baseline_status}
                                                    color={testCase.baseline_status === 'passed' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    label={testCase.comparison_status}
                                                    color={testCase.comparison_status === 'passed' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {testCase.status_changed ? (
                                                    <Tooltip title="Status Changed">
                                                        <Warning color="warning" />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="No Change">
                                                        <CheckCircle color="success" />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Performance Comparison Chart */}
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance Comparison
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparison.performance_comparison}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="baseline" name="Baseline" fill="#8884d8" />
                                <Bar dataKey="comparison" name="Comparison" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}

export default TestResultComparison; 