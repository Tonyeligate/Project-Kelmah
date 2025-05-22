import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    Typography,
    IconButton,
    Collapse,
    Tooltip,
    DateRangePicker
} from '@mui/material';
import {
    FilterList,
    Add,
    Remove,
    Save,
    RestartAlt,
    BookmarkBorder,
    Bookmark
} from '@mui/icons-material';

const METRIC_TYPES = {
    views: { label: 'Views', aggregations: ['count', 'unique'] },
    duration: { label: 'Duration', aggregations: ['avg', 'max', 'min'] },
    interactions: { label: 'Interactions', aggregations: ['count', 'type'] },
    shares: { label: 'Shares', aggregations: ['count', 'unique'] },
    exports: { label: 'Exports', aggregations: ['count', 'format'] }
};

function AdvancedAnalyticsFilters({ onFilterChange }) {
    const [filters, setFilters] = useState([]);
    const [savedFilters, setSavedFilters] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);

    useEffect(() => {
        loadSavedFilters();
    }, []);

    const loadSavedFilters = async () => {
        try {
            const response = await api.get('/api/analytics/saved-filters');
            setSavedFilters(response.data);
        } catch (error) {
            console.error('Failed to load saved filters:', error);
        }
    };

    const addFilter = () => {
        setFilters([...filters, {
            id: Date.now(),
            metric: '',
            aggregation: '',
            operator: 'gt',
            value: ''
        }]);
    };

    const removeFilter = (id) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id, field, value) => {
        setFilters(filters.map(f => 
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const handleApplyFilters = () => {
        const filterConfig = {
            filters,
            dateRange,
            metrics: filters.map(f => ({
                type: f.metric,
                aggregation: f.aggregation
            }))
        };
        onFilterChange(filterConfig);
    };

    const saveCurrentFilters = async () => {
        try {
            const name = prompt('Enter a name for this filter set:');
            if (!name) return;

            await api.post('/api/analytics/saved-filters', {
                name,
                filters,
                dateRange
            });

            await loadSavedFilters();
        } catch (error) {
            console.error('Failed to save filters:', error);
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Analytics Filters</Typography>
                <IconButton onClick={() => setExpanded(!expanded)}>
                    {expanded ? <Remove /> : <Add />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            renderInput={(startProps, endProps) => (
                                <>
                                    <TextField {...startProps} />
                                    <Box sx={{ mx: 2 }}>to</Box>
                                    <TextField {...endProps} />
                                </>
                            )}
                        />
                    </Grid>

                    {filters.map((filter, index) => (
                        <Grid item xs={12} key={filter.id}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Metric</InputLabel>
                                    <Select
                                        value={filter.metric}
                                        onChange={(e) => updateFilter(filter.id, 'metric', e.target.value)}
                                    >
                                        {Object.entries(METRIC_TYPES).map(([key, value]) => (
                                            <MenuItem key={key} value={key}>
                                                {value.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel>Aggregation</InputLabel>
                                    <Select
                                        value={filter.aggregation}
                                        onChange={(e) => updateFilter(filter.id, 'aggregation', e.target.value)}
                                    >
                                        {filter.metric && METRIC_TYPES[filter.metric].aggregations.map(agg => (
                                            <MenuItem key={agg} value={agg}>
                                                {agg}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel>Operator</InputLabel>
                                    <Select
                                        value={filter.operator}
                                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                                    >
                                        <MenuItem value="gt">&gt;</MenuItem>
                                        <MenuItem value="lt">&lt;</MenuItem>
                                        <MenuItem value="eq">=</MenuItem>
                                        <MenuItem value="neq">≠</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    label="Value"
                                    value={filter.value}
                                    onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                />

                                <IconButton onClick={() => removeFilter(filter.id)}>
                                    <Remove />
                                </IconButton>
                            </Box>
                        </Grid>
                    ))}

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                startIcon={<Add />}
                                onClick={addFilter}
                            >
                                Add Filter
                            </Button>
                            <Button
                                startIcon={<Save />}
                                onClick={saveCurrentFilters}
                            >
                                Save Filters
                            </Button>
                            <Button
                                startIcon={<RestartAlt />}
                                onClick={() => {
                                    setFilters([]);
                                    setDateRange([null, null]);
                                }}
                            >
                                Reset
                            </Button>
                        </Box>
                    </Grid>

                    {savedFilters.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Saved Filters
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {savedFilters.map(saved => (
                                    <Chip
                                        key={saved.id}
                                        label={saved.name}
                                        onClick={() => {
                                            setFilters(saved.filters);
                                            setDateRange(saved.dateRange);
                                        }}
                                        onDelete={() => {/* Handle delete */}}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    )}
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleApplyFilters}
                    >
                        Apply Filters
                    </Button>
                </Box>
            </Collapse>
        </Paper>
    );
}

// Add annotation collaboration features
function CollaborativeAnnotation({ documentId }) {
    const [users, setUsers] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        connectWebSocket();
        return () => wsRef.current?.close();
    }, [documentId]);

    const connectWebSocket = () => {
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/annotations/${documentId}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'user_joined':
                setUsers(prev => [...prev, message.user]);
                break;
            case 'user_left':
                setUsers(prev => prev.filter(u => u.id !== message.userId));
                break;
            case 'annotation_added':
                setAnnotations(prev => [...prev, message.annotation]);
                break;
            case 'annotation_updated':
                setAnnotations(prev => prev.map(a => 
                    a.id === message.annotation.id ? message.annotation : a
                ));
                break;
            case 'annotation_deleted':
                setAnnotations(prev => prev.filter(a => a.id !== message.annotationId));
                break;
        }
    };

    const addAnnotation = (annotation) => {
        wsRef.current?.send(JSON.stringify({
            type: 'add_annotation',
            annotation
        }));
    };

    const updateAnnotation = (annotation) => {
        wsRef.current?.send(JSON.stringify({
            type: 'update_annotation',
            annotation
        }));
    };

    const deleteAnnotation = (annotationId) => {
        wsRef.current?.send(JSON.stringify({
            type: 'delete_annotation',
            annotationId
        }));
    };

    return (
        <Box>
            {/* Annotation tools and collaboration UI */}
        </Box>
    );
}

export { AdvancedAnalyticsFilters, CollaborativeAnnotation }; 