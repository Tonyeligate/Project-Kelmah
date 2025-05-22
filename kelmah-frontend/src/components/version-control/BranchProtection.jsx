import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormGroup,
    FormControlLabel,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Security,
    Add,
    Delete,
    Edit,
    Lock,
    LockOpen,
    Group,
    CheckCircle,
    Warning
} from '@mui/icons-material';

function BranchProtection({ templateId }) {
    const [rules, setRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState(null);
    const [ruleDialog, setRuleDialog] = useState(false);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        loadProtectionRules();
        loadBranches();
    }, [templateId]);

    const loadProtectionRules = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/protection-rules`);
            setRules(response.data);
        } catch (error) {
            console.error('Failed to load protection rules:', error);
        }
    };

    const loadBranches = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/branches`);
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to load branches:', error);
        }
    };

    const handleSaveRule = async (rule) => {
        try {
            if (rule.id) {
                await api.put(`/api/protection-rules/${rule.id}`, rule);
            } else {
                await api.post(`/api/templates/${templateId}/protection-rules`, rule);
            }
            await loadProtectionRules();
            setRuleDialog(false);
        } catch (error) {
            console.error('Failed to save protection rule:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Branch Protection Rules</Typography>
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
                                    <Lock fontSize="small" />
                                    <Typography variant="subtitle1">
                                        {rule.name}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={rule.branchPattern}
                                        variant="outlined"
                                    />
                                </Box>
                            }
                            secondary={
                                <Box sx={{ mt: 1 }}>
                                    {rule.requiredReviews > 0 && (
                                        <Chip
                                            size="small"
                                            label={`${rule.requiredReviews} reviews required`}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    {rule.requiresTests && (
                                        <Chip
                                            size="small"
                                            label="Tests required"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    {rule.restrictMerge && (
                                        <Chip
                                            size="small"
                                            label="Restricted merge"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                onClick={() => {
                                    setSelectedRule(rule);
                                    setRuleDialog(true);
                                }}
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

            <Dialog
                open={ruleDialog}
                onClose={() => setRuleDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedRule ? 'Edit Protection Rule' : 'New Protection Rule'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Rule Name"
                            value={selectedRule?.name || ''}
                            onChange={(e) => handleRuleNameChange(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label="Branch Pattern"
                            placeholder="e.g., main, release/*, feature/*"
                            value={selectedRule?.branchPattern || ''}
                            onChange={(e) => handleBranchPatternChange(e.target.value)}
                        />
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={selectedRule?.requiresReview || false}
                                        onChange={(e) => handleRequiresReviewChange(e.target.checked)}
                                    />
                                }
                                label="Require pull request reviews"
                            />
                            {/* Add more protection options */}
                        </FormGroup>
                    </Box>
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

// Merge Request Workflows
function MergeRequestWorkflow({ templateId }) {
    const [mergeRequests, setMergeRequests] = useState([]);
    const [selectedMR, setSelectedMR] = useState(null);
    const [reviewers, setReviewers] = useState([]);
    const [mrDialog, setMRDialog] = useState(false);

    useEffect(() => {
        loadMergeRequests();
        loadReviewers();
    }, [templateId]);

    const loadMergeRequests = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/merge-requests`);
            setMergeRequests(response.data);
        } catch (error) {
            console.error('Failed to load merge requests:', error);
        }
    };

    const loadReviewers = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/reviewers`);
            setReviewers(response.data);
        } catch (error) {
            console.error('Failed to load reviewers:', error);
        }
    };

    const handleCreateMR = async (mrData) => {
        try {
            await api.post(`/api/templates/${templateId}/merge-requests`, mrData);
            await loadMergeRequests();
            setMRDialog(false);
        } catch (error) {
            console.error('Failed to create merge request:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Merge Requests</Typography>
                <Button
                    startIcon={<Add />}
                    onClick={() => setMRDialog(true)}
                >
                    New Merge Request
                </Button>
            </Box>

            <List>
                {mergeRequests.map(mr => (
                    <ListItem
                        key={mr.id}
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
                                    <Typography variant="subtitle1">
                                        {mr.title}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={mr.status}
                                        color={getMRStatusColor(mr.status)}
                                    />
                                </Box>
                            }
                            secondary={
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {mr.sourceBranch} → {mr.targetBranch}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        {mr.reviewers.map(reviewer => (
                                            <Tooltip
                                                key={reviewer.id}
                                                title={`${reviewer.name}: ${reviewer.status}`}
                                            >
                                                <Chip
                                                    size="small"
                                                    avatar={<Avatar src={reviewer.avatar} />}
                                                    label={reviewer.name}
                                                    variant="outlined"
                                                />
                                            </Tooltip>
                                        ))}
                                    </Box>
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <Button
                                size="small"
                                onClick={() => handleMerge(mr.id)}
                                disabled={!canMerge(mr)}
                            >
                                Merge
                            </Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {/* Add MR creation dialog */}
        </Paper>
    );
}

export { BranchProtection, MergeRequestWorkflow }; 