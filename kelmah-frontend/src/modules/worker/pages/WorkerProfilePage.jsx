import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import WorkerProfile from '../components/WorkerProfile';

/**
 * WorkerProfilePage - Public page for viewing worker profiles
 * Displays complete worker information including skills, reviews, portfolio, etc.
 * Accessible via /worker-profile/:id route
 * 
 * Uses key prop on WorkerProfile to force re-mount when navigating between different
 * worker profiles, ensuring the component fetches fresh data for each worker.
 */
const WorkerProfilePage = () => {
  const { workerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top when workerId changes (new profile navigation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [workerId, location.pathname]);

  // Show helpful message if no workerId
  if (!workerId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <PersonSearchIcon sx={{ fontSize: 64, color: '#D4AF37', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Worker profile not found</Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          The worker you&apos;re looking for may have moved.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/search')}
          sx={{ bgcolor: '#D4AF37', color: '#000', '&:hover': { bgcolor: '#B8941F' } }}
        >
          Find Workers
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Worker Profile - Kelmah Platform</title>
        <meta
          name="description"
          content="View detailed worker profile including skills, experience, reviews, and portfolio"
        />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: { xs: 1, md: 4 }, px: { xs: 1, md: 3 } }}>
        <Box>
          {/* Pass workerId as prop - component handles navigation changes via useEffect */}
          <WorkerProfile workerId={workerId} />
        </Box>
      </Container>
    </>
  );
};

export default WorkerProfilePage;
