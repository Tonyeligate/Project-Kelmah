import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    FormGroup,
    TextField,
    Button,
    Grid,
    Chip,
    Box,
    Alert
} from '@mui/material';
import api from '../../api/axios';

function ProfileMarket() {
    const [settings, setSettings] = useState({
        isVisible: false,
        hourlyRate: '',
        availability: 'full-time',
        preferredLocations: [],
        remotePreference: 'hybrid',
        skills: [],
        bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/profile/market-settings');
            setSettings(response.data);
        } catch (error) {
            setError('Failed to load profile market settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/api/profile/market-settings', settings);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setError('Failed to save settings');
        }
    };

    const handleSkillAdd = (skill) => {
        if (!settings.skills.includes(skill)) {
            setSettings(prev => ({
                ...prev,
                skills: [...prev.skills, skill]
            }));
        }
    };

    const handleSkillRemove = (skillToRemove) => {
        setSettings(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Profile Market Settings
            </Typography>

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Settings saved successfully!
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <FormGroup>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.isVisible}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                isVisible: e.target.checked
                            }))}
                        />
                    }
                    label="Make my profile visible to employers"
                />
            </FormGroup>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Hourly Rate ($)"
                        type="number"
                        value={settings.hourlyRate}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            hourlyRate: e.target.value
                        }))}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Professional Bio"
                        value={settings.bio}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            bio: e.target.value
                        }))}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Skills
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        {settings.skills.map((skill) => (
                            <Chip
                                key={skill}
                                label={skill}
                                onDelete={() => handleSkillRemove(skill)}
                                sx={{ mr: 1, mb: 1 }}
                            />
                        ))}
                    </Box>
                    <TextField
                        fullWidth
                        label="Add Skill"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSkillAdd(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Save Settings
                </Button>
            </Box>
        </Paper>
    );
}

export default ProfileMarket; 