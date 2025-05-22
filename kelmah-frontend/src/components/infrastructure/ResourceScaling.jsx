import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormGroup,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Tooltip,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import {
    Timeline,
    Add,
    Remove,
    Speed,
    Memory,
    Storage,
    CloudQueue,
    Settings,
    Refresh,
    Save,
    History,
    TrendingUp,
    Warning
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

function ResourceScaling({ templateId }) {
    const [resources, setResources] = useState(null);
    const [autoScaling, setAutoScaling] = useState(false);
    const [scalingRules, setScalingRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState(null);
    const [ruleDialog, setRuleDialog] = useState(false);
    const [scalingHistory, setScalingHistory] = useState([]);

    useEffect(() => {
        loadScalingData();
    }, [templateId]);

    const loadScalingData = async () => {
        try {
            const [resourcesRes, rulesRes, historyRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/resources`),
                api.get(`/api/templates/${templateId}/scaling-rules`),
                api.get(`/api/templates/${templateId}/scaling-history`)
            ]);
            setResources(resourcesRes.data);
            setScalingRules(rulesRes.data);
            setScalingHistory(historyRes.data);
        } catch (error) {
            console.error('Failed to load scaling data:', error);
        }
    };

    const handleScaleResource = async (resourceId, action) => {
        try {
            await api.post(`/api/resources/${resourceId}/scale`, { action });
            await loadScalingData();
        } catch (error) {
            console.error('Failed to scale resource:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Resource Scaling</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoScaling}
                                onChange={(e) => setAutoScaling(e.target.checked)}
                            />
                        }
                        label="Auto Scaling"
                    />
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedRule(null);
                            setRuleDialog(true);
                        }}
                    >
                        Add Scaling Rule
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Resource Cards */}
                {resources?.map(resource => (
                    <Grid item xs={12} md={6} key={resource.id}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {resource.name}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleScaleResource(resource.id, 'down')}
                                    >
                                        <Remove />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleScaleResource(resource.id, 'up')}
                                    >
                                        <Add />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Current Scale: {resource.currentScale}
                                </Typography>
                                <Slider
                                    value={resource.currentScale}
                                    min={resource.minScale}
                                    max={resource.maxScale}
                                    marks
                                    disabled
                                />
                            </Box>

                            <Box sx={{ height: 150 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={resource.metrics}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="timestamp" />
                                        <YAxis />
                                        <ChartTooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="usage"
                                            stroke="#8884d8"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>
                ))}

                {/* Scaling Rules */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Scaling Rules
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Metric</TableCell>
                                <TableCell>Threshold</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {scalingRules.map(rule => (
                                <TableRow key={rule.id}>
                                    <TableCell>{rule.name}</TableCell>
                                    <TableCell>{rule.metric}</TableCell>
                                    <TableCell>{rule.threshold}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={rule.action}
                                            color={rule.action === 'scale_up' ? 'primary' : 'secondary'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={rule.enabled}
                                            onChange={() => handleToggleRule(rule.id)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedRule(rule);
                                                setRuleDialog(true);
                                            }}
                                        >
                                            <Settings />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Grid>

                {/* Scaling History */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Scaling History
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Resource</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Trigger</TableCell>
                                <TableCell>Result</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {scalingHistory.map(event => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        {new Date(event.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{event.resource}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={event.action}
                                            color={event.action === 'scale_up' ? 'primary' : 'secondary'}
                                        />
                                    </TableCell>
                                    <TableCell>{event.trigger}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={event.result}
                                            color={getResultColor(event.result)}
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

// Backup Management
function BackupManagement({ templateId }) {
    const [backups, setBackups] = useState([]);
    const [backupSchedule, setBackupSchedule] = useState(null);
    const [scheduleDialog, setScheduleDialog] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState(null);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        loadBackupData();
    }, [templateId]);

    const loadBackupData = async () => {
        try {
            const [backupsRes, scheduleRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/backups`),
                api.get(`/api/templates/${templateId}/backup-schedule`)
            ]);
            setBackups(backupsRes.data);
            setBackupSchedule(scheduleRes.data);
        } catch (error) {
            console.error('Failed to load backup data:', error);
        }
    };

    const createBackup = async () => {
        try {
            await api.post(`/api/templates/${templateId}/backups`);
            await loadBackupData();
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
    };

    const restoreBackup = async (backupId) => {
        try {
            setRestoring(true);
            await api.post(`/api/backups/${backupId}/restore`);
            // Handle successful restore
        } catch (error) {
            console.error('Failed to restore backup:', error);
        } finally {
            setRestoring(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Backup Management</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Settings />}
                        onClick={() => setScheduleDialog(true)}
                    >
                        Backup Schedule
                    </Button>
                    <Button
                        startIcon={<Add />}
                        onClick={createBackup}
                    >
                        Create Backup
                    </Button>
                </Box>
            </Box>

            {/* Backup Schedule */}
            {backupSchedule && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Next scheduled backup: {new Date(backupSchedule.nextBackup).toLocaleString()}
                </Alert>
            )}

            {/* Backups Table */}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {backups.map(backup => (
                        <TableRow key={backup.id}>
                            <TableCell>
                                {new Date(backup.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={backup.type}
                                    color={backup.type === 'manual' ? 'primary' : 'default'}
                                />
                            </TableCell>
                            <TableCell>{formatSize(backup.size)}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={backup.status}
                                    color={getStatusColor(backup.status)}
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    onClick={() => restoreBackup(backup.id)}
                                    disabled={restoring}
                                >
                                    Restore
                                </Button>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDownloadBackup(backup)}
                                >
                                    <CloudQueue />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDeleteBackup(backup.id)}
                                >
                                    <Delete />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Schedule Dialog */}
            <Dialog
                open={scheduleDialog}
                onClose={() => setScheduleDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Backup Schedule</DialogTitle>
                <DialogContent>
                    {/* Schedule configuration form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveSchedule}
                    >
                        Save Schedule
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export { ResourceScaling, BackupManagement }; 