import React from 'react';
import { Box, Typography, LinearProgress, Grid } from '@mui/material';
import DashboardCard from './DashboardCard';
import PropTypes from 'prop-types';

/**
 * PerformanceMetrics Component
 *
 * Displays performance metrics with progress bars
 *
 * @param {Object} props
 * @param {Array} props.metrics - List of metric items
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Function} props.onRefresh - Refresh callback
 */
const PerformanceMetrics = ({
  metrics = [],
  loading = false,
  error = null,
  onRefresh,
}) => {
  return (
    <DashboardCard
      title="Performance Metrics"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      {metrics.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', py: 2 }}
        >
          No performance metrics available
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} key={metric.id || index}>
              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {metric.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  color={
                    metric.value >= 75
                      ? 'success'
                      : metric.value >= 50
                        ? 'info'
                        : metric.value >= 25
                          ? 'warning'
                          : 'error'
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardCard>
  );
};

PerformanceMetrics.propTypes = {
  metrics: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
};

export default PerformanceMetrics;
