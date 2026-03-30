import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import WorkerProfile from '../components/WorkerProfile';
import PageCanvas from '../../common/components/PageCanvas';

/**
 * WorkerProfilePage - Public page for viewing worker profiles
 * Displays complete worker information including skills, reviews, portfolio, etc.
 * Accessible via /workers/:workerId. Legacy /worker-profile/:workerId redirects are handled in route config.
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
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}>
        <Box sx={{ p: 4, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <PersonSearchIcon sx={{ fontSize: 64, color: 'secondary.dark', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Worker profile not found
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            This worker page is unavailable right now. You can return to the worker directory and choose another profile.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/search')}
            sx={{
              minHeight: 44,
              px: 2.5,
              bgcolor: 'secondary.dark',
              color: 'secondary.contrastText',
              '&:hover': { bgcolor: 'secondary.dark' },
            }}
          >
            Go To Worker Directory
          </Button>
        </Box>
      </PageCanvas>
    );
  }

  return (
    <>
      <Helmet>
        <title>Worker Profile | Kelmah</title>
        <meta
          name="description"
          content="View worker skills, experience, reviews, and portfolio details in one place."
        />
      </Helmet>

      <PageCanvas disableContainer sx={{ pt: { xs: 1, md: 4 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}>
        <Container maxWidth="xl" sx={{ py: { xs: 1, md: 4 }, px: { xs: 1, md: 3 }, width: '100%', minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            {/* Pass workerId as prop so the profile remounts cleanly between public worker routes */}
            <WorkerProfile workerId={workerId} />
          </Box>
        </Container>
      </PageCanvas>
    </>
  );
};

export default WorkerProfilePage;
