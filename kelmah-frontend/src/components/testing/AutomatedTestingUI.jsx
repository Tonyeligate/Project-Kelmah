import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Tooltip
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Refresh,
    Add,
    Delete,
    Edit,
    Schedule,
    BugReport,
    CheckCircle,
    Error,
    Timeline
} from '@mui/icons-material';

function AutomatedTestingUI({ templateId }) {
    const [testSuites, setTestSuites] = useState([]);
    const [activeTest, setActiveTest] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [testDialog, setTestDialog] = useState(false);
    const [selectedSuite, setSelectedSuite] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        initializeTestingUI();
        return () => wsRef.current?.close();
    }, [templateId]);

    const initializeTestingUI = async () => {
        try {
            // Initialize WebSocket for real-time test updates
            const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/testing/${templateId}`);
            ws.onmessage = handleWebSocketMessage;
            wsRef.current = ws;

            await loadTestSuites();
        } catch (error) {
            console.error('Failed to initialize testing UI:', error);
        }
    };

    const handleWebSocketMessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'test_progress':
                updateTestProgress(data.progress);
                break;
            case 'test_result':
                updateTestResults(data.results);
                break;
            case 'test_error':
                handleTestError(data.error);
                break;
        }
    };

    const runTestSuite = async (suiteId) => {
        try {
            setActiveTest(suiteId);
            await api.post(`/api/test-suites/${suiteId}/run`);
        } catch (error) {
            console.error('Failed to run test suite:', error);
            setActiveTest(null);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Automated Tests</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            startIcon={<Schedule />}
                            onClick={() => setScheduleDialog(true)}
                        >
                            Schedule Tests
                        </Button>
                        <Button
                            startIcon={<Add />}
                            onClick={() => {
                                setSelectedSuite(null);
                                setTestDialog(true);
                            }}
                        >
                            New Test Suite
                        </Button>
                    </Box>
                </Box>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Test Suite</TableCell>
                            <TableCell>Last Run</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Coverage</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {testSuites.map(suite => (
                            <TableRow key={suite.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography>{suite.name}</Typography>
                                        {suite.priority === 'high' && (
                                            <Chip
                                                size="small"
                                                label="Critical"
                                                color="error"
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {suite.lastRun ? new Date(suite.lastRun).toLocaleString() : 'Never'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={suite.status}
                                        color={getStatusColor(suite.status)}
                                        icon={getStatusIcon(suite.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={suite.coverage}
                                            sx={{ width: 100 }}
                                        />
                                        <Typography variant="body2">
                                            {suite.coverage}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {suite.duration}s
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => runTestSuite(suite.id)}
                                            disabled={activeTest === suite.id}
                                        >
                                            <PlayArrow />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedSuite(suite);
                                                setTestDialog(true);
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteSuite(suite.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Test Results */}
            {activeTest && testResults[activeTest] && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Test Results
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography color="textSecondary" gutterBottom>
                                    Pass Rate
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {testResults[activeTest].passRate}%
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Add more result metrics */}
                    </Grid>

                    {/* Test Cases Results */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Test Cases
                        </Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Test Case</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Error</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {testResults[activeTest].cases.map(testCase => (
                                    <TableRow key={testCase.id}>
                                        <TableCell>{testCase.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={testCase.status}
                                                color={testCase.status === 'passed' ? 'success' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell>{testCase.duration}ms</TableCell>
                                        <TableCell>
                                            {testCase.error && (
                                                <Tooltip title={testCase.error}>
                                                    <Error color="error" />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Paper>
            )}

            {/* Test Suite Dialog */}
            <Dialog
                open={testDialog}
                onClose={() => setTestDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedSuite ? 'Edit Test Suite' : 'New Test Suite'}
                </DialogTitle>
                <DialogContent>
                    {/* Test suite form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveTestSuite}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Performance Monitoring Component
function PerformanceMonitoring({ templateId }) {
    const [metrics, setMetrics] = useState(null);
    const [timeRange, setTimeRange] = useState('1h');
    const [alerts, setAlerts] = useState([]);
    
    useEffect(() => {
        loadPerformanceMetrics();
        const interval = setInterval(loadPerformanceMetrics, 30000);
        return () => clearInterval(interval);
    }, [templateId, timeRange]);

    const loadPerformanceMetrics = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/performance`, {
                params: { timeRange }
            });
            setMetrics(response.data);
        } catch (error) {
            console.error('Failed to load performance metrics:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Performance Monitoring</Typography>
                <FormControl size="small">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="1h">Last Hour</MenuItem>
                        <MenuItem value="24h">Last 24 Hours</MenuItem>
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Performance metrics visualization */}
                <Grid item xs={12}>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics?.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="responseTime"
                                stroke="#8884d8"
                                name="Response Time (ms)"
                            />
                            <Line
                                type="monotone"
                                dataKey="throughput"
                                stroke="#82ca9d"
                                name="Throughput (req/s)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Grid>

                {/* Performance alerts */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Performance Alerts
                    </Typography>
                    <List>
                        {alerts.map(alert => (
                            <ListItem key={alert.id}>
                                <ListItemIcon>
                                    <Warning color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={alert.message}
                                    secondary={new Date(alert.timestamp).toLocaleString()}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Grid>
            </Grid>
        </Paper>
    );
}

export { AutomatedTestingUI, PerformanceMonitoring }; 