import React from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import JobCard from './JobCard';
import Pagination from '@mui/material/Pagination';

function JobList({ jobs, loading, error, pagination, onPageChange }) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!jobs?.length) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary">
          No jobs found matching your criteria
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} sm={6} md={4} key={job.id}>
            <JobCard job={job} />
          </Grid>
        ))}
      </Grid>

      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="secondary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
}

export default JobList;
