import React from 'react';
import { Grid, Box, Typography, Skeleton } from '@mui/material';
import { InteractiveJobCard as JobCard } from '../../../common/components/cards';
import Pagination from '@mui/material/Pagination';

const JobListSkeleton = () => (
  <Grid container spacing={3} aria-hidden="true">
    {Array.from({ length: 6 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={`job-skeleton-${index}`}>
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Skeleton variant="text" width="70%" height={30} />
          <Skeleton variant="text" width="45%" height={22} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={72} sx={{ mb: 1.5 }} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Grid>
    ))}
  </Grid>
);

function JobList({ jobs, loading, error, pagination, onPageChange }) {
  if (loading) {
    return (
      <Box p={{ xs: 2, sm: 3 }}>
        <JobListSkeleton />
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
        {jobs.map((job, index) => {
          const jobId = job?.id || job?._id || `job-${index}`;
          return (
            <Grid item xs={12} sm={6} md={4} key={jobId}>
              <JobCard job={job} />
            </Grid>
          );
        })}
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
