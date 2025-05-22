import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Alert,
    CircularProgress,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material';
import {
    Timeline,
    Refresh,
    Warning,
    CheckCircle,
    Error,
    History,
    Undo,
    Speed,
    Memory,
    Storage,
    CloudQueue
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer
} from 'recharts';

function DeploymentMonitoring({ templateId }) {
    const [metrics, setMetrics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [selectedDeployment, setSelectedDeployment] = useState(null);
    const [timeRange, setTimeRange] = useState('1h');
    const wsRef = useRef(null);

    useEffect(() => {
        initializeMonitoring();
        return () => wsRef.current?.close();
    }, [templateId, timeRange]);

    const initializeMonitoring = async () => {
        try {
            // Initialize WebSocket connection for real-time updates
            const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/monitoring/${templateId}`);
            ws.onmessage = handleWebSocketMessage;
            wsRef.current = ws;

            // Load initial data
            await Promise.all([
                loadMetrics(),
                loadAlerts(),
                loadDeployments()
            ]);
        } catch (error) {
            console.error('Failed to initialize monitoring:', error);
        }
    };

    const handleWebSocketMessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'metric_update':
                updateMetrics(data.metrics);
                break;
            case 'new_alert':
                setAlerts(prev => [data.alert, ...prev]);
                break;
            case 'deployment_status':
                updateDeploymentStatus(data.deployment);
                break;
        }
    };

    const loadMetrics = async () => {
        try {
            const response = await api.get(`/api/monitoring/${templateId}/metrics`, {
                params: { timeRange }
            });
            setMetrics(response.data);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Deployment Monitoring</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            startIcon={<Refresh />}
                            onClick={loadMetrics}
                        >
                            Refresh
                        </Button>
                        <Button
                            startIcon={<Timeline />}
                            onClick={() => setTimeRange('1d')}
                        >
                            View Timeline
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Health Status */}
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>
                                System Health
                            </Typography>
                            {metrics?.health ? (
                                <Chip
                                    icon={<CheckCircle />}
                                    label="Healthy"
                                    color="success"
                                />
                            ) : (
                                <Chip
                                    icon={<Warning />}
                                    label="Issues Detected"
                                    color="error"
                                />
                            )}
                        </Paper>
                    </Grid>

                    {/* Resource Metrics */}
                    <Grid item xs={12} md={9}>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        CPU Usage
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={metrics?.cpu || 0}
                                            size={40}
                                        />
                                        <Typography sx={{ ml: 1 }}>
                                            {metrics?.cpu}%
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={4}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Memory Usage
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={metrics?.memory || 0}
                                            size={40}
                                        />
                                        <Typography sx={{ ml: 1 }}>
                                            {metrics?.memory}%
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={4}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Storage Usage
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={metrics?.storage || 0}
                                            size={40}
                                        />
                                        <Typography sx={{ ml: 1 }}>
                                            {metrics?.storage}%
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Metrics Charts */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Performance Metrics
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={metrics?.timeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" />
                                    <YAxis />
                                    <ChartTooltip />
                                    <Line 
                                        type="monotone" 
                                        dataKey="responseTime" 
                                        stroke="#8884d8" 
                                        name="Response Time"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="requestRate" 
                                        stroke="#82ca9d" 
                                        name="Request Rate"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Active Alerts */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Active Alerts
                            </Typography>
                            <List>
                                {alerts.map(alert => (
                                    <ListItem
                                        key={alert.id}
                                        sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Warning color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={alert.message}
                                            secondary={new Date(alert.timestamp).toLocaleString()}
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                size="small"
                                                onClick={() => handleAlertAction(alert)}
                                            >
                                                Take Action
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            {/* Deployment History */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Deployment History
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Version</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Metrics</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {deployments.map(deployment => (
                            <TableRow key={deployment.id}>
                                <TableCell>{deployment.version}</TableCell>
                                <TableCell>
                                    {new Date(deployment.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={deployment.status}
                                        color={getStatusColor(deployment.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => setSelectedDeployment(deployment)}
                                    >
                                        <Speed />
                                    </IconButton>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        startIcon={<Undo />}
                                        onClick={() => handleRollback(deployment)}
                                        disabled={!canRollback(deployment)}
                                    >
                                        Rollback
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Deployment Details Dialog */}
            <Dialog
                open={Boolean(selectedDeployment)}
                onClose={() => setSelectedDeployment(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Deployment Details - {selectedDeployment?.version}
                </DialogTitle>
                <DialogContent>
                    {/* Deployment metrics and details */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedDeployment(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export { DeploymentMonitoring }; 