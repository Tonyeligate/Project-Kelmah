import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Tooltip,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    History,
    Compare,
    Restore,
    Preview,
    ArrowForward
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { DiffEditor } from '@monaco-editor/react';
import api from '../../api/axios';

function VersionControl({ templateId }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [compareDialogOpen, setCompareDialogOpen] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [comparison, setComparison] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadVersions();
    }, [templateId]);

    const loadVersions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/templates/${templateId}/versions`);
            setVersions(response.data);
        } catch (error) {
            setError('Error loading version history');
            enqueueSnackbar('Error loading versions', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (selectedVersions.length !== 2) return;

        try {
            const response = await api.get(`/api/templates/${templateId}/compare`, {
                params: {
                    version1: selectedVersions[0],
                    version2: selectedVersions[1]
                }
            });
            setComparison(response.data);
            setCompareDialogOpen(true);
        } catch (error) {
            enqueueSnackbar('Error comparing versions', { variant: 'error' });
        }
    };

    const handleRevert = async (version) => {
        if (!window.confirm(`Revert to version ${version}?`)) return;

        try {
            await api.post(`/api/templates/${templateId}/revert`, { version });
            enqueueSnackbar('Template reverted successfully', { variant: 'success' });
            loadVersions();
        } catch (error) {
            enqueueSnackbar('Error reverting template', { variant: 'error' });
        }
    };

    const handleVersionSelect = (version) => {
        if (selectedVersions.includes(version)) {
            setSelectedVersions(selectedVersions.filter(v => v !== version));
        } else if (selectedVersions.length < 2) {
            setSelectedVersions([...selectedVersions, version]);
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
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">
                        Version History
                    </Typography>
                    {selectedVersions.length === 2 && (
                        <Button
                            variant="contained"
                            onClick={handleCompare}
                            startIcon={<Compare />}
                        >
                            Compare Versions
                        </Button>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <List>
                    {versions.map((version, index) => (
                        <React.Fragment key={version.version}>
                            {index > 0 && <Divider />}
                            <ListItem
                                selected={selectedVersions.includes(version.version)}
                                onClick={() => handleVersionSelect(version.version)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                Version {version.version}
                                            </Typography>
                                            {version.version === versions[0].version && (
                                                <Chip
                                                    label="Current"
                                                    size="small"
                                                    color="primary"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Created by {version.created_by_name} on{' '}
                                                {new Date(version.created_at).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2">
                                                {version.changes}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Used {version.usage_count} times
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Tooltip title="Preview">
                                        <IconButton size="small">
                                            <Preview />
                                        </IconButton>
                                    </Tooltip>
                                    {version.version !== versions[0].version && (
                                        <Tooltip title="Revert to this version">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRevert(version.version)}
                                            >
                                                <Restore />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={compareDialogOpen}
                onClose={() => setCompareDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Compare Versions</DialogTitle>
                <DialogContent>
                    {comparison && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Content Changes
                                </Typography>
                                <DiffEditor
                                    height="400px"
                                    original={comparison.version1.content}
                                    modified={comparison.version2.content}
                                    language="html"
                                    options={{
                                        readOnly: true,
                                        renderSideBySide: true
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Variable Changes
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
                                            Added Variables:
                                        </Typography>
                                        {comparison.differences.variables.added.map(variable => (
                                            <Chip
                                                key={variable}
                                                label={variable}
                                                color="success"
                                                size="small"
                                                sx={{ m: 0.5 }}
                                            />
                                        ))}
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
                                            Removed Variables:
                                        </Typography>
                                        {comparison.differences.variables.removed.map(variable => (
                                            <Chip
                                                key={variable}
                                                label={variable}
                                                color="error"
                                                size="small"
                                                sx={{ m: 0.5 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompareDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default VersionControl; 