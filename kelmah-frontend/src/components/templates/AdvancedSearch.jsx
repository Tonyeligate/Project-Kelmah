import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    TextField,
    Autocomplete,
    Chip,
    IconButton,
    Button,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Search,
    FilterList,
    Sort,
    SaveAlt,
    History,
    Bookmark,
    BookmarkBorder,
    Code,
    Share
} from '@mui/icons-material';
import debounce from 'lodash/debounce';

function AdvancedTemplateSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        tags: [],
        type: [],
        status: [],
        author: []
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savedSearches, setSavedSearches] = useState([]);
    const [saveSearchDialog, setSaveSearchDialog] = useState(false);
    const [searchName, setSearchName] = useState('');

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query, filterParams) => {
            try {
                setLoading(true);
                const response = await api.get('/api/templates/search', {
                    params: {
                        q: query,
                        ...filterParams
                    }
                });
                setResults(response.data);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        if (searchQuery || Object.values(filters).some(f => f.length > 0)) {
            debouncedSearch(searchQuery, filters);
        }
    }, [searchQuery, filters]);

    const handleSaveSearch = async () => {
        try {
            await api.post('/api/templates/saved-searches', {
                name: searchName,
                query: searchQuery,
                filters
            });
            setSaveSearchDialog(false);
            setSearchName('');
            loadSavedSearches();
        } catch (error) {
            console.error('Failed to save search:', error);
        }
    };

    const loadSavedSearches = async () => {
        try {
            const response = await api.get('/api/templates/saved-searches');
            setSavedSearches(response.data);
        } catch (error) {
            console.error('Failed to load saved searches:', error);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {Object.entries(filters).map(([key, values]) => (
                                <Autocomplete
                                    key={key}
                                    multiple
                                    size="small"
                                    options={[]}
                                    freeSolo
                                    value={values}
                                    onChange={(_, newValue) => setFilters(prev => ({
                                        ...prev,
                                        [key]: newValue
                                    }))}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option}
                                                size="small"
                                                {...getTagProps({ index })}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                        />
                                    )}
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {results.map(template => (
                        <Grid item xs={12} md={4} key={template.id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {template.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        {template.tags.map(tag => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {template.description}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<Code />}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Share />}
                                    >
                                        Share
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<History />}
                                    >
                                        History
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog
                open={saveSearchDialog}
                onClose={() => setSaveSearchDialog(false)}
            >
                <DialogTitle>Save Search</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Search Name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveSearchDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveSearch}
                        disabled={!searchName.trim()}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Version Branching and Merging
function VersionBranchingUI({ templateId }) {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [mergeDialog, setMergeDialog] = useState(false);
    const [mergeTarget, setMergeTarget] = useState(null);
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        loadBranches();
    }, [templateId]);

    const loadBranches = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/branches`);
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to load branches:', error);
        }
    };

    const handleCreateBranch = async (name, sourceBranch) => {
        try {
            await api.post(`/api/templates/${templateId}/branches`, {
                name,
                sourceBranch
            });
            await loadBranches();
        } catch (error) {
            console.error('Failed to create branch:', error);
        }
    };

    const handleMerge = async () => {
        try {
            const response = await api.post(`/api/templates/${templateId}/merge`, {
                sourceBranch: selectedBranch,
                targetBranch: mergeTarget
            });

            if (response.data.conflicts) {
                setConflicts(response.data.conflicts);
            } else {
                setMergeDialog(false);
                await loadBranches();
            }
        } catch (error) {
            console.error('Merge failed:', error);
        }
    };

    return (
        <Box>
            {/* Branch visualization and management UI */}
        </Box>
    );
}

export { AdvancedTemplateSearch, VersionBranchingUI }; 