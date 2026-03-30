const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}));

const categories = [
  'All Categories',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Masonry',
  'Landscaping',
  'HVAC',
  'Roofing',
  'Welding',
  'Automotive',
];

const WorkerFilter = ({ onFilterChange }) => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    category: 'All Categories',
    hourlyRateRange: [10, 100],
    minRating: 0,
    verifiedOnly: false,
    sortBy: 'rating',
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRateRangeChange = (event, newValue) => {
    handleFilterChange('hourlyRateRange', newValue);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      searchTerm: '',
      location: '',
      category: 'All Categories',
      hourlyRateRange: [10, 100],
      minRating: 0,
      verifiedOnly: false,
      sortBy: 'rating',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <FilterPaper elevation={2}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Basic Search Fields */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search worker name, skill, or title"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            inputProps={{
              'aria-label': 'Search workers by name, skill, or title',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
          />

          <TextField
            fullWidth
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            inputProps={{ 'aria-label': 'Filter workers by location' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
          />

          <FormControl
            fullWidth
            size="small"
            sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
          >
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
              inputProps={{ 'aria-label': 'Filter workers by category' }}
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon />
                </InputAdornment>
              }
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1.4 }}
        >
          Start with role and location. Open advanced filters only if you need
          to narrow the list further.
        </Typography>

        {/* Advanced Filter Toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={toggleAdvanced}
            startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            aria-label={
              showAdvanced
                ? 'Hide advanced worker filters'
                : 'Show advanced worker filters'
            }
            sx={{ color: theme.palette.secondary.main }}
          >
            {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </Button>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-select-label">Sort By</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              size="small"
            >
              <MenuItem value="rating">Highest Rating</MenuItem>
              <MenuItem value="hourlyRate">Lowest Rate</MenuItem>
              <MenuItem value="hourlyRateDesc">Highest Rate</MenuItem>
              <MenuItem value="experience">Most Experience</MenuItem>
              <MenuItem value="completedJobs">Most Jobs</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            <Typography gutterBottom variant="subtitle2">
              Hourly Rate Range (
              {new Intl.NumberFormat('en-GH', {
                style: 'currency',
                currency: 'GHS',
              }).format(filters.hourlyRateRange[0])}{' '}
              -{' '}
              {new Intl.NumberFormat('en-GH', {
                style: 'currency',
                currency: 'GHS',
              }).format(filters.hourlyRateRange[1])}
              )
            </Typography>
            <Slider
              value={filters.hourlyRateRange}
              onChange={handleRateRangeChange}
              valueLabelDisplay="auto"
              min={10}
              max={200}
              sx={{
                color: theme.palette.secondary.main,
                '& .MuiSlider-valueLabel': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
            >
              <Box>
                <Typography gutterBottom variant="subtitle2">
                  Minimum Rating
                </Typography>
                <Slider
                  value={filters.minRating}
                  onChange={(e, newValue) =>
                    handleFilterChange('minRating', newValue)
                  }
                  valueLabelDisplay="auto"
                  step={0.5}
                  marks
                  min={0}
                  max={5}
                  sx={{
                    width: { xs: '100%', sm: 200 },
                    color: theme.palette.secondary.main,
                    '& .MuiSlider-valueLabel': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.verifiedOnly}
                    onChange={(e) =>
                      handleFilterChange('verifiedOnly', e.target.checked)
                    }
                    sx={{
                      color: theme.palette.secondary.main,
                      '&.Mui-checked': {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                }
                label="Verified workers only"
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                onClick={handleResetFilters}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    borderColor: theme.palette.secondary.dark,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Reset Filters
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </FilterPaper>
  );
};

export default WorkerFilter;
