import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import useAuth from '../../auth/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  setFilters,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  selectJobsPagination,
} from '../services/jobSlice';
import JobCard from '../components/common/JobCard';
import { useNavigate } from 'react-router-dom';

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const filters = useSelector(selectJobFilters);
  const { currentPage, totalPages } = useSelector(selectJobsPagination);

  // Ensure jobs is always an array
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);

  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Fetch jobs on mount for all users
  useEffect(() => {
    dispatch(fetchJobs(filters));
  }, [dispatch, filters]);

  // Handle pagination change
  const handlePageChange = (event, value) => {
    const newFilters = { ...filters, page: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery.trim() };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
  };

  const handleLoadSavedJobs = () => {
    const newFilters = { ...filters, saved: true };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
  };

  const handleLoadRecommendedJobs = () => {
    const newFilters = { ...filters, recommended: true };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          {!isMobile && (
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', color: '#fff' }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.secondary.main }}
                >
                  Filters
                </Typography>

                <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <Button type="submit" sx={{ minWidth: 'auto' }}>
                          <SearchIcon />
                        </Button>
                      ),
                    }}
                  />
                </Box>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={filters.job_type || ''}
                    label="Job Type"
                    onChange={(e) =>
                      handleFilterChange('job_type', e.target.value)
                    }
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="full-time">Full Time</MenuItem>
                    <MenuItem value="part-time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="freelance">Freelance</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={filters.experience || ''}
                    label="Experience Level"
                    onChange={(e) =>
                      handleFilterChange('experience', e.target.value)
                    }
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior Level</MenuItem>
                  </Select>
                </FormControl>

                {user && (
                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.dark,
                        },
                      }}
                      onClick={handleLoadSavedJobs}
                    >
                      Saved Jobs
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.dark,
                        },
                      }}
                      onClick={handleLoadRecommendedJobs}
                    >
                      Recommended Jobs
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Jobs List */}
          <Grid item xs={12} md={isMobile ? 12 : 9}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Grid container spacing={3} sx={{ p: 2 }}>
                {Array.from(new Array(6)).map((_, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper sx={{ p: 2 }} elevation={3}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton
                        variant="rectangular"
                        height={118}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : jobs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No jobs found
                </Typography>
              </Paper>
            ) : (
              <>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {isMobile && (
                    <IconButton
                      onClick={() => setFilterDrawerOpen(true)}
                      sx={{ color: theme.palette.secondary.main, mr: 1 }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  )}
                  <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                    Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel sx={{ color: theme.palette.secondary.main }}>
                      Sort by
                    </InputLabel>
                    <Select
                      value={filters.sort || ''}
                      label="Sort by"
                      onChange={(e) =>
                        handleFilterChange('sort', e.target.value)
                      }
                      sx={{
                        color: '#fff',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.secondary.main,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.secondary.main,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.secondary.dark,
                        },
                        '.MuiSvgIcon-root': {
                          color: theme.palette.secondary.main,
                        },
                      }}
                    >
                      <MenuItem value="">Default</MenuItem>
                      <MenuItem value="date_desc">Newest</MenuItem>
                      <MenuItem value="date_asc">Oldest</MenuItem>
                      <MenuItem value="budget_desc">Highest Budget</MenuItem>
                      <MenuItem value="budget_asc">Lowest Budget</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onViewDetails={(id) => navigate(`/jobs/${id}`)}
                  />
                ))}
              </>
            )}
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={filters.page || 1}
                  onChange={handlePageChange}
                  color="secondary"
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 260, p: 2 }}>
          <Paper
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: theme.palette.secondary.main }}
            >
              Filters
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <Button type="submit" sx={{ minWidth: 'auto' }}>
                      <SearchIcon />
                    </Button>
                  ),
                }}
              />
            </Box>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.job_type || ''}
                label="Job Type"
                onChange={(e) => handleFilterChange('job_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="full-time">Full Time</MenuItem>
                <MenuItem value="part-time">Part Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="freelance">Freelance</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experience || ''}
                label="Experience Level"
                onChange={(e) =>
                  handleFilterChange('experience', e.target.value)
                }
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
              </Select>
            </FormControl>
            {user && (
              <Box sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    },
                  }}
                  onClick={handleLoadSavedJobs}
                >
                  Saved Jobs
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    },
                  }}
                  onClick={handleLoadRecommendedJobs}
                >
                  Recommended Jobs
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Drawer>
    </>
  );
};

export default JobsPage;
