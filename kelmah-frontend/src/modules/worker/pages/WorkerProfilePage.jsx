import React from 'react';
import { Container, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import WorkerProfile from '../components/WorkerProfile';

/**
 * WorkerProfilePage - Public page for viewing worker profiles
 * Displays complete worker information including skills, reviews, portfolio, etc.
 * Accessible via /worker-profile/:id route
 */
const WorkerProfilePage = () => {
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
          <WorkerProfile />
        </Box>
      </Container>
    </>
  );
};

export default WorkerProfilePage;
