import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
  IconButton,
  InputAdornment,
  Collapse,
  Paper,
  Typography,
  Grid,
} from '@mui/material';
import { Search, Clear, LocationOn, TuneRounded } from '@mui/icons-material';

/**
 * Universal SearchForm Component
 * Configurable search form that can be used for jobs, workers, or any other entities
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSearch - Search callback function
 * @param {Function} props.onFiltersChange - Filters change callback
 * @param {string} props.searchType - Type of search ('jobs' | 'workers' | 'general')
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.config - Configuration for fields and options
 * @param {boolean} props.showAdvancedFilters - Whether to show advanced filters section
 * @param {string} props.variant - Form variant ('compact' | 'default' | 'expanded')
 */
const SearchForm = ({
  onSearch,
  onFiltersChange,
  searchType = 'general',
  initialValues = {},
  config = {},
  showAdvancedFilters = true,
  variant = 'default',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValues.query || '');
  const [location, setLocation] = useState(initialValues.location || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [filters, setFilters] = useState(initialValues.filters || {});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState(initialValues.tags || []);

  // Default configurations for different search types
  const defaultConfigs = {
    jobs: {
      placeholder: 'Search jobs e.g. plumber in Accra',
      searchHelperText: "Tip: combine trade + location, like 'plumber Accra'.",
      advancedFiltersHint:
        'Use Advanced Filters to narrow results by budget, urgency, or experience.',
      categories: [
        'plumbing',
        'electrical',
        'carpentry',
        'painting',
        'cleaning',
        'security',
        'gardening',
      ],
      filterFields: [
        { name: 'budget_min', label: 'Min Budget', type: 'number' },
        { name: 'budget_max', label: 'Max Budget', type: 'number' },
        {
          name: 'experience_level',
          label: 'Experience Level',
          type: 'select',
          options: ['Entry Level', 'Intermediate', 'Expert'],
        },
        {
          name: 'urgency',
          label: 'Urgency',
          type: 'select',
          options: ['Low', 'Medium', 'High'],
        },
      ],
      availableTags: ['Urgent', 'Remote', 'Part-time', 'Full-time', 'Weekend'],
    },
    workers: {
      placeholder: 'Search workers e.g. electrician in Kumasi',
      searchHelperText:
        "Tip: combine skill + location, like 'electrician Kumasi'.",
      advancedFiltersHint:
        'Use Advanced Filters to narrow results by rating, availability, or experience.',
      categories: [
        'plumber',
        'electrician',
        'carpenter',
        'painter',
        'cleaner',
        'security',
        'gardener',
      ],
      filterFields: [
        {
          name: 'rating_min',
          label: 'Min Rating',
          type: 'number',
          min: 1,
          max: 5,
        },
        {
          name: 'experience_years',
          label: 'Years of Experience',
          type: 'number',
        },
        {
          name: 'availability',
          label: 'Availability',
          type: 'select',
          options: ['Available Now', 'This Week', 'This Month'],
        },
        { name: 'verified_only', label: 'Verified Only', type: 'checkbox' },
      ],
      availableTags: [
        'Verified',
        'Top Rated',
        'Fast Response',
        'Available Now',
      ],
    },
    general: {
      placeholder: 'Search e.g. carpenter in Tamale',
      searchHelperText:
        "Tip: combine what you need + location, like 'carpenter Tamale'.",
      advancedFiltersHint:
        'Use Advanced Filters to narrow results with extra details.',
      categories: [],
      filterFields: [],
      availableTags: [],
    },
  };

  const currentConfig = { ...defaultConfigs[searchType], ...config };

  // Handle search submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();

    const searchParams = {
      query: searchQuery,
      location,
      category,
      tags: selectedTags,
      ...filters,
    };

    onSearch?.(searchParams);
  };

  // Handle filter changes
  const handleFilterChange = (fieldName, value) => {
    const newFilters = { ...filters, [fieldName]: value };
    setFilters(newFilters);

    const allParams = {
      query: searchQuery,
      location,
      category,
      tags: selectedTags,
      ...newFilters,
    };

    onFiltersChange?.(allParams);
  };

  // Handle tag selection
  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);

    const allParams = {
      query: searchQuery,
      location,
      category,
      tags: newTags,
      ...filters,
    };

    onFiltersChange?.(allParams);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setCategory('');
    setFilters({});
    setSelectedTags([]);

    onFiltersChange?.({
      query: '',
      location: '',
      category: '',
      tags: [],
    });
  };

  // Render filter field based on type
  const renderFilterField = (field) => {
    const { name, label, type, options, min, max } = field;
    const value = filters[name] || '';

    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth key={name}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={value}
              label={label}
              onChange={(e) => handleFilterChange(name, e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'number':
        return (
          <TextField
            key={name}
            fullWidth
            label={label}
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(name, e.target.value)}
            inputProps={{ min, max }}
          />
        );

      case 'checkbox':
        return (
          <FormControl key={name}>
            <label>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFilterChange(name, e.target.checked)}
              />
              {label}
            </label>
          </FormControl>
        );

      default:
        return (
          <TextField
            key={name}
            fullWidth
            label={label}
            value={value}
            onChange={(e) => handleFilterChange(name, e.target.value)}
          />
        );
    }
  };

  if (variant === 'compact') {
    return (
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ display: 'flex', gap: 1 }}
      >
        <TextField
          fullWidth
          placeholder={currentConfig.placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          inputProps={{ 'aria-label': `${searchType} search query` }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  edge="end"
                  aria-label="Run search query"
                  sx={{
                    width: 44,
                    height: 44,
                    '&:focus-visible': {
                      outline: '3px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box component="form" onSubmit={handleSearch}>
        {/* Main search fields */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              placeholder={currentConfig.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ 'aria-label': `${searchType} search query` }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.75 }}
            >
              {currentConfig.searchHelperText}
            </Typography>
          </Box>

          <TextField
            fullWidth
            placeholder="City, town, or area (e.g. East Legon)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            inputProps={{ 'aria-label': 'Search location' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { md: 250 } }}
          />

          {currentConfig.categories.length > 0 && (
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {currentConfig.categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: 120, minHeight: 44 }}
          >
            Search
          </Button>
        </Stack>

        {/* Tags */}
        {currentConfig.availableTags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {currentConfig.availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => handleTagToggle(tag)}
                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Stack>
        )}

        {/* Advanced filters toggle */}
        {showAdvancedFilters && currentConfig.filterFields.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Button
                startIcon={<TuneRounded />}
                onClick={() => setShowFilters(!showFilters)}
                variant="text"
                aria-label={
                  showFilters
                    ? 'Hide advanced filters'
                    : 'Show advanced filters'
                }
                sx={{ minHeight: 44 }}
              >
                Advanced Filters
              </Button>
              <Typography variant="caption" color="text.secondary">
                {currentConfig.advancedFiltersHint}
              </Typography>
            </Box>

            {(Object.keys(filters).some((key) => filters[key]) ||
              selectedTags.length > 0) && (
              <Button
                startIcon={<Clear />}
                onClick={handleClearFilters}
                variant="outlined"
                size="small"
              >
                Clear All
              </Button>
            )}
          </Box>
        )}

        {/* Advanced filters */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Advanced Filters
            </Typography>
            <Grid container spacing={2}>
              {currentConfig.filterFields.map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field.name}>
                  {renderFilterField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default SearchForm;
