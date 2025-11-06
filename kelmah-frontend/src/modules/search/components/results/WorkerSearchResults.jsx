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
import { useSelector } from 'react-redux';
import WorkerCard from '../../../worker/components/WorkerCard';

const WorkerSearchResults = ({
  workers = [],
  loading = false,
  error = null,
  filters = {},
  onRemoveFilter,
  onSortChange,
  pagination = {},
  onPageChange,
  showMap = false,
  onToggleView,
  onSaveWorker,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useSelector((state) => state.auth);

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
              onDelete={() => onRemoveFilter && onRemoveFilter(filter.key)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };

  // Renders loading skeleton
  const renderLoadingSkeleton = () => (
    <Grid container spacing={3}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton
                variant="circular"
                width={56}
                height={56}
                sx={{ mr: 2 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="30%" height={16} />
              </Box>
            </Box>
            <Skeleton variant="text" width="100%" height={60} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="rectangular" width={80} height={24} />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  // Renders empty state
  const renderEmptyState = () => (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 2,
      }}
    >
      <Typography variant="h5" color="text.secondary" gutterBottom>
        No workers found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Try adjusting your search criteria or filters
      </Typography>
      <Button
        variant="outlined"
        onClick={() => onRemoveFilter && onRemoveFilter('all')}
      >
        Clear all filters
      </Button>
    </Box>
  );

  // Renders worker cards
  const renderWorkerCards = () => (
    <Grid container spacing={3}>
      {workers.map((worker) => (
        <Grid item xs={12} sm={6} md={4} key={worker.id || worker.userId}>
          <WorkerCard
            worker={worker}
            onSave={onSaveWorker ? () => onSaveWorker(worker) : undefined}
            isPublicView={!isAuthenticated}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Renders pagination
  const renderPagination = () => {
    const totalPages = pagination?.totalPages || pagination?.pages || 0;
    if (!pagination || totalPages <= 1) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={totalPages}
          page={pagination.page || 1}
          onChange={handlePageChange}
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          showFirstButton
          showLastButton
        />
      </Box>
    );
  };

  // Renders sort controls
  const renderSortControls = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {pagination.total
          ? `${pagination.total} workers found`
          : 'Searching...'}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={filters.sort || 'relevance'}
            onChange={handleSortChange}
            label="Sort by"
          >
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="distance">Distance</MenuItem>
            <MenuItem value="newest">Newest</MenuItem>
          </Select>
        </FormControl>

        {onToggleView && (
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            onClick={onToggleView}
            size="small"
          >
            {showMap ? 'List View' : 'Map View'}
          </Button>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box>
        {renderSortControls()}
        {renderLoadingSkeleton()}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <Box>
        {renderSortControls()}
        {renderEmptyState()}
      </Box>
    );
  }

  return (
    <Box>
      {renderSortControls()}
      {renderActiveFilters()}
      {renderWorkerCards()}
      {renderPagination()}
    </Box>
  );
};

export default WorkerSearchResults;
