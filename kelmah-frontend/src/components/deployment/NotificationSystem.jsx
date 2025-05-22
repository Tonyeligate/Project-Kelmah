import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Switch,
    FormGroup,
    FormControlLabel,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import {
    Notifications,
    Email,
    Slack,
    Teams,
    Add,
    Delete,
    Edit,
    Settings,
    Send,
    Preview
} from '@mui/icons-material';

function DeploymentNotifications({ templateId }) {
    const [channels, setChannels] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [channelDialog, setChannelDialog] = useState(false);
    const [testMode, setTestMode] = useState(false);

    useEffect(() => {
        loadNotificationConfig();
    }, [templateId]);

    const loadNotificationConfig = async () => {
        try {
            const [channelsRes, templatesRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/notification-channels`),
                api.get(`/api/templates/${templateId}/notification-templates`)
            ]);
            setChannels(channelsRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error('Failed to load notification config:', error);
        }
    };

    const handleTestNotification = async (channelId) => {
        try {
            await api.post(`/api/notification-channels/${channelId}/test`);
            // Show success message
        } catch (error) {
            console.error('Failed to send test notification:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Deployment Notifications</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={testMode}
                                onChange={(e) => setTestMode(e.target.checked)}
                            />
                        }
                        label="Test Mode"
                    />
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedChannel(null);
                            setChannelDialog(true);
                        }}
                    >
                        Add Channel
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Notification Channels */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Notification Channels
                    </Typography>
                    <List>
                        {channels.map(channel => (
                            <ListItem
                                key={channel.id}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 2
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getChannelIcon(channel.type)}
                                            <Typography>{channel.name}</Typography>
                                            <Chip
                                                size="small"
                                                label={channel.type}
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={channel.description}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        onClick={() => handleTestNotification(channel.id)}
                                        disabled={!testMode}
                                    >
                                        <Send />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedChannel(channel);
                                            setChannelDialog(true);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDeleteChannel(channel.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Grid>

                {/* Notification Templates */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Notification Templates
                    </Typography>
                    <List>
                        {templates.map(template => (
                            <ListItem
                                key={template.id}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 2
                                }}
                            >
                                <ListItemText
                                    primary={template.name}
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                Events: {template.events.join(', ')}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        onClick={() => handlePreviewTemplate(template)}
                                    >
                                        <Preview />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleEditTemplate(template)}
                                    >
                                        <Edit />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Grid>
            </Grid>

            {/* Channel Dialog */}
            <Dialog
                open={channelDialog}
                onClose={() => setChannelDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedChannel ? 'Edit Channel' : 'New Channel'}
                </DialogTitle>
                <DialogContent>
                    {/* Channel configuration form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setChannelDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveChannel}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Environment Configuration Management
function EnvironmentConfig({ templateId }) {
    const [environments, setEnvironments] = useState([]);
    const [selectedEnv, setSelectedEnv] = useState(null);
    const [configDialog, setConfigDialog] = useState(false);
    const [compareMode, setCompareMode] = useState(false);

    useEffect(() => {
        loadEnvironments();
    }, [templateId]);

    const loadEnvironments = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/environments`);
            setEnvironments(response.data);
        } catch (error) {
            console.error('Failed to load environments:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Environment Configuration</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Settings />}
                        onClick={() => setCompareMode(!compareMode)}
                    >
                        Compare Environments
                    </Button>
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedEnv(null);
                            setConfigDialog(true);
                        }}
                    >
                        New Environment
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {environments.map(env => (
                    <Grid item xs={12} md={6} key={env.id}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {env.name}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditConfig(env)}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteEnv(env.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </Box>

                            <List dense>
                                {Object.entries(env.config).map(([key, value]) => (
                                    <ListItem key={key}>
                                        <ListItemText
                                            primary={key}
                                            secondary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        bgcolor: 'action.hover',
                                                        p: 0.5,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    {value}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Environment Config Dialog */}
            <Dialog
                open={configDialog}
                onClose={() => setConfigDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedEnv ? 'Edit Environment' : 'New Environment'}
                </DialogTitle>
                <DialogContent>
                    {/* Environment configuration form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfigDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveEnvironment}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export { DeploymentNotifications, EnvironmentConfig }; 