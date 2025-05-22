import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import {
    Search,
    FilterList,
    Sort,
    Clear,
    History,
    RestoreFromTrash
} from '@mui/icons-material';
import api from '../../api/axios';

const SORT_OPTIONS = {
    'name-asc': { label: 'Name (A-Z)', field: 'name', order: 'asc' },
    'name-desc': { label: 'Name (Z-A)', field: 'name', order: 'desc' },
    'date-desc': { label: 'Newest First', field: 'createdAt', order: 'desc' },
    'date-asc': { label: 'Oldest First', field: 'createdAt', order: 'asc' }
};

function TemplateSearch({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        type: [],
        status: [],
        tags: []
    });
    const [sortBy, setSortBy] = useState('date-desc');
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [sortAnchor, setSortAnchor] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        loadAvailableTags();
    }, []);

    const loadAvailableTags = async () => {
        const response = await api.get('/api/templates/tags');
        setAvailableTags(response.data);
    };

    const handleSearch = () => {
        onSearch({
            term: searchTerm,
            filters,
            sort: SORT_OPTIONS[sortBy]
        });
    };

    const handleFilterChange = (category, value) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(v => v !== value)
                : [...prev[category], value]
        }));
    };

    const clearFilters = () => {
        setFilters({
            type: [],
            status: [],
            tags: []
        });
        setSearchTerm('');
        handleSearch();
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <Clear />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
                    <FilterList />
                </IconButton>
                <IconButton onClick={(e) => setSortAnchor(e.currentTarget)}>
                    <Sort />
                </IconButton>
            </Box>

            {/* Active Filters */}
            {Object.entries(filters).some(([_, values]) => values.length > 0) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {Object.entries(filters).map(([category, values]) =>
                        values.map(value => (
                            <Chip
                                key={`${category}-${value}`}
                                label={`${category}: ${value}`}
                                onDelete={() => handleFilterChange(category, value)}
                                size="small"
                            />
                        ))
                    )}
                    <Button
                        size="small"
                        startIcon={<Clear />}
                        onClick={clearFilters}
                    >
                        Clear All
                    </Button>
                </Box>
            )}

            {/* Filter Menu */}
            <Menu
                anchorEl={filterAnchor}
                open={Boolean(filterAnchor)}
                onClose={() => setFilterAnchor(null)}
            >
                <Box sx={{ p: 2, minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>Type</Typography>
                    <FormGroup>
                        {['report', 'dashboard', 'chart'].map(type => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={filters.type.includes(type)}
                                        onChange={() => handleFilterChange('type', type)}
                                        size="small"
                                    />
                                }
                                label={type}
                            />
                        ))}
                    </FormGroup>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Status</Typography>
                    <FormGroup>
                        {['active', 'draft', 'archived'].map(status => (
                            <FormControlLabel
                                key={status}
                                control={
                                    <Checkbox
                                        checked={filters.status.includes(status)}
                                        onChange={() => handleFilterChange('status', status)}
                                        size="small"
                                    />
                                }
                                label={status}
                            />
                        ))}
                    </FormGroup>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {availableTags.map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                onClick={() => handleFilterChange('tags', tag)}
                                color={filters.tags.includes(tag) ? 'primary' : 'default'}
                            />
                        ))}
                    </Box>
                </Box>
            </Menu>

            {/* Sort Menu */}
            <Menu
                anchorEl={sortAnchor}
                open={Boolean(sortAnchor)}
                onClose={() => setSortAnchor(null)}
            >
                {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                    <MenuItem
                        key={key}
                        selected={sortBy === key}
                        onClick={() => {
                            setSortBy(key);
                            setSortAnchor(null);
                            handleSearch();
                        }}
                    >
                        {option.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

// Version Rollback Component
function VersionRollback({ version, onRollback }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRollback = async () => {
        try {
            setLoading(true);
            setError(null);
            await api.post(`/api/versions/${version.id}/rollback`);
            onRollback();
            setDialogOpen(false);
        } catch (error) {
            setError('Failed to rollback version. Please try again.');
            console.error('Rollback failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                startIcon={<History />}
                onClick={() => setDialogOpen(true)}
            >
                Rollback to this version
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            >
                <DialogTitle>Confirm Rollback</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Are you sure you want to rollback to version {version.number}?
                        This will create a new version with the rolled back content.
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Created on: {new Date(version.timestamp).toLocaleString()}
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleRollback}
                        disabled={loading}
                        startIcon={<RestoreFromTrash />}
                    >
                        {loading ? 'Rolling back...' : 'Rollback'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export { TemplateSearch, VersionRollback }; 