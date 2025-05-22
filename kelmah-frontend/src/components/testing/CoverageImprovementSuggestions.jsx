import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Button,
    Chip,
    IconButton,
    Tooltip,
    Collapse,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Lightbulb,
    Add,
    CheckCircle,
    ExpandMore,
    ExpandLess,
    AutoFixHigh,
    PlayArrow,
    Info,
    Code
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CoverageImprovementSuggestions({ workflowId, coverage }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadSuggestions();
    }, [workflowId, coverage]);

    const loadSuggestions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/workflows/${workflowId}/coverage/suggestions`);
            setSuggestions(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading suggestions', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTestCases = async (suggestionId) => {
        try {
            setGenerating(true);
            const response = await api.post(`/api/workflows/${workflowId}/coverage/suggestions/${suggestionId}/generate`);
            enqueueSnackbar('Test cases generated successfully', { variant: 'success' });
            // Refresh suggestions
            await loadSuggestions();
        } catch (error) {
            enqueueSnackbar('Error generating test cases', { variant: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleToggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handlePreviewSuggestion = (suggestion) => {
        setSelectedSuggestion(suggestion);
        setPreviewOpen(true);
    };

    const renderSuggestionPriority = (priority) => {
        const colors = {
            high: 'error',
            medium: 'warning',
            low: 'info'
        };

        return (
            <Chip
                size="small"
                label={priority.toUpperCase()}
                color={colors[priority]}
                sx={{ mr: 1 }}
            />
        );
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Coverage Improvement Suggestions
                    </Typography>
                    <Button
                        startIcon={<AutoFixHigh />}
                        onClick={loadSuggestions}
                    >
                        Refresh Suggestions
                    </Button>
                </Box>

                <List>
                    {suggestions.map((suggestion) => (
                        <Paper key={suggestion.id} sx={{ mb: 2 }}>
                            <ListItem>
                                <ListItemIcon>
                                    <Lightbulb color={suggestion.priority === 'high' ? 'error' : 'action'} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {renderSuggestionPriority(suggestion.priority)}
                                            {suggestion.title}
                                        </Box>
                                    }
                                    secondary={suggestion.description}
                                />
                                <ListItemSecondaryAction>
                                    <Tooltip title="Preview Suggestion">
                                        <IconButton
                                            edge="end"
                                            onClick={() => handlePreviewSuggestion(suggestion)}
                                            sx={{ mr: 1 }}
                                        >
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Generate Test Cases">
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleGenerateTestCases(suggestion.id)}
                                            disabled={generating}
                                            sx={{ mr: 1 }}
                                        >
                                            <Add />
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleToggleExpand(suggestion.id)}
                                    >
                                        {expandedItems[suggestion.id] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <Collapse in={expandedItems[suggestion.id]}>
                                <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Impact Areas:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        {suggestion.impact_areas.map((area, index) => (
                                            <Chip
                                                key={index}
                                                label={area}
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                    
                                    <Typography variant="subtitle2" gutterBottom>
                                        Current Coverage:
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {suggestion.current_coverage}% coverage in affected areas
                                    </Alert>

                                    <Typography variant="subtitle2" gutterBottom>
                                        Expected Improvement:
                                    </Typography>
                                    <Alert severity="success">
                                        +{suggestion.expected_improvement}% potential coverage increase
                                    </Alert>
                                </Box>
                            </Collapse>
                        </Paper>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Suggestion Details
                </DialogTitle>
                <DialogContent>
                    {selectedSuggestion && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Suggested Test Cases:
                            </Typography>
                            <SyntaxHighlighter
                                language="javascript"
                                style={tomorrow}
                                customStyle={{
                                    maxHeight: '400px',
                                    overflow: 'auto'
                                }}
                            >
                                {selectedSuggestion.example_code}
                            </SyntaxHighlighter>

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Implementation Steps:
                            </Typography>
                            <List>
                                {selectedSuggestion.implementation_steps.map((step, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <CheckCircle color="action" />
                                        </ListItemIcon>
                                        <ListItemText primary={step} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        Close
                    </Button>
                    {selectedSuggestion && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                handleGenerateTestCases(selectedSuggestion.id);
                                setPreviewOpen(false);
                            }}
                            disabled={generating}
                        >
                            Generate Test Cases
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CoverageImprovementSuggestions; 