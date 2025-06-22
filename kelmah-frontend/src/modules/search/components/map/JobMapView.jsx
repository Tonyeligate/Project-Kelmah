import React from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { ViewList as ListIcon } from '@mui/icons-material';

const JobMapView = ({ 
  jobs = [], 
  centerLocation = null, 
  radius = 50, 
  loading = false, 
  onToggleView 
}) => {
  return (
    <Box sx={{ position: 'relative', height: '70vh', borderRadius: 1, overflow: 'hidden' }}>
      <Paper sx={{ p: 2, position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
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
            backgroundColor: 'rgba(0,0,0,0.05)'
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
            alignItems: 'center'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Map view implementation requires Google Maps API integration
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default JobMapView; 