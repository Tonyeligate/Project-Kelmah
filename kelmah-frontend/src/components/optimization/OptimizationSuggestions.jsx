import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Button,
    Collapse,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Speed,
    Memory,
    Error,
    ExpandMore,
    ExpandLess,
    Lightbulb,
    TrendingUp
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

function OptimizationSuggestions() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/workflow/optimization');
            setSuggestions(response.data);
        } catch (error) {
            setError('Error loading optimization suggestions');
            enqueueSnackbar('Error loading suggestions', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical':
                return 'error';
            case 'high':
                return 'warning';
            case 'medium':
                return 'info';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'performance':
                return <Speed color="primary" />;
            case 'resource':
                return <Memory color="warning" />;
            case 'reliability':
                return <Error color="error" />;
            default:
                return <Lightbulb color="info" />;
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
                    <Typography variant="h5">
                        Workflow Optimization Suggestions
                    </Typography>
                    <Button
                        startIcon={<TrendingUp />}
                        onClick={loadSuggestions}
                    >
                        Analyze Workflows
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <List>
                    {suggestions.map((suggestion, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <Divider />}
                            <ListItem>
                                <ListItemIcon>
                                    {getTypeIcon(suggestion.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {suggestion.message}
                                            </Typography>
                                            <Chip
                                                label={suggestion.severity}
                                                size="small"
                                                color={getSeverityColor(suggestion.severity)}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Button
                                                size="small"
                                                endIcon={expandedItems[index] ? <ExpandLess /> : <ExpandMore />}
                                                onClick={() => handleToggleExpand(index)}
                                            >
                                                View Details
                                            </Button>
                                            <Collapse in={expandedItems[index]}>
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Recommendations:
                                                    </Typography>
                                                    <List dense>
                                                        {suggestion.recommendation.map((rec, idx) => (
                                                            <ListItem key={idx}>
                                                                <ListItemIcon>
                                                                    <Lightbulb fontSize="small" />
                                                                </ListItemIcon>
                                                                <ListItemText primary={rec} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                                        Impact:
                                                    </Typography>
                                                    <Box sx={{ pl: 2 }}>
                                                        {Object.entries(suggestion.impact).map(([key, value]) => (
                                                            <Typography key={key} variant="body2">
                                                                {key.replace(/_/g, ' ')}: {
                                                                    typeof value === 'number' 
                                                                        ? value.toFixed(2) 
                                                                        : value
                                                                }
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
}

export default OptimizationSuggestions; 