import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import WorkerSearch from '../components/WorkerSearch';
import { Helmet } from 'react-helmet';

const WorkerSearchPage = () => {
  return (
    <Box sx={{ bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <Helmet>
        <title>Find Skilled Workers - Kelmah | Ghana's Top Talent Pool</title>
      </Helmet>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography 
          variant="h2" 
          sx={{ 
            color: '#D4AF37', 
            textAlign: 'center',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Find Ghana's Top Skilled Workers
        </Typography>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            textAlign: 'center',
            mt: 2
          }}
        >
          Connect with verified professionals across all skilled trades
        </Typography>
        <Box sx={{ mt: 4 }}>
          <WorkerSearch />
        </Box>
      </Container>
    </Box>
  );
};

export default WorkerSearchPage;
