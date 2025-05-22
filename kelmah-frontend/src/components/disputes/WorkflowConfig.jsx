import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Save,
    Add,
    Delete,
    Edit
} from '@mui/icons-material';
import api from '../../api/axios';

function WorkflowConfig() {
    const [config, setConfig] = useState({
        autoAssignment: true,
        autoEscalation: true,
        followUpInterval: 24,
        escalationThresholds: {
            timeThreshold: 48,
            amountThreshold: 100000
        }
    });
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [editingRule, setEditingRule] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/workflow/config');
            setConfig(response.data.config);
            setRules(response.data.rules);
        } catch (error) {
            setError('Error loading configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/api/admin/workflow/config', {
                config,
                rules
            });
            setError(null);
        } catch (error) {
            setError('Error saving configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRule = () => {
        setEditingRule({
            id: Date.now(),
            condition: '',
            action: '',
            priority: 0,
            isNew: true
        });
    };

    const handleEditRule = (rule) => {
        setEditingRule({ ...rule, isNew: false });
    };

    const handleDeleteRule = async (ruleId) => {
        try {
            await api.delete(`/api/admin/workflow/rules/${ruleId}`);
            setRules(rules.filter(r => r.id !== ruleId));
        } catch (error) {
            setError('Error deleting rule');
        }
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
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Workflow Configuration
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.autoAssignment}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        autoAssignment: e.target.checked
                                    }))}
                                />
                            }
                            label="Automatic Assignment"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.autoEscalation}
                                    onChange={(e) => setConfig(prev => ({
                                        ...prev,
                                        autoEscalation: e.target.checked
                                    }))}
                                />
                            }
                            label="Automatic Escalation"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Follow-up Interval (hours)"
                            type="number"
                            value={config.followUpInterval}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                followUpInterval: parseInt(e.target.value)
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Amount Threshold (KES)"
                            type="number"
                            value={config.escalationThresholds.amountThreshold}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                escalationThresholds: {
                                    ...prev.escalationThresholds,
                                    amountThreshold: parseInt(e.target.value)
                                }
                            }))}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        startIcon={<Save />}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        Workflow Rules
                    </Typography>
                    <Button
                        startIcon={<Add />}
                        onClick={handleAddRule}
                    >
                        Add Rule
                    </Button>
                </Box>

                <List>
                    {rules.map((rule) => (
                        <ListItem key={rule.id}>
                            <ListItemText
                                primary={rule.condition}
                                secondary={`Action: ${rule.action} | Priority: ${rule.priority}`}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleEditRule(rule)}
                                    sx={{ mr: 1 }}
                                >
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleDeleteRule(rule.id)}
                                >
                                    <Delete />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
}

export default WorkflowConfig; 