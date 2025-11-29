import React from 'react';
import { useParams } from 'react-router-dom';
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
          <WorkerProfile key={workerId} />
        </Box>
      </Container>
    </>
  );
};

export default WorkerProfilePage;
