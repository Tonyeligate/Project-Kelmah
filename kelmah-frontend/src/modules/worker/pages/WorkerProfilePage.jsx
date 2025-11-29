import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Box } from '@mui/material';
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

  // Scroll to top when workerId changes (new profile navigation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [workerId, location.pathname]);

  // Early return if no workerId
  if (!workerId) {
    return null;
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          {/* key prop forces complete re-mount when workerId changes, 
              ensuring fresh data fetch for each profile navigation */}
          <WorkerProfile key={workerId} workerId={workerId} />
        </Box>
      </Container>
    </>
  );
};

export default WorkerProfilePage;
