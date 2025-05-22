import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Button,
    Chip,
    Badge,
    Collapse,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Warning,
    Error,
    CheckCircle,
    Notifications,
    ExpandMore,
    ExpandLess,
    Settings,
    Refresh,
    Timeline
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';

function AlertsDashboard() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAlerts();
        const interval = setInterval(loadAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/monitoring/alerts');
            setAlerts(response.data);
        } catch (error) {
            setError('Error loading alerts');
            enqueueSnackbar('Error loading alerts', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await api.post(`/api/monitoring/alerts/${alertId}/resolve`);
            loadAlerts();
            enqueueSnackbar('Alert resolved successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error resolving alert', { variant: 'error' });
        }
    };

    const handleViewDetails = (alert) => {
        setSelectedAlert(alert);
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <Error color="error" />;
            case 'high':
                return <Warning color="warning" />;
            default:
                return <Warning color="info" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical':
                return 'error';
            case 'high':
                return 'warning';
            default:
                return 'info';
        }
    };

    if (loading && alerts.length === 0) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge
                            badgeContent={alerts.filter(a => !a.resolved_at).length}
                            color="error"
                        >
                            <Notifications />
                        </Badge>
                        Performance Alerts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Refresh">
                            <IconButton onClick={loadAlerts} size="small">
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Alert Settings">
                            <IconButton onClick={() => setSettingsOpen(true)} size="small">
                                <Settings />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <List>
                    {alerts.map((alert, index) => (
                        <React.Fragment key={alert.id}>
                            {index > 0 && <Divider />}
                            <ListItem
                                sx={{
                                    bgcolor: alert.resolved_at ? 'action.hover' : 'inherit',
                                    opacity: alert.resolved_at ? 0.7 : 1
                                }}
                            >
                                <ListItemIcon>
                                    {getSeverityIcon(alert.severity)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {alert.message}
                                            </Typography>
                                            <Chip
                                                label={alert.severity}
                                                size="small"
                                                color={getSeverityColor(alert.severity)}
                                            />
                                            {alert.resolved_at && (
                                                <Chip
                                                    label="Resolved"
                                                    size="small"
                                                    color="success"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                                            </Typography>
                                            <Button
                                                size="small"
                                                endIcon={expandedItems[alert.id] ? <ExpandLess /> : <ExpandMore />}
                                                onClick={() => handleToggleExpand(alert.id)}
                                            >
                                                View Details
                                            </Button>
                                            <Collapse in={expandedItems[alert.id]}>
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Alert Details:
                                                    </Typography>
                                                    <Box sx={{ pl: 2 }}>
                                                        {Object.entries(alert.details).map(([key, value]) => (
                                                            <Typography key={key} variant="body2">
                                                                {key.replace(/_/g, ' ')}: {
                                                                    typeof value === 'number' 
                                                                        ? value.toFixed(2) 
                                                                        : value
                                                                }
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                    {!alert.resolved_at && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => handleResolveAlert(alert.id)}
                                                            >
                                                                Resolve Alert
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => handleViewDetails(alert)}
                                                            >
                                                                View Timeline
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={Boolean(selectedAlert)}
                onClose={() => setSelectedAlert(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Alert Timeline</DialogTitle>
                <DialogContent>
                    {selectedAlert && (
                        <Box sx={{ height: 400 }}>
                            <Timeline data={selectedAlert.timeline} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedAlert(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AlertsDashboard; 