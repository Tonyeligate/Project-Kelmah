import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    LinearProgress,
    Button,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert
} from '@mui/material';
import {
    Assessment,
    BugReport,
    CheckCircle,
    Warning,
    Refresh,
    Timeline,
    Code,
    FileDownload
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer
} from 'recharts';

function CoverageReporting({ templateId }) {
    const [coverage, setCoverage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        loadCoverageData();
    }, [templateId]);

    const loadCoverageData = async () => {
        try {
            setLoading(true);
            const [coverageRes, trendRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/coverage`),
                api.get(`/api/templates/${templateId}/coverage/trends`)
            ]);
            setCoverage(coverageRes.data);
            setTrendData(trendRes.data);
        } catch (error) {
            console.error('Failed to load coverage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        try {
            const response = await api.post(
                `/api/templates/${templateId}/coverage/report`,
                { responseType: 'blob' }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'coverage-report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to generate report:', error);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Test Coverage Report</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Refresh />}
                        onClick={loadCoverageData}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<FileDownload />}
                        onClick={handleGenerateReport}
                    >
                        Export Report
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Overall Coverage Stats */}
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="textSecondary" gutterBottom>
                            Overall Coverage
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress
                                variant="determinate"
                                value={coverage.overall}
                                size={80}
                                color={coverage.overall >= 80 ? 'success' : 'warning'}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography variant="h6">
                                    {coverage.overall}%
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Coverage Trend Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Coverage Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="coverage" 
                                    stroke="#8884d8" 
                                    name="Coverage %"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* File Coverage Table */}
                <Grid item xs={12}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>File</TableCell>
                                <TableCell align="right">Lines</TableCell>
                                <TableCell align="right">Coverage</TableCell>
                                <TableCell align="right">Uncovered Lines</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {coverage.files.map(file => (
                                <TableRow 
                                    key={file.path}
                                    onClick={() => setSelectedFile(file)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{file.path}</TableCell>
                                    <TableCell align="right">{file.lines}</TableCell>
                                    <TableCell align="right">
                                        <LinearProgress
                                            variant="determinate"
                                            value={file.coverage}
                                            sx={{ width: 100, display: 'inline-block' }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 1, display: 'inline' }}
                                        >
                                            {file.coverage}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {file.uncoveredLines.join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={file.coverage >= 80 ? 'Good' : 'Needs Improvement'}
                                            color={file.coverage >= 80 ? 'success' : 'warning'}
                                        />
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

// Automated Deployment Pipeline
function DeploymentPipeline({ templateId }) {
    const [pipelines, setPipelines] = useState([]);
    const [activeDeployment, setActiveDeployment] = useState(null);
    const [environments, setEnvironments] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        loadPipelineData();
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/deployments/${templateId}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        return () => ws.close();
    }, [templateId]);

    const loadPipelineData = async () => {
        try {
            const [pipelinesRes, environmentsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/pipelines`),
                api.get(`/api/templates/${templateId}/environments`)
            ]);
            setPipelines(pipelinesRes.data);
            setEnvironments(environmentsRes.data);
        } catch (error) {
            console.error('Failed to load pipeline data:', error);
        }
    };

    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'deployment_status':
                updateDeploymentStatus(message.data);
                break;
            case 'deployment_log':
                setLogs(prev => [...prev, message.log]);
                break;
        }
    };

    const triggerDeployment = async (environmentId) => {
        try {
            const response = await api.post(`/api/templates/${templateId}/deploy`, {
                environmentId
            });
            setActiveDeployment(response.data);
        } catch (error) {
            console.error('Failed to trigger deployment:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Deployment Pipeline</Typography>
                <Button
                    startIcon={<Refresh />}
                    onClick={loadPipelineData}
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Pipeline Stages */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {environments.map(env => (
                            <Paper
                                key={env.id}
                                sx={{ p: 2, flex: 1, textAlign: 'center' }}
                            >
                                <Typography variant="subtitle1" gutterBottom>
                                    {env.name}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        label={env.status}
                                        color={getStatusColor(env.status)}
                                    />
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={() => triggerDeployment(env.id)}
                                    disabled={activeDeployment !== null}
                                >
                                    Deploy
                                </Button>
                            </Paper>
                        ))}
                    </Box>
                </Grid>

                {/* Deployment Logs */}
                {activeDeployment && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Deployment Logs
                            </Typography>
                            <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                {logs.map((log, index) => (
                                    <Typography key={index} variant="body2">
                                        {log}
                                    </Typography>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
}

export { CoverageReporting, DeploymentPipeline }; 