import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Chip,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Map as MapIcon,
  Sort as SortIcon,
  FilterAlt as FilterIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Timer as TimerIcon,
  MonetizationOn as MoneyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import JobCard from '../jobs/JobCard';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
}));

const ResultsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2)
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '&.MuiChip-root': {
    borderRadius: theme.spacing(1),
  },
  '&.MuiChip-deletable': {
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
    }
  }
}));

const NoResultsContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(6, 2),
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  borderRadius: theme.spacing(2),
}));

/**
 * Search Results Component
 * 
 * @param {Object} props
 * @param {Array} props.jobs - List of jobs to display
 * @param {boolean} props.loading - Whether the data is being loaded
 * @param {Object} props.filters - Applied search filters
 * @param {Function} props.onRemoveFilter - Handler for removing a filter
 * @param {Function} props.onSortChange - Handler for changing sort order
 * @param {Object} props.pagination - Pagination information
 * @param {Function} props.onPageChange - Handler for changing page
 * @param {boolean} props.showMap - Whether to show map view
 * @param {Function} props.onToggleView - Handler for toggling between list and map view
 * @param {Function} props.onSaveJob - Handler for saving a job
 */
const SearchResults = ({
  jobs = [],
  loading = false,
  filters = {},
  onRemoveFilter,
  onSortChange,
  pagination = { page: 1, totalPages: 1, totalItems: 0 },
  onPageChange,
  showMap = false,
  onToggleView,
  onSaveJob
}) => {
  const [sortBy, setSortBy] = useState('relevance');
  
  // Handle sort change
  const handleSortChange = (event) => {
    const newSortValue = event.target.value;
    setSortBy(newSortValue);
    
    if (onSortChange) {
      onSortChange(newSortValue);
    }
  };
  
  // Format active filters for display
  const getActiveFilters = () => {
    const activeFilters = [];
    
    if (filters.keyword) {
      activeFilters.push({
        key: 'keyword',
        label: `Keyword: ${filters.keyword}`,
        value: filters.keyword
      });
    }
    
    if (filters.location && filters.location.address) {
      activeFilters.push({
        key: 'location',
        label: `Location: ${filters.location.address}`,
        value: filters.location.address
      });
      
      if (filters.distance) {
        activeFilters.push({
          key: 'distance',
          label: `Distance: ${filters.distance} km`,
          value: filters.distance
        });
      }
    }
    
    if (filters.jobType) {
      activeFilters.push({
        key: 'jobType',
        label: `Job Type: ${filters.jobType}`,
        value: filters.jobType
      });
    }
    
    if (filters.experienceLevel) {
      activeFilters.push({
        key: 'experienceLevel',
        label: `Experience: ${filters.experienceLevel}`,
        value: filters.experienceLevel
      });
    }
    
    if (filters.categories && filters.categories.length > 0) {
      activeFilters.push({
        key: 'categories',
        label: `Categories: ${filters.categories.length}`,
        value: filters.categories.join(',')
      });
    }
    
    if (filters.skills && filters.skills.length > 0) {
      activeFilters.push({
        key: 'skills',
        label: `Skills: ${filters.skills.length}`,
        value: filters.skills.join(',')
      });
    }
    
    if (filters.budgetMin || filters.budgetMax) {
      let budgetLabel = 'Budget: ';
      
      if (filters.budgetMin && filters.budgetMax) {
        budgetLabel += `$${filters.budgetMin} - $${filters.budgetMax}`;
      } else if (filters.budgetMin) {
        budgetLabel += `From $${filters.budgetMin}`;
      } else {
        budgetLabel += `Up to $${filters.budgetMax}`;
      }
      
      activeFilters.push({
        key: 'budget',
        label: budgetLabel,
        value: `${filters.budgetMin || 0}-${filters.budgetMax || 100}`
      });
    }
    
    return activeFilters;
  };
  
  // Handle filter removal
  const handleRemoveFilter = (filterKey, filterValue) => {
    if (onRemoveFilter) {
      onRemoveFilter(filterKey, filterValue);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <StyledPaper elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </StyledPaper>
    );
  }
  
  return (
    <StyledPaper elevation={2}>
      {/* Results header with count, sort, and view toggle */}
      <ResultsHeader>
        <Typography variant="h6" component="h2">
          {pagination.totalItems} {pagination.totalItems === 1 ? 'Job' : 'Jobs'} Found
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel id="sort-select-label">Sort By</InputLabel>
            <Select
              labelId="sort-select-label"
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
              startAdornment={<SortIcon fontSize="small" sx={{ mr: 1, ml: -0.5 }} />}
            >
              <MenuItem value="relevance">Most Relevant</MenuItem>
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="salary-high">Highest Salary</MenuItem>
              <MenuItem value="salary-low">Lowest Salary</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title={showMap ? "Show List View" : "Show Map View"}>
            <IconButton 
              onClick={onToggleView}
              color={showMap ? "primary" : "default"}
            >
              <MapIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ResultsHeader>
      
      {/* Active filters */}
      {getActiveFilters().length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
              Filters:
            </Typography>
          </Box>
          
          {getActiveFilters().map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              onDelete={() => handleRemoveFilter(filter.key, filter.value)}
              size="small"
            />
          ))}
          
          <Button 
            variant="text" 
            size="small" 
            onClick={() => onRemoveFilter('all')}
            sx={{ ml: 1 }}
          >
            Clear All
          </Button>
        </Box>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Search results */}
      {jobs.length > 0 ? (
        <Box>
          <Grid container spacing={3}>
            {jobs.map(job => (
              <Grid item xs={12} key={job.id}>
                <JobCard 
                  job={job}
                  onSaveJob={() => onSaveJob(job.id)}
                  showLocation={true}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                sx={{ mx: 1 }}
              >
                Previous
              </Button>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                Page {pagination.page} of {pagination.totalPages}
              </Typography>
              
              <Button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                sx={{ mx: 1 }}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        <NoResultsContainer>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search filters or searching for different keywords.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 3 }}
            onClick={() => onRemoveFilter('all')}
          >
            Clear All Filters
          </Button>
        </NoResultsContainer>
      )}
    </StyledPaper>
  );
};

export default SearchResults; 