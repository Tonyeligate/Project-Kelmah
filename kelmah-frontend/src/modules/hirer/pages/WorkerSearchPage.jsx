import React, { useEffect } from 'react';
import { Box, Container, Typography, Alert, Button, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/services/authSlice';
import WorkerSearch from '../components/WorkerSearch';
import { Helmet } from 'react-helmet-async';

const WorkerSearchPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/hirer/dashboard');
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/hirer/find-talent');
    }
  }, [isAuthenticated, navigate]);

  // Show nothing while redirecting to avoid flash of unauthenticated UI
  if (!isAuthenticated) {
    return null;
  }

  // Show the actual search interface if authenticated
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      <Helmet>
        <title>Find Talent | Kelmah</title>
      </Helmet>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Button
            variant="text"
            color="inherit"
            onClick={handleGoBack}
            startIcon={<ArrowBackIcon />}
            sx={{ minHeight: 44 }}
          >
            {isMobile ? '' : 'Go Back'}
          </Button>
        </Box>
        <Typography
          variant={isMobile ? 'h4' : 'h2'}
          sx={(theme) => ({
            textAlign: 'center',
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          })}
        >
          Find Ghana's Top Skilled Workers
        </Typography>
        <Typography
          variant={isMobile ? 'body1' : 'h5'}
          sx={{
            color: 'text.secondary',
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
