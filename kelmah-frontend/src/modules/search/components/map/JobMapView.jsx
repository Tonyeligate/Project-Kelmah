import React from 'react';
import { Box, Paper, Typography, Button, Skeleton } from '@mui/material';
import { ViewList as ListIcon } from '@mui/icons-material';

const JobMapView = ({
  jobs = [],
  centerLocation = null,
  radius = 50,
  loading = false,
  onToggleView,
}) => {
  return (
    <Box
      aria-label="Worker search map panel"
      sx={{
        position: 'relative',
        height: '70vh',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{ p: 2, position: 'absolute', top: 16, right: 16, zIndex: 10 }}
      >
        <Button
          variant="outlined"
          startIcon={<ListIcon />}
          onClick={onToggleView}
          sx={{ minHeight: 44 }}
        >
          List View
        </Button>
      </Paper>

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.05)',
            px: 2,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 460 }}>
            <Skeleton variant="text" height={36} width="65%" />
            <Skeleton variant="text" height={24} width="100%" />
            <Skeleton variant="text" height={24} width="84%" />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 1,
            textAlign: 'center',
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.primary">
            Map preview is temporarily unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can continue with list view and location filters to review{' '}
            {jobs.length} worker matches
            {radius ? ` within ${radius} km.` : '.'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your search is still active and no results are lost while map
            preview is unavailable.
          </Typography>
          {centerLocation ? (
            <Typography variant="caption" color="text.secondary">
              A location center is already selected for this search.
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Set a location in filters to narrow nearby workers.
            </Typography>
          )}
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={onToggleView}
            sx={{ mt: 1, minHeight: 44 }}
          >
            Back to List
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobMapView;
