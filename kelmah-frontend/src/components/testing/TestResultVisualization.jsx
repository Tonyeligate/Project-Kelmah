import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    Collapse
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot
} from '@mui/lab';
import {
    CheckCircle,
    Error,
    Warning,
    ExpandMore,
    ExpandLess,
    AccessTime,
    Memory,
    Speed,
    BugReport
} from '@mui/icons-material';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useSnackbar } from 'notistack';

const COLORS = {
    passed: '#4caf50',
    failed: '#f44336',
    skipped: '#ff9800',
    error: '#d32f2f'
};

function TestResultVisualization({ results, coverage }) {
    const [expandedTests, setExpandedTests] = useState({});
    const [selectedTest, setSelectedTest] = useState(null);
    const [timelineView, setTimelineView] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const summary = React.useMemo(() => ({
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        error: results.filter(r => r.status === 'error').length,
        avgExecutionTime: results.reduce((acc, r) => acc + r.execution_time, 0) / results.length,
        totalDuration: results.reduce((acc, r) => acc + r.execution_time, 0)
    }), [results]);

    const pieData = [
        { name: 'Passed', value: summary.passed, color: COLORS.passed },
        { name: 'Failed', value: summary.failed, color: COLORS.failed },
        { name: 'Skipped', value: summary.skipped, color: COLORS.skipped },
        { name: 'Error', value: summary.error, color: COLORS.error }
    ];

    const handleToggleExpand = (testId) => {
        setExpandedTests(prev => ({
            ...prev,
            [testId]: !prev[testId]
        }));
    };

    const renderStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <CheckCircle sx={{ color: COLORS.passed }} />;
            case 'failed':
                return <Error sx={{ color: COLORS.failed }} />;
            case 'skipped':
                return <Warning sx={{ color: COLORS.skipped }} />;
            default:
                return <BugReport sx={{ color: COLORS.error }} />;
        }
    };

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Total Tests
                            </Typography>
                            <Typography variant="h3">
                                {summary.total}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label={`${((summary.passed / summary.total) * 100).toFixed(1)}% Success Rate`}
                                    color="success"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Average Time
                            </Typography>
                            <Typography variant="h3">
                                {summary.avgExecutionTime.toFixed(2)}ms
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label="Execution Time"
                                    icon={<Speed />}
                                    color="primary"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Coverage
                            </Typography>
                            <Typography variant="h3">
                                {coverage.percentage}%
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label={`${coverage.covered}/${coverage.total} Paths`}
                                    color="info"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Memory Usage
                            </Typography>
                            <Typography variant="h3">
                                {(coverage.memory_usage / 1024 / 1024).toFixed(2)}MB
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label="Peak Memory"
                                    icon={<Memory />}
                                    color="warning"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Test Results Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Execution Time Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={results}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="execution_time" fill="#8884d8" name="Execution Time (ms)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Test Details */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        Test Details
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => setTimelineView(!timelineView)}
                        startIcon={timelineView ? <List /> : <Timeline />}
                    >
                        {timelineView ? 'List View' : 'Timeline View'}
                    </Button>
                </Box>

                {timelineView ? (
                    <Timeline>
                        {results.map((test, index) => (
                            <TimelineItem key={test.id}>
                                <TimelineSeparator>
                                    <TimelineDot sx={{ bgcolor: COLORS[test.status] }}>
                                        {renderStatusIcon(test.status)}
                                    </TimelineDot>
                                    {index < results.length - 1 && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">
                                            {test.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {formatDistanceToNow(new Date(test.executed_at), { addSuffix: true })}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={`${test.execution_time}ms`}
                                            icon={<AccessTime />}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                ) : (
                    <List>
                        {results.map(test => (
                            <React.Fragment key={test.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {renderStatusIcon(test.status)}
                                                <Typography>
                                                    {test.name}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Executed: {formatDistanceToNow(new Date(test.executed_at), { addSuffix: true })}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${test.execution_time}ms`}
                                                    icon={<AccessTime />}
                                                    sx={{ mt: 1, mr: 1 }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={test.status}
                                                    color={test.status === 'passed' ? 'success' : 'error'}
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        }
                                    />
                                    <IconButton onClick={() => handleToggleExpand(test.id)}>
                                        {expandedTests[test.id] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                </ListItem>
                                <Collapse in={expandedTests[test.id]}>
                                    <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                                        {test.error && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                {test.error}
                                            </Alert>
                                        )}
                                        <Typography variant="subtitle2" gutterBottom>
                                            Test Details:
                                        </Typography>
                                        <pre style={{ 
                                            backgroundColor: '#f5f5f5',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            overflow: 'auto'
                                        }}>
                                            {JSON.stringify(test.details, null, 2)}
                                        </pre>
                                    </Box>
                                </Collapse>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
}

export default TestResultVisualization; 