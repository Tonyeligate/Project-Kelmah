import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    Tooltip,
    Grid
} from '@mui/material';
import {
    AutoFixHigh,
    Rule,
    Add,
    Delete,
    Edit,
    PlayArrow,
    Stop,
    Save,
    BugReport,
    Security,
    Speed
} from '@mui/icons-material';

function CodeReviewAutomation({ templateId }) {
    const [rules, setRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState(null);
    const [ruleDialog, setRuleDialog] = useState(false);
    const [automationEnabled, setAutomationEnabled] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadAutomationRules();
        loadAutomationStats();
    }, [templateId]);

    const loadAutomationRules = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/automation-rules`);
            setRules(response.data);
        } catch (error) {
            console.error('Failed to load automation rules:', error);
        }
    };

    const loadAutomationStats = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/automation-stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load automation stats:', error);
        }
    };

    const handleSaveRule = async (rule) => {
        try {
            if (rule.id) {
                await api.put(`/api/automation-rules/${rule.id}`, rule);
            } else {
                await api.post(`/api/templates/${templateId}/automation-rules`, rule);
            }
            await loadAutomationRules();
            setRuleDialog(false);
        } catch (error) {
            console.error('Failed to save automation rule:', error);
        }
    };

    const handleTestRule = async (ruleId) => {
        try {
            const response = await api.post(`/api/automation-rules/${ruleId}/test`);
            // Handle test results
        } catch (error) {
            console.error('Failed to test rule:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Code Review Automation</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={automationEnabled}
                                onChange={(e) => setAutomationEnabled(e.target.checked)}
                            />
                        }
                        label="Enable Automation"
                    />
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedRule(null);
                            setRuleDialog(true);
                        }}
                    >
                        Add Rule
                    </Button>
                </Box>
            </Box>

            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>
                                Issues Detected
                            </Typography>
                            <Typography variant="h4">
                                {stats.issuesDetected}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>
                                Auto-fixed Issues
                            </Typography>
                            <Typography variant="h4">
                                {stats.autoFixed}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>
                                Time Saved
                            </Typography>
                            <Typography variant="h4">
                                {stats.timeSaved}h
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            <List>
                {rules.map(rule => (
                    <ListItem
                        key={rule.id}
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
                                    <AutoFixHigh />
                                    <Typography variant="subtitle1">
                                        {rule.name}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={rule.type}
                                        color={getRuleTypeColor(rule.type)}
                                    />
                                </Box>
                            }
                            secondary={
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        {rule.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        {rule.tags.map(tag => (
                                            <Chip
                                                key={tag}
                                                size="small"
                                                label={tag}
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                onClick={() => handleTestRule(rule.id)}
                                sx={{ mr: 1 }}
                            >
                                <PlayArrow />
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    setSelectedRule(rule);
                                    setRuleDialog(true);
                                }}
                                sx={{ mr: 1 }}
                            >
                                <Edit />
                            </IconButton>
                            <IconButton
                                onClick={() => handleDeleteRule(rule.id)}
                            >
                                <Delete />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {/* Rule Dialog */}
            <Dialog
                open={ruleDialog}
                onClose={() => setRuleDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedRule ? 'Edit Automation Rule' : 'New Automation Rule'}
                </DialogTitle>
                <DialogContent>
                    {/* Rule form fields */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRuleDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSaveRule(selectedRule)}
                    >
                        Save Rule
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Merge Conflict Prevention
function MergeConflictPrevention({ templateId }) {
    const [conflicts, setConflicts] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        loadConflictData();
    }, [templateId]);

    const loadConflictData = async () => {
        try {
            const [conflictsRes, analysisRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/potential-conflicts`),
                api.get(`/api/templates/${templateId}/conflict-analysis`)
            ]);
            setConflicts(conflictsRes.data);
            setAnalysis(analysisRes.data);
        } catch (error) {
            console.error('Failed to load conflict data:', error);
        }
    };

    const startConflictScan = async () => {
        try {
            setScanning(true);
            await api.post(`/api/templates/${templateId}/scan-conflicts`);
            await loadConflictData();
        } catch (error) {
            console.error('Failed to start conflict scan:', error);
        } finally {
            setScanning(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Merge Conflict Prevention</Typography>
                <Button
                    startIcon={scanning ? <Stop /> : <PlayArrow />}
                    onClick={startConflictScan}
                    disabled={scanning}
                >
                    {scanning ? 'Scanning...' : 'Scan for Conflicts'}
                </Button>
            </Box>

            {analysis && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Analysis metrics */}
                </Grid>
            )}

            <List>
                {conflicts.map(conflict => (
                    <ListItem
                        key={conflict.id}
                        sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 2
                        }}
                    >
                        {/* Conflict details */}
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}

export { CodeReviewAutomation, MergeConflictPrevention }; 