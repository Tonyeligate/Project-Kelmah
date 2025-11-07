import React, { useEffect } from 'react';
import { Box, Container, Typography, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/services/authSlice';
import WorkerSearch from '../components/WorkerSearch';
import { Helmet } from 'react-helmet-async';

const WorkerSearchPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // Debug authentication state
  console.log('WorkerSearchPage - isAuthenticated:', isAuthenticated);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log(
      'WorkerSearchPage useEffect - isAuthenticated:',
      isAuthenticated,
    );
    if (!isAuthenticated) {
      console.log('WorkerSearchPage - redirecting to login');
      navigate('/login?redirect=/hirer/find-talent'); // ✅ FIXED: Use correct route
    }
  }, [isAuthenticated, navigate]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
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
              mt: 2,
            }}
          >
            Connect with verified professionals across all skilled trades
          </Typography>

          <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            <Alert
              severity="info"
              sx={{
                mb: 3,
                bgcolor: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '& .MuiAlert-message': {
                  color: 'white',
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                🔐 Authentication Required
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                To search and connect with skilled workers, you need to be
                logged in. This helps us provide you with the best talent
                matching experience.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/login?redirect=/hirer/find-talent')} // ✅ FIXED: Use correct route
                sx={{
                  bgcolor: '#D4AF37',
                  '&:hover': { bgcolor: '#B8941F' },
                }}
              >
                Login to Continue
              </Button>
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  // Show the actual search interface if authenticated
  return (
    <Box sx={{ bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <Helmet>
        <title>Find Skilled Workers - Kelmah | Ghana's Top Talent Pool</title>
      </Helmet>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button variant="text" color="inherit" onClick={handleGoBack}>
            ← Go Back
          </Button>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button variant="outlined" color="inherit" onClick={handleGoBack}>
            ← Go Back
          </Button>
        </Box>
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
            mt: 2,
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
