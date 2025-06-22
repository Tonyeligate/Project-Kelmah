import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';

const JobSearchPage = () => {
  const theme = useTheme();

  // ... existing code ...

  return (
    // ... existing code ...

    <Chip 
      label={job.type} 
      size="small" 
      sx={{ mr: 1, backgroundColor: job.type === 'Contract' ? theme.palette.info.light : theme.palette.success.light }}
    />

    // ... existing code ...
  );
};

export default JobSearchPage; 