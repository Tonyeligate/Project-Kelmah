import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function SystemSettings() {
    const { token } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                'http://localhost:3000/api/admin/settings',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSettings(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.put(
                'http://localhost:3000/api/admin/settings',
                settings,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5">System Settings</Typography>
                    <Box>
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={fetchSettings}
                            sx={{ mr: 1 }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Settings saved successfully
                    </Alert>
                )}

                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ mb: 3 }}
                >
                    <Tab label="General" />
                    <Tab label="Payment" />
                    <Tab label="Security" />
                    <Tab label="Notifications" />
                    <Tab label="Uploads" />
                </Tabs>

                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Site Name"
                                value={settings.site.name}
                                onChange={(e) => handleChange('site', 'name', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Contact Email"
                                value={settings.site.contact_email}
                                onChange={(e) => handleChange('site', 'contact_email', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Site Description"
                                value={settings.site.description}
                                onChange={(e) => handleChange('site', 'description', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.site.maintenance_mode}
                                        onChange={(e) => handleChange('site', 'maintenance_mode', e.target.checked)}
                                    />
                                }
                                label="Maintenance Mode"
                            />
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Platform Fee (%)"
                                value={settings.payment.platform_fee}
                                onChange={(e) => handleChange('payment', 'platform_fee', Number(e.target.value))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Minimum Withdrawal"
                                value={settings.payment.minimum_withdrawal}
                                onChange={(e) => handleChange('payment', 'minimum_withdrawal', Number(e.target.value))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">XOF</InputAdornment>
                                }}
                            />
                        </Grid>
                    </Grid>
                )}

                {activeTab === 2 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings?.security?.two_factor_auth}
                                        onChange={(e) => handleChange('security', 'two_factor_auth', e.target.checked)}
                                    />
                                }
                                label="Enable Two-Factor Authentication"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Session Timeout (minutes)"
                                value={settings?.security?.session_timeout}
                                onChange={(e) => handleChange('security', 'session_timeout', Number(e.target.value))}
                            />
                        </Grid>
                    </Grid>
                )}

                {activeTab === 3 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings?.notifications?.email_notifications}
                                        onChange={(e) => handleChange('notifications', 'email_notifications', e.target.checked)}
                                    />
                                }
                                label="Enable Email Notifications"
                            />
                        </Grid>
                    </Grid>
                )}

                {activeTab === 4 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Maximum Upload Size (MB)"
                                value={settings?.uploads?.max_size}
                                onChange={(e) => handleChange('uploads', 'max_size', Number(e.target.value))}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Allowed File Types"
                                value={settings?.uploads?.allowed_types}
                                onChange={(e) => handleChange('uploads', 'allowed_types', e.target.value)}
                                helperText="Comma-separated list of file extensions"
                            />
                        </Grid>
                    </Grid>
                )}
            </Paper>
        </Box>
    );
}

export default SystemSettings; 