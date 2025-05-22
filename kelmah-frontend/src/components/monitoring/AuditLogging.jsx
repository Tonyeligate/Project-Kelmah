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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip
} from '@mui/material';
import {
    History,
    FilterList,
    Download,
    Search,
    Visibility,
    Timeline,
    Person,
    Category,
    DateRange
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';

function AuditLogging({ templateId }) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [filters, setFilters] = useState({
        dateRange: [null, null],
        eventType: 'all',
        user: '',
        severity: 'all'
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAuditLogs();
    }, [templateId, filters]);

    const loadAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/templates/${templateId}/audit-logs`, {
                params: filters
            });
            setAuditLogs(response.data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportLogs = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/audit-logs/export`, {
                params: filters,
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export audit logs:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Audit Logs</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<FilterList />}
                        onClick={() => setShowFilters(true)}
                    >
                        Filters
                    </Button>
                    <Button
                        startIcon={<Download />}
                        onClick={exportLogs}
                    >
                        Export Logs
                    </Button>
                </Box>
            </Box>

            {/* Filters Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <DateRangePicker
                        value={filters.dateRange}
                        onChange={(newValue) => setFilters({ ...filters, dateRange: newValue })}
                        renderInput={(startProps, endProps) => (
                            <>
                                <TextField {...startProps} />
                                <Box sx={{ mx: 2 }}> to </Box>
                                <TextField {...endProps} />
                            </>
                        )}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Event Type</InputLabel>
                        <Select
                            value={filters.eventType}
                            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                            label="Event Type"
                        >
                            <MenuItem value="all">All Events</MenuItem>
                            <MenuItem value="security">Security</MenuItem>
                            <MenuItem value="configuration">Configuration</MenuItem>
                            <MenuItem value="deployment">Deployment</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {/* Add more filters */}
            </Grid>

            {/* Audit Logs Table */}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Event Type</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {auditLogs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>
                                {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={log.eventType}
                                    color={getEventTypeColor(log.eventType)}
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person fontSize="small" />
                                    {log.user}
                                </Box>
                            </TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>
                                <Typography noWrap sx={{ maxWidth: 300 }}>
                                    {log.details}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={log.severity}
                                    color={getSeverityColor(log.severity)}
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton
                                    size="small"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <Visibility />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Log Details Dialog */}
            <Dialog
                open={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Audit Log Details
                </DialogTitle>
                <DialogContent>
                    {/* Detailed log information */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedLog(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Resource Monitoring
function ResourceMonitoring({ templateId }) {
    const [resources, setResources] = useState(null);
    const [timeRange, setTimeRange] = useState('1h');
    const [alerts, setAlerts] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(30000);

    useEffect(() => {
        loadResourceMetrics();
        const interval = setInterval(loadResourceMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [templateId, timeRange, refreshInterval]);

    const loadResourceMetrics = async () => {
        try {
            const [resourcesRes, alertsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/resources`, {
                    params: { timeRange }
                }),
                api.get(`/api/templates/${templateId}/resource-alerts`)
            ]);
            setResources(resourcesRes.data);
            setAlerts(alertsRes.data);
        } catch (error) {
            console.error('Failed to load resource metrics:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Resource Monitoring</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        label="Time Range"
                    >
                        <MenuItem value="1h">Last Hour</MenuItem>
                        <MenuItem value="24h">Last 24 Hours</MenuItem>
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Resource Metrics Grid */}
            <Grid container spacing={3}>
                {/* CPU Usage */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            CPU Usage
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={resources?.cpu?.timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#8884d8"
                                    name="CPU Usage (%)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Memory Usage */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Memory Usage
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={resources?.memory?.timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#82ca9d"
                                    name="Memory Usage (MB)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Disk Usage */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Disk Usage
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={resources?.disk?.timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#ffc658"
                                    name="Disk Usage (GB)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Network Usage */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Network Usage
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={resources?.network?.timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="incoming"
                                    stroke="#8884d8"
                                    name="Incoming (MB/s)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="outgoing"
                                    stroke="#82ca9d"
                                    name="Outgoing (MB/s)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Resource Alerts */}
            {alerts.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Resource Alerts
                    </Typography>
                    <List>
                        {alerts.map(alert => (
                            <Alert
                                key={alert.id}
                                severity={alert.severity}
                                sx={{ mb: 1 }}
                                action={
                                    <Button
                                        size="small"
                                        onClick={() => handleAlertAction(alert)}
                                    >
                                        Take Action
                                    </Button>
                                }
                            >
                                {alert.message}
                            </Alert>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
}

export { AuditLogging, ResourceMonitoring }; 