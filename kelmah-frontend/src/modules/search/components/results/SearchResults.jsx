import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Skeleton,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MapOutlined as MapIcon } from '@mui/icons-material';
import JobCard from '../../../jobs/components/common/JobCard';

const SearchResults = ({
  jobs = [],
  loading = false,
  filters = {},
  onRemoveFilter,
  onSortChange,
  pagination = {},
  onPageChange,
  showMap = false,
  onToggleView,
  onSaveJob,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle page change in pagination
  const handlePageChange = (event, value) => {
    if (onPageChange) {
      onPageChange(value);
    }
  };

  // Handle sort change
  const handleSortChange = (event) => {
    if (onSortChange) {
      onSortChange(event.target.value);
    }
  };

  // Renders active filters
  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.keyword) {
      activeFilters.push({ key: 'keyword', value: filters.keyword });
    }

    if (filters.location?.address) {
      activeFilters.push({ key: 'location', value: filters.location.address });
    }

    if (filters.jobType) {
      activeFilters.push({ key: 'jobType', value: filters.jobType });
    }

    if (filters.budgetMin || filters.budgetMax) {
      activeFilters.push({
        key: 'budget',
        value: `$${filters.budgetMin || 0} - $${filters.budgetMax || 'Any'}`,
      });
    }

    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => {
        activeFilters.push({ key: 'categories', value: category });
      });
    }

    if (filters.skills && filters.skills.length > 0) {
      filters.skills.forEach((skill) => {
        activeFilters.push({ key: 'skills', value: skill });
      });
    }

    if (activeFilters.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Active Filters:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {activeFilters.map((filter, index) => (
            <Chip
              key={`${filter.key}-${index}`}
              label={filter.value}
              onDelete={() => onRemoveFilter(filter.key, filter.value)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          {activeFilters.length > 1 && (
            <Chip
              label="Clear All"
              onClick={() => onRemoveFilter('all')}
              size="small"
              color="secondary"
            />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Results Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h6">
            {loading ? 'Searching...' : `${pagination.totalItems || 0} Results`}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                value={filters.sort || 'relevance'}
                label="Sort By"
                onChange={handleSortChange}
                disabled={loading}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Newest</MenuItem>
                <MenuItem value="budget_high">Budget (High to Low)</MenuItem>
                <MenuItem value="budget_low">Budget (Low to High)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={onToggleView}
              size={isMobile ? 'small' : 'medium'}
            >
              {showMap ? 'List View' : 'Map View'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Loading State */}
      {loading && (
        <Grid container spacing={3} sx={{ my: 2 }}>
          {Array.from(new Array(6)).map((_, idx) => (
            <Grid item xs={12} key={idx}>
              <Skeleton
                variant="rectangular"
                height={150}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error State */}
      {!loading && jobs.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No jobs found matching your search criteria. Try adjusting your
          filters.
        </Alert>
      )}

      {/* Results Grid */}
      {!loading && jobs.length > 0 && (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} key={job.id}>
              <JobCard
                job={job}
                onViewDetails={() => (window.location.href = `/jobs/${job.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            disabled={loading}
          />
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
