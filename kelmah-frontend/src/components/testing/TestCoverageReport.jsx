import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Tooltip,
    IconButton,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    CheckCircle,
    Warning,
    Error,
    Info,
    ExpandMore,
    ExpandLess,
    Download,
    Refresh
} from '@mui/icons-material';
import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip as RechartsTooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';

function TestCoverageReport({ workflowId }) {
    const [coverage, setCoverage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadCoverageReport();
    }, [workflowId]);

    const loadCoverageReport = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/workflows/${workflowId}/coverage`);
            setCoverage(response.data);
        } catch (error) {
            setError('Error loading coverage report');
            enqueueSnackbar('Error loading coverage report', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadCoverageReport();
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/api/workflows/${workflowId}/coverage/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `coverage-report-${workflowId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            enqueueSnackbar('Error exporting coverage report', { variant: 'error' });
        }
    };

    const handleToggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getCoverageColor = (percentage) => {
        if (percentage >= 80) return 'success';
        if (percentage >= 60) return 'warning';
        return 'error';
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

    const radarData = [
        { subject: 'Rules', A: coverage.summary.rules_covered },
        { subject: 'Paths', A: coverage.summary.paths_covered },
        { subject: 'Conditions', A: coverage.summary.conditions_covered },
        { subject: 'Data', A: coverage.summary.data_covered }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Coverage Report</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<Refresh />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<Download />}
                        onClick={handleExport}
                        variant="contained"
                    >
                        Export Report
                    </Button>
                </Box>
            </Box>

            {/* Overall Coverage Summary */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Overall Coverage
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h3" sx={{ mr: 2 }}>
                                    {coverage.summary.overall_percentage.toFixed(1)}%
                                </Typography>
                                <Chip
                                    label={coverage.summary.overall_percentage >= 80 ? 'Good' : 'Needs Improvement'}
                                    color={getCoverageColor(coverage.summary.overall_percentage)}
                                />
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={coverage.summary.overall_percentage}
                                color={getCoverageColor(coverage.summary.overall_percentage)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Coverage Distribution
                            </Typography>
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar
                                        name="Coverage"
                                        dataKey="A"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                    <RechartsTooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Coverage Sections */}
            <Grid container spacing={3}>
                {/* Rules Coverage */}
                <Grid item xs={12}>
                    <Paper>
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">
                                Rules Coverage
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip
                                    label={`${coverage.rules.percentage.toFixed(1)}%`}
                                    color={getCoverageColor(coverage.rules.percentage)}
                                    sx={{ mr: 1 }}
                                />
                                <IconButton onClick={() => handleToggleSection('rules')}>
                                    {expandedSections.rules ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Box>
                        </Box>
                        <Collapse in={expandedSections.rules}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Rule</TableCell>
                                            <TableCell align="right">Executions</TableCell>
                                            <TableCell align="right">Last Executed</TableCell>
                                            <TableCell align="right">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(coverage.rules.details).map(([ruleId, data]) => (
                                            <TableRow key={ruleId}>
                                                <TableCell>{ruleId}</TableCell>
                                                <TableCell align="right">{data.execution_count}</TableCell>
                                                <TableCell align="right">
                                                    {data.last_executed
                                                        ? formatDistanceToNow(new Date(data.last_executed), { addSuffix: true })
                                                        : 'Never'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        size="small"
                                                        label={data.executed ? 'Covered' : 'Not Covered'}
                                                        color={data.executed ? 'success' : 'error'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Collapse>
                    </Paper>
                </Grid>

                {/* Similar sections for Paths, Conditions, and Data Coverage */}
                {/* ... */}

            </Grid>

            {/* Coverage Trends */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Coverage Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={coverage.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Area
                            type="monotone"
                            dataKey="overall"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.3}
                            name="Overall Coverage"
                        />
                        <Area
                            type="monotone"
                            dataKey="rules"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.3}
                            name="Rules Coverage"
                        />
                        <Area
                            type="monotone"
                            dataKey="paths"
                            stroke="#ffc658"
                            fill="#ffc658"
                            fillOpacity={0.3}
                            name="Paths Coverage"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Paper>
        </Box>
    );
}

export default TestCoverageReport; 