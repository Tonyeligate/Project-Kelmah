import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
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
          }}
        >
          <CircularProgress />
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
            You can continue with list view and location filters to review {jobs.length} worker matches
            {radius ? ` within ${radius} km.` : '.'}
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
            sx={{ mt: 1 }}
          >
            Back to List
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobMapView;
