import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Skeleton,
  Alert,
} from '@mui/material';
import { MapOutlined as MapIcon } from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { InteractiveJobCard as JobCard } from '../../../common/components/cards';

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
  const navigate = useNavigate();
  const isMobile = useBreakpointDown('md');

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
        value: `GH₵${filters.budgetMin || 0} - GH₵${filters.budgetMax || 'Any'}`,
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
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Filters in use:
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.25, wordBreak: 'break-word' }}
        >
          Remove one filter chip at a time, or clear all to broaden your results
          quickly.
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
              sx={{
                maxWidth: '100%',
                height: 'auto',
                '& .MuiChip-label': {
                  display: 'block',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'normal',
                  lineHeight: 1.3,
                  py: 0.5,
                },
              }}
            />
          ))}
          {activeFilters.length > 1 && (
            <Chip
              label="Clear All"
              onClick={() => onRemoveFilter('all')}
              size="small"
              color="secondary"
              sx={{ minHeight: { xs: 44, sm: 36 } }}
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
          <Box>
            <Typography variant="h6">
              {loading
                ? 'Searching...'
                : `${pagination.totalItems || 0} Results`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Results are sorted by your selected option. Use filters to narrow
              by location, budget, or skill.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
            >
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                value={filters.sort || 'relevance'}
                label="Sort By"
                onChange={handleSortChange}
                disabled={loading}
                inputProps={{ 'aria-label': 'Sort search results' }}
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
              aria-label={showMap ? 'Switch to list view' : 'Switch to map view'}
              sx={{ minHeight: 44, whiteSpace: 'nowrap' }}
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
            <Grid item xs={12} key={`search-results-skeleton-${idx}`}>
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
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            onRemoveFilter ? (
              <Button
                size="small"
                onClick={() => onRemoveFilter('all')}
                sx={{ minHeight: 44 }}
              >
                Reset filters
              </Button>
            ) : null
          }
        >
          No jobs matched your current search. Try a simpler trade word, broaden
          location, or reset filters.
        </Alert>
      )}

      {/* Results Grid */}
      {!loading && jobs.length > 0 && (
        <Grid container spacing={3}>
          {jobs.map((job) => {
            const jobId = job?.id || job?._id;
            if (!jobId) return null;
            return (
              <Grid item xs={12} key={jobId}>
                <JobCard
                  job={job}
                  onViewDetails={() => navigate(`/jobs/${jobId}`)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            getItemAriaLabel={(type, pageNumber) =>
              type === 'page' ? `Go to search results page ${pageNumber}` : `Go to ${type} page`
            }
            color="primary"
            disabled={loading}
          />
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
