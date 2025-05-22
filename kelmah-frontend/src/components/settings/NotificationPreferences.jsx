import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    FormControl,
    FormControlLabel,
    FormGroup,
    Switch,
    TextField,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Chip,
    Select,
    MenuItem,
    InputLabel,
    Card,
    CardContent,
    CardHeader,
    Tooltip,
    IconButton,
    Snackbar
} from '@mui/material';
import {
    Notifications,
    Email,
    Phone,
    Link,
    Save,
    Help
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/constants';

function NotificationPreferences() {
    const { token } = useAuth();
    const [preferences, setPreferences] = useState({
        email: {
            enabled: false,
            address: '',
            frequency: 'immediate'
        },
        sms: {
            enabled: false,
            number: '',
            frequency: 'immediate'
        },
        integrations: {
            enabled: false,
            webhook: '',
            channel: '',
            frequency: 'immediate'
        },
        alertTypes: {
            performance: true,
            error_rate: true,
            resource_usage: true,
            workflow_health: true
        },
        severityLevels: {
            critical: true,
            high: true,
            medium: true,
            low: false
        },
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '06:00'
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            console.log('Fetching notification preferences...');
            
            const token = localStorage.getItem('token');
            console.log('Current token:', token ? 'exists' : 'missing');
            
            const response = await api.get('/api/settings/notifications');
            console.log('Response:', response);
            
            if (response.data) {
                setPreferences(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (error) {
            console.error('Failed to load preferences:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            if (error.response?.status === 401) {
                console.log('Unauthorized, redirecting to login...');
                navigate('/login');
                return;
            }
            
            setError('Failed to load notification preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/api/settings/notifications', preferences);
            enqueueSnackbar('Preferences saved successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error saving preferences', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, field, value) => {
        setPreferences(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) {
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
                        <Notifications />
                        Notification Preferences
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        Save Changes
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Notification Channels */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Notification Channels
                        </Typography>
                        <Grid container spacing={3}>
                            {/* Email */}
                            <Grid item xs={12} md={4}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.email.enabled}
                                                onChange={(e) => handleChange('email', 'enabled', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Email />
                                                Email Notifications
                                            </Box>
                                        }
                                    />
                                    {preferences.email.enabled && (
                                        <Box sx={{ mt: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Email Address"
                                                value={preferences.email.address}
                                                onChange={(e) => handleChange('email', 'address', e.target.value)}
                                                size="small"
                                            />
                                            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                                                <InputLabel>Frequency</InputLabel>
                                                <Select
                                                    value={preferences.email.frequency}
                                                    onChange={(e) => handleChange('email', 'frequency', e.target.value)}
                                                    label="Frequency"
                                                >
                                                    <MenuItem value="immediate">Immediate</MenuItem>
                                                    <MenuItem value="hourly">Hourly Digest</MenuItem>
                                                    <MenuItem value="daily">Daily Digest</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    )}
                                </FormGroup>
                            </Grid>

                            {/* SMS */}
                            <Grid item xs={12} md={4}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.sms.enabled}
                                                onChange={(e) => handleChange('sms', 'enabled', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Phone />
                                                SMS Notifications
                                            </Box>
                                        }
                                    />
                                    {preferences.sms.enabled && (
                                        <Box sx={{ mt: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                value={preferences.sms.number}
                                                onChange={(e) => handleChange('sms', 'number', e.target.value)}
                                                size="small"
                                            />
                                            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                                                <InputLabel>Frequency</InputLabel>
                                                <Select
                                                    value={preferences.sms.frequency}
                                                    onChange={(e) => handleChange('sms', 'frequency', e.target.value)}
                                                    label="Frequency"
                                                >
                                                    <MenuItem value="immediate">Immediate</MenuItem>
                                                    <MenuItem value="hourly">Hourly Digest</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    )}
                                </FormGroup>
                            </Grid>

                            {/* Slack */}
                            <Grid item xs={12} md={4}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.integrations.enabled}
                                                onChange={(e) => handleChange('integrations', 'enabled', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Link />
                                                Slack Notifications
                                            </Box>
                                        }
                                    />
                                    {preferences.integrations.enabled && (
                                        <Box sx={{ mt: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Webhook URL"
                                                value={preferences.integrations.webhook}
                                                onChange={(e) => handleChange('integrations', 'webhook', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                fullWidth
                                                label="Channel"
                                                value={preferences.integrations.channel}
                                                onChange={(e) => handleChange('integrations', 'channel', e.target.value)}
                                                size="small"
                                                sx={{ mt: 2 }}
                                            />
                                        </Box>
                                    )}
                                </FormGroup>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Alert Types */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Alert Types
                        </Typography>
                        <FormGroup>
                            {Object.entries(preferences.alertTypes).map(([type, enabled]) => (
                                <FormControlLabel
                                    key={type}
                                    control={
                                        <Switch
                                            checked={enabled}
                                            onChange={(e) => handleChange('alertTypes', type, e.target.checked)}
                                        />
                                    }
                                    label={type.replace(/_/g, ' ').toUpperCase()}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    {/* Severity Levels */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Severity Levels
                        </Typography>
                        <FormGroup>
                            {Object.entries(preferences.severityLevels).map(([level, enabled]) => (
                                <FormControlLabel
                                    key={level}
                                    control={
                                        <Switch
                                            checked={enabled}
                                            onChange={(e) => handleChange('severityLevels', level, e.target.checked)}
                                        />
                                    }
                                    label={level.toUpperCase()}
                                />
                            ))}
                        </FormGroup>
                    </Grid>

                    {/* Quiet Hours */}
                    <Grid item xs={12}>
                        <Divider />
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Quiet Hours
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={preferences.quietHours.enabled}
                                            onChange={(e) => handleChange('quietHours', 'enabled', e.target.checked)}
                                        />
                                    }
                                    label="Enable Quiet Hours"
                                />
                                {preferences.quietHours.enabled && (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label="Start Time"
                                                type="time"
                                                value={preferences.quietHours.start}
                                                onChange={(e) => handleChange('quietHours', 'start', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label="End Time"
                                                type="time"
                                                value={preferences.quietHours.end}
                                                onChange={(e) => handleChange('quietHours', 'end', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </FormGroup>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default NotificationPreferences; 