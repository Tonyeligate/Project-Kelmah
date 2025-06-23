import React, { useEffect } from 'react';
import { useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Card, CardContent, Typography, Chip, TextField, CircularProgress, Box } from '@mui/material';
import { fetchJobs, selectJobs, selectJobsLoading, selectJobsError, selectJobFilters, setFilters, selectJobsPagination } from '../../jobs/services/jobSlice';

const JobSearchPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const jobs = useSelector(selectJobs);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const filters = useSelector(selectJobFilters);
  const { currentPage, totalPages } = useSelector(selectJobsPagination);

  useEffect(() => {
    dispatch(fetchJobs({ ...filters, page: currentPage }));
  }, [dispatch, filters, currentPage]);

  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  return (
    <Box p={2}>
      <TextField
        label="Search jobs"
        variant="outlined"
        fullWidth
        value={filters.search}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
      />
      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : jobs.length === 0 ? (
        <Typography>No jobs found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{job.title}</Typography>
                  <Typography variant="body2" color="textSecondary">{job.location}</Typography>
                  <Box mt={1} mb={1}>
                    <Chip
                      label={job.category}
                      size="small"
                      sx={{ backgroundColor: theme.palette.secondary.light }}
                    />
                  </Box>
                  <Typography variant="body2">{job.description.substring(0, 100)}...</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default JobSearchPage; 