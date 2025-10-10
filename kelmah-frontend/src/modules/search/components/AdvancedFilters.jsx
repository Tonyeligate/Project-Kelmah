import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Stack,
  Divider,
  Collapse,
  Alert,
  Autocomplete,
  Rating,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Work as CategoryIcon,
  AttachMoney as BudgetIcon,
  Schedule as TimeIcon,
  Star as RatingIcon,
  Verified as VerifiedIcon,
  TrendingUp as PopularIcon,
  AccessTime as RecentIcon,
  LocalOffer as FeaturedIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatters';

const AdvancedFilters = ({
  onFiltersChange,
  initialFilters = {},
  showHeader = true,
  compact = false,
}) => {
  const theme = useTheme();

  // Filter state
  const [filters, setFilters] = useState({
    // Basic filters
    query: '',
    category: '',
    location: '',

    // Budget filters
    budgetMin: 0,
    budgetMax: 10000,
    budgetType: 'total', // 'total', 'hourly', 'daily'

    // Time filters
    duration: '',
    urgency: '',
    postedWithin: '',
    availability: '',

    // Quality filters
    minRating: 0,
    verifiedOnly: false,
    featuredOnly: false,

    // Advanced filters
    skills: [],
    experience: '',
    jobType: '', // 'one-time', 'recurring', 'contract'
    workLocation: '', // 'on-site', 'remote', 'hybrid'

    // Sort options
    sortBy: 'relevance',
    sortOrder: 'desc',

    ...initialFilters,
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    budget: false,
    time: false,
    quality: false,
    advanced: false,
  });

  // Filter options
  const categories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Masonry',
    'Painting',
    'Roofing',
    'Tiling',
    'Landscaping',
    'HVAC',
    'Solar Installation',
    'General Maintenance',
    'Other',
  ];

  const ghanaLocations = [
    // Greater Accra Region
    'Accra',
    'Tema',
    'Kasoa',
    'Madina',
    'Adenta',
    'Ashaiman',
    'Ga West',
    'East Legon',
    'Airport City',
    'Spintex',
    'Dansoman',
    'Achimota',

    // Ashanti Region
    'Kumasi',
    'Obuasi',
    'Ejisu',
    'Mampong',
    'Bekwai',
    'Konongo',

    // Western Region
    'Sekondi-Takoradi',
    'Tarkwa',
    'Axim',
    'Half Assini',

    // Central Region
    'Cape Coast',
    'Elmina',
    'Winneba',
    'Swedru',

    // Northern Region
    'Tamale',
    'Yendi',
    'Savelugu',

    // Other Regions
    'Ho',
    'Koforidua',
    'Sunyani',
    'Wa',
    'Bolgatanga',
  ];

  const skillsOptions = [
    'Pipe Installation',
    'Leak Repair',
    'Drain Cleaning',
    'Water Heater Installation',
    'Electrical Wiring',
    'Circuit Installation',
    'Lighting',
    'Safety Inspection',
    'Cabinet Making',
    'Furniture Assembly',
    'Door Installation',
    'Flooring',
    'Bricklaying',
    'Plastering',
    'Concrete Work',
    'Stone Work',
    'Interior Painting',
    'Exterior Painting',
    'Wall Preparation',
    'Spray Painting',
    'Roof Repair',
    'Gutter Installation',
    'Insulation',
    'Solar Panel Installation',
    'Tile Installation',
    'Grouting',
    'Bathroom Renovation',
    'Kitchen Renovation',
    'Garden Design',
    'Lawn Care',
    'Tree Trimming',
    'Irrigation Systems',
    'Air Conditioning',
    'Heating Systems',
    'Ventilation',
    'Maintenance',
  ];

  const durationOptions = [
    { value: 'few-hours', label: 'Few Hours' },
    { value: 'half-day', label: 'Half Day' },
    { value: 'full-day', label: '1 Day' },
    { value: '2-3-days', label: '2-3 Days' },
    { value: '1-week', label: '1 Week' },
    { value: '2-weeks', label: '2 Weeks' },
    { value: '1-month', label: '1 Month' },
    { value: '2-months', label: '2+ Months' },
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Flexible' },
    { value: 'medium', label: 'Within a week' },
    { value: 'high', label: 'Urgent (24-48h)' },
    { value: 'emergency', label: 'Emergency (Same day)' },
  ];

  const postedWithinOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '3d', label: 'Last 3 Days' },
    { value: '1w', label: 'Last Week' },
    { value: '2w', label: 'Last 2 Weeks' },
    { value: '1m', label: 'Last Month' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'budget-high', label: 'Highest Budget' },
    { value: 'budget-low', label: 'Lowest Budget' },
    { value: 'posted', label: 'Recently Posted' },
    { value: 'deadline', label: 'Nearest Deadline' },
    { value: 'rating', label: 'Highest Rated Clients' },
    { value: 'popular', label: 'Most Popular' },
  ];

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Handle skills selection
  const handleSkillsChange = (event, newSkills) => {
    handleFilterChange('skills', newSkills);
  };

  // Handle budget range change
  const handleBudgetChange = (event, newValue) => {
    setFilters((prev) => ({
      ...prev,
      budgetMin: newValue[0],
      budgetMax: newValue[1],
    }));
  };

  const handleBudgetCommit = (event, newValue) => {
    const newFilters = {
      ...filters,
      budgetMin: newValue[0],
      budgetMax: newValue[1],
    };
    setFilters(newFilters);

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      query: '',
      category: '',
      location: '',
      budgetMin: 0,
      budgetMax: 10000,
      budgetType: 'total',
      duration: '',
      urgency: '',
      postedWithin: '',
      availability: '',
      minRating: 0,
      verifiedOnly: false,
      featuredOnly: false,
      skills: [],
      experience: '',
      jobType: '',
      workLocation: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    };

    setFilters(clearedFilters);

    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  // Handle section expansion
  const handleSectionToggle = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category) count++;
    if (filters.location) count++;
    if (filters.budgetMin > 0 || filters.budgetMax < 10000) count++;
    if (filters.duration) count++;
    if (filters.urgency) count++;
    if (filters.postedWithin) count++;
    if (filters.minRating > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.featuredOnly) count++;
    if (filters.skills.length > 0) count++;
    if (filters.experience) count++;
    if (filters.jobType) count++;
    if (filters.workLocation) count++;
    if (filters.sortBy !== 'relevance') count++;

    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Render section
  const renderFilterSection = (title, icon, content, sectionKey) => {
    if (compact) {
      return (
        <Box mb={2}>
          <Typography
            variant="subtitle2"
            gutterBottom
            display="flex"
            alignItems="center"
            gap={1}
          >
            {icon}
            {title}
          </Typography>
          {content}
        </Box>
      );
    }

    return (
      <Accordion
        expanded={expandedSections[sectionKey]}
        onChange={() => handleSectionToggle(sectionKey)}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="subtitle1">{title}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Paper sx={{ p: compact ? 2 : 3 }}>
      {showHeader && (
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <FilterIcon />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} active`}
                size="small"
                color="primary"
              />
            )}
          </Typography>

          {activeFiltersCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}
        </Box>
      )}

      {/* Basic Filters */}
      {renderFilterSection(
        'Basic Search',
        <SearchIcon color="primary" />,
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search Keywords"
              placeholder="e.g., kitchen renovation, emergency plumbing"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={ghanaLocations}
              value={filters.location}
              onChange={(event, newValue) =>
                handleFilterChange('location', newValue || '')
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  placeholder="Select location"
                />
              )}
            />
          </Grid>
        </Grid>,
        'basic',
      )}

      {/* Budget Filters */}
      {renderFilterSection(
        'Budget Range',
        <BudgetIcon color="primary" />,
        <Box>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Budget Type</InputLabel>
                <Select
                  value={filters.budgetType}
                  onChange={(e) =>
                    handleFilterChange('budgetType', e.target.value)
                  }
                  label="Budget Type"
                >
                  <MenuItem value="total">Total Budget</MenuItem>
                  <MenuItem value="hourly">Hourly Rate</MenuItem>
                  <MenuItem value="daily">Daily Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="body2" gutterBottom>
            Budget Range: {formatCurrency(filters.budgetMin)} -{' '}
            {formatCurrency(filters.budgetMax)}
          </Typography>

          <Slider
            value={[filters.budgetMin, filters.budgetMax]}
            onChange={handleBudgetChange}
            onChangeCommitted={handleBudgetCommit}
            valueLabelDisplay="auto"
            valueLabelFormat={formatCurrency}
            min={0}
            max={10000}
            step={100}
            marks={[
              { value: 0, label: '₵0' },
              { value: 2500, label: '₵2.5K' },
              { value: 5000, label: '₵5K' },
              { value: 7500, label: '₵7.5K' },
              { value: 10000, label: '₵10K+' },
            ]}
          />
        </Box>,
        'budget',
      )}

      {/* Time & Availability Filters */}
      {renderFilterSection(
        'Time & Availability',
        <TimeIcon color="primary" />,
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                label="Duration"
              >
                <MenuItem value="">Any Duration</MenuItem>
                {durationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                label="Urgency"
              >
                <MenuItem value="">Any Urgency</MenuItem>
                {urgencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Posted Within</InputLabel>
              <Select
                value={filters.postedWithin}
                onChange={(e) =>
                  handleFilterChange('postedWithin', e.target.value)
                }
                label="Posted Within"
              >
                <MenuItem value="">Any Time</MenuItem>
                {postedWithinOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>,
        'time',
      )}

      {/* Quality Filters */}
      {renderFilterSection(
        'Quality & Trust',
        <RatingIcon color="primary" />,
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Minimum Client Rating
              </Typography>
              <Rating
                value={filters.minRating}
                onChange={(event, newValue) =>
                  handleFilterChange('minRating', newValue || 0)
                }
                precision={0.5}
              />
            </Grid>
          </Grid>

          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.verifiedOnly}
                  onChange={(e) =>
                    handleFilterChange('verifiedOnly', e.target.checked)
                  }
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <VerifiedIcon fontSize="small" />
                  Verified Clients Only
                </Box>
              }
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.featuredOnly}
                  onChange={(e) =>
                    handleFilterChange('featuredOnly', e.target.checked)
                  }
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <FeaturedIcon fontSize="small" />
                  Featured Jobs Only
                </Box>
              }
            />
          </Box>
        </Box>,
        'quality',
      )}

      {/* Advanced Filters */}
      {renderFilterSection(
        'Advanced Options',
        <FilterIcon color="primary" />,
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={skillsOptions}
              value={filters.skills}
              onChange={handleSkillsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Required Skills"
                  placeholder="Select skills"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experience}
                onChange={(e) =>
                  handleFilterChange('experience', e.target.value)
                }
                label="Experience Level"
              >
                <MenuItem value="">Any Experience</MenuItem>
                <MenuItem value="entry">Entry Level (0-2 years)</MenuItem>
                <MenuItem value="intermediate">
                  Intermediate (2-5 years)
                </MenuItem>
                <MenuItem value="experienced">
                  Experienced (5-10 years)
                </MenuItem>
                <MenuItem value="expert">Expert (10+ years)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                label="Job Type"
              >
                <MenuItem value="">Any Type</MenuItem>
                <MenuItem value="one-time">One-time Project</MenuItem>
                <MenuItem value="recurring">Recurring Work</MenuItem>
                <MenuItem value="contract">Long-term Contract</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Work Location</InputLabel>
              <Select
                value={filters.workLocation}
                onChange={(e) =>
                  handleFilterChange('workLocation', e.target.value)
                }
                label="Work Location"
              >
                <MenuItem value="">Any Location</MenuItem>
                <MenuItem value="on-site">On-site Only</MenuItem>
                <MenuItem value="remote">Remote Possible</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>,
        'advanced',
      )}

      {/* Sort Options */}
      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              label="Sort By"
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Order</InputLabel>
            <Select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              label="Order"
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && !compact && (
        <Box mt={3}>
          <Alert severity="info" icon={<FilterIcon />}>
            <Typography variant="body2">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}{' '}
              active
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default AdvancedFilters;
