import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import {
    History,
    Compare,
    Restore,
    Edit,
    Delete,
    Save,
    Merge,
    BranchingPoint,
    Lock,
    LockOpen
} from '@mui/icons-material';

function TemplateVersioningUI({ templateId }) {
    const [versions, setVersions] = useState([]);
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [compareMode, setCompareMode] = useState(false);
    const [diffView, setDiffView] = useState(null);
    const [commitDialog, setCommitDialog] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');

    useEffect(() => {
        loadVersionHistory();
    }, [templateId]);

    const loadVersionHistory = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/versions`);
            setVersions(response.data);
        } catch (error) {
            console.error('Failed to load version history:', error);
        }
    };

    const handleVersionSelect = (version) => {
        if (compareMode) {
            if (selectedVersions.includes(version.id)) {
                setSelectedVersions(selectedVersions.filter(v => v !== version.id));
            } else if (selectedVersions.length < 2) {
                setSelectedVersions([...selectedVersions, version.id]);
            }
        } else {
            setSelectedVersions([version.id]);
        }
    };

    const handleCompare = async () => {
        if (selectedVersions.length !== 2) return;

        try {
            const response = await api.post(`/api/templates/compare`, {
                version1: selectedVersions[0],
                version2: selectedVersions[1]
            });
            setDiffView(response.data);
        } catch (error) {
            console.error('Comparison failed:', error);
        }
    };

    const handleCommit = async () => {
        try {
            await api.post(`/api/templates/${templateId}/versions`, {
                message: commitMessage
            });
            setCommitDialog(false);
            setCommitMessage('');
            await loadVersionHistory();
        } catch (error) {
            console.error('Commit failed:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Version History</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Compare />}
                        onClick={() => setCompareMode(!compareMode)}
                        color={compareMode ? 'primary' : 'default'}
                    >
                        Compare
                    </Button>
                    <Button
                        startIcon={<Save />}
                        onClick={() => setCommitDialog(true)}
                    >
                        Commit Changes
                    </Button>
                </Box>
            </Box>

            <Timeline>
                {versions.map((version, index) => (
                    <TimelineItem key={version.id}>
                        <TimelineOppositeContent>
                            <Typography variant="body2" color="textSecondary">
                                {new Date(version.timestamp).toLocaleString()}
                            </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineDot 
                                color={selectedVersions.includes(version.id) ? 'primary' : 'grey'}
                                onClick={() => handleVersionSelect(version)}
                                style={{ cursor: 'pointer' }}
                            />
                            {index < versions.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography>Version {version.number}</Typography>
                                <Chip 
                                    label={version.author}
                                    size="small"
                                    variant="outlined"
                                />
                                {version.locked && (
                                    <Tooltip title="Locked Version">
                                        <Lock fontSize="small" />
                                    </Tooltip>
                                )}
                                <Typography variant="body2" color="textSecondary">
                                    {version.message}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<Restore />}
                                    onClick={() => handleRestore(version.id)}
                                >
                                    Restore
                                </Button>
                                <IconButton size="small">
                                    <Edit />
                                </IconButton>
                                <IconButton size="small">
                                    <Delete />
                                </IconButton>
                            </Box>
                        </TimelineContent>
                    </TimelineItem>
                ))}
            </Timeline>

            {compareMode && selectedVersions.length === 2 && (
                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleCompare}
                    >
                        Compare Selected Versions
                    </Button>
                </Box>
            )}

            {diffView && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Differences
                    </Typography>
                    <pre style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: 16,
                        borderRadius: 4,
                        overflow: 'auto'
                    }}>
                        {diffView.diff}
                    </pre>
                </Box>
            )}

            <Dialog
                open={commitDialog}
                onClose={() => setCommitDialog(false)}
            >
                <DialogTitle>Commit Changes</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Commit Message"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommitDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCommit}
                        disabled={!commitMessage.trim()}
                    >
                        Commit
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Template Sharing Workflows
function TemplateSharing({ templateId }) {
    const [shareSettings, setShareSettings] = useState({
        visibility: 'private',
        collaborators: [],
        expiryDate: null,
        permissions: {
            view: true,
            edit: false,
            share: false
        }
    });

    const [inviteDialog, setInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');

    const handleShareUpdate = async (updates) => {
        try {
            await api.patch(`/api/templates/${templateId}/sharing`, updates);
            setShareSettings(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error('Failed to update sharing settings:', error);
        }
    };

    const handleInvite = async () => {
        try {
            await api.post(`/api/templates/${templateId}/invite`, {
                email: inviteEmail,
                role: inviteRole
            });
            setInviteDialog(false);
            setInviteEmail('');
            setInviteRole('viewer');
            // Refresh collaborators list
        } catch (error) {
            console.error('Failed to send invite:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            {/* Sharing UI implementation */}
        </Paper>
    );
}

export { TemplateVersioningUI, TemplateSharing }; 