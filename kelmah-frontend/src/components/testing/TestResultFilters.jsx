import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Popover,
    Typography,
    Slider,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Search,
    FilterList,
    Clear,
    AccessTime,
    Save,
    BookmarkBorder,
    Bookmark
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';
import { useSnackbar } from 'notistack';

function TestResultFilters({ onFilterChange, savedFilters = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [executionTime, setExecutionTime] = useState([0, 5000]);
    const [tags, setTags] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedSavedFilter, setSelectedSavedFilter] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadAvailableTags();
    }, []);

    const loadAvailableTags = async () => {
        try {
            const response = await api.get('/api/test-results/tags');
            setAvailableTags(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading tags', { variant: 'error' });
        }
    };

    const handleFilterChange = () => {
        onFilterChange({
            searchTerm,
            status,
            dateRange,
            executionTime,
            tags
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatus([]);
        setDateRange([null, null]);
        setExecutionTime([0, 5000]);
        setTags([]);
        setSelectedSavedFilter(null);
        handleFilterChange();
    };

    const handleSaveFilter = async () => {
        try {
            const filterName = prompt('Enter a name for this filter:');
            if (!filterName) return;

            await api.post('/api/test-results/filters', {
                name: filterName,
                filter: {
                    searchTerm,
                    status,
                    dateRange,
                    executionTime,
                    tags
                }
            });

            enqueueSnackbar('Filter saved successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error saving filter', { variant: 'error' });
        }
    };

    const handleLoadFilter = (filter) => {
        setSearchTerm(filter.searchTerm || '');
        setStatus(filter.status || []);
        setDateRange(filter.dateRange || [null, null]);
        setExecutionTime(filter.executionTime || [0, 5000]);
        setTags(filter.tags || []);
        setSelectedSavedFilter(filter);
        handleFilterChange();
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Search Input */}
                <TextField
                    size="small"
                    placeholder="Search test results..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleFilterChange();
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSearchTerm('');
                                        handleFilterChange();
                                    }}
                                >
                                    <Clear />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{ flexGrow: 1 }}
                />

                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        multiple
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            handleFilterChange();
                        }}
                        label="Status"
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        label={value}
                                        size="small"
                                        color={value === 'passed' ? 'success' : 'error'}
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        <MenuItem value="passed">Passed</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="error">Error</MenuItem>
                        <MenuItem value="skipped">Skipped</MenuItem>
                    </Select>
                </FormControl>

                {/* Advanced Filters Button */}
                <Button
                    size="small"
                    startIcon={<FilterList />}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    Advanced Filters
                </Button>

                {/* Save/Load Filters */}
                <Tooltip title="Save current filters">
                    <IconButton onClick={handleSaveFilter}>
                        <Save />
                    </IconButton>
                </Tooltip>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Saved Filters</InputLabel>
                    <Select
                        value={selectedSavedFilter?.id || ''}
                        onChange={(e) => {
                            const filter = savedFilters.find(f => f.id === e.target.value);
                            if (filter) handleLoadFilter(filter);
                        }}
                        label="Saved Filters"
                    >
                        {savedFilters.map((filter) => (
                            <MenuItem key={filter.id} value={filter.id}>
                                {filter.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Clear Filters */}
                <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                >
                    Clear Filters
                </Button>
            </Box>

            {/* Advanced Filters Popover */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 3, width: 400 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Advanced Filters
                    </Typography>

                    {/* Date Range */}
                    <DateRangePicker
                        startText="From"
                        endText="To"
                        value={dateRange}
                        onChange={(newValue) => {
                            setDateRange(newValue);
                            handleFilterChange();
                        }}
                        renderInput={(startProps, endProps) => (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField {...startProps} size="small" />
                                <TextField {...endProps} size="small" />
                            </Box>
                        )}
                    />

                    {/* Execution Time Range */}
                    <Typography variant="subtitle2" gutterBottom>
                        Execution Time (ms)
                    </Typography>
                    <Slider
                        value={executionTime}
                        onChange={(e, newValue) => {
                            setExecutionTime(newValue);
                            handleFilterChange();
                        }}
                        valueLabelDisplay="auto"
                        min={0}
                        max={5000}
                        step={100}
                    />

                    {/* Tags */}
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Tags
                    </Typography>
                    <FormGroup>
                        {availableTags.map((tag) => (
                            <FormControlLabel
                                key={tag}
                                control={
                                    <Checkbox
                                        checked={tags.includes(tag)}
                                        onChange={(e) => {
                                            const newTags = e.target.checked
                                                ? [...tags, tag]
                                                : tags.filter(t => t !== tag);
                                            setTags(newTags);
                                            handleFilterChange();
                                        }}
                                        size="small"
                                    />
                                }
                                label={tag}
                            />
                        ))}
                    </FormGroup>
                </Box>
            </Popover>
        </Paper>
    );
}

export default TestResultFilters; 