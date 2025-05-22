import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert
} from '@mui/material';
import {
    Assessment,
    Download,
    Share,
    Schedule,
    BugReport,
    Speed,
    Timeline,
    TrendingUp,
    Email,
    Print,
    PictureAsPdf
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
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function TestReportGenerator({ templateId }) {
    const [reports, setReports] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportFormat, setReportFormat] = useState('pdf');
    const [dateRange, setDateRange] = useState('7d');

    useEffect(() => {
        loadReports();
    }, [templateId]);

    const loadReports = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/test-reports`);
            setReports(response.data);
        } catch (error) {
            console.error('Failed to load test reports:', error);
        }
    };

    const generateReport = async () => {
        try {
            setGenerating(true);
            const response = await api.post(`/api/templates/${templateId}/generate-report`, {
                format: reportFormat,
                dateRange
            });
            
            // Handle report download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `test-report-${Date.now()}.${reportFormat}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            await loadReports();
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Test Reports</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Format</InputLabel>
                        <Select
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                            label="Format"
                        >
                            <MenuItem value="pdf">PDF</MenuItem>
                            <MenuItem value="html">HTML</MenuItem>
                            <MenuItem value="json">JSON</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Date Range</InputLabel>
                        <Select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            label="Date Range"
                        >
                            <MenuItem value="7d">Last 7 Days</MenuItem>
                            <MenuItem value="30d">Last 30 Days</MenuItem>
                            <MenuItem value="90d">Last 90 Days</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<Assessment />}
                        onClick={generateReport}
                        disabled={generating}
                    >
                        {generating ? 'Generating...' : 'Generate Report'}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Report Statistics */}
                <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Test Coverage Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reports}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="coverage" stroke="#8884d8" />
                                <Line type="monotone" dataKey="passRate" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>

                {/* Recent Reports */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Recent Reports
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Coverage</TableCell>
                                <TableCell>Pass Rate</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        {new Date(report.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={report.type}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={report.coverage}
                                                sx={{ width: 100 }}
                                            />
                                            <Typography variant="body2">
                                                {report.coverage}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={`${report.passRate}%`}
                                            color={report.passRate >= 90 ? 'success' : 'warning'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDownload(report)}
                                        >
                                            <Download />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleShare(report)}
                                        >
                                            <Share />
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

// Performance Optimization Suggestions
function PerformanceOptimizer({ templateId }) {
    const [suggestions, setSuggestions] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        loadOptimizationData();
    }, [templateId]);

    const loadOptimizationData = async () => {
        try {
            const [suggestionsRes, metricsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/optimization-suggestions`),
                api.get(`/api/templates/${templateId}/performance-metrics`)
            ]);
            setSuggestions(suggestionsRes.data);
            setMetrics(metricsRes.data);
        } catch (error) {
            console.error('Failed to load optimization data:', error);
        }
    };

    const startAnalysis = async () => {
        try {
            setAnalyzing(true);
            await api.post(`/api/templates/${templateId}/analyze-performance`);
            await loadOptimizationData();
        } catch (error) {
            console.error('Failed to start analysis:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Performance Optimization</Typography>
                <Button
                    startIcon={<Speed />}
                    onClick={startAnalysis}
                    disabled={analyzing}
                >
                    {analyzing ? 'Analyzing...' : 'Analyze Performance'}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Performance Metrics */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Response Time
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress
                                variant="determinate"
                                value={metrics?.responseScore || 0}
                                size={60}
                                color={getScoreColor(metrics?.responseScore)}
                            />
                            <Typography>
                                {metrics?.avgResponseTime}ms
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Add more metric cards */}

                {/* Optimization Suggestions */}
                <Grid item xs={12}>
                    <List>
                        {suggestions.map(suggestion => (
                            <Paper
                                key={suggestion.id}
                                sx={{ p: 2, mb: 2 }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle1">
                                        {suggestion.title}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={suggestion.priority}
                                        color={getPriorityColor(suggestion.priority)}
                                    />
                                </Box>
                                <Typography color="textSecondary" paragraph>
                                    {suggestion.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Speed />}
                                        onClick={() => handleApplyOptimization(suggestion)}
                                    >
                                        Apply Optimization
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Timeline />}
                                        onClick={() => handleViewImpact(suggestion)}
                                    >
                                        View Impact
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </List>
                </Grid>
            </Grid>
        </Paper>
    );
}

export { TestReportGenerator, PerformanceOptimizer }; 