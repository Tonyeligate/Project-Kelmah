import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import WorkerProfile from '../components/WorkerProfile';
// If your project has a PageBanner, uncomment and adjust the path:
// import PageBanner from '../../shared/components/PageBanner';

/**
 * WorkerProfilePage
 * Displays the full worker profile for a given worker.
 * Accessible navigation is handled via back button and router integration.
 *
 * Uses key prop on WorkerProfile to force re-mount when navigating between different
 * worker profiles, ensuring the component fetches fresh data for each worker.
 */
const WorkerProfilePage = () => {
  const { workerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Scroll to top when workerId changes (new profile navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [workerId]);

  // Back navigation: prefer router state history, fall back to browser history
  const handleBack = () => {
    const from = location.state?.from;
    from ? navigate(from) : navigate(-1);
  };

  // ── Guard: no workerId in the URL ─────────────────────────────────────────
  if (!workerId) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#0c0c0c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          px: 2,
        }}
      >
        <PersonSearchIcon
          sx={{ fontSize: 72, color: '#e8a820', opacity: 0.6 }}
        />
        <Typography
          variant="h6"
          sx={{ color: '#ffffff', fontWeight: 700, textAlign: 'center' }}
        >
          Worker Not Found
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#626262', textAlign: 'center', maxWidth: 320 }}
        >
          The worker profile you're looking for doesn't exist or may have been
          removed.
        </Typography>
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{
            mt: 1,
            color: '#e8a820',
            borderColor: '#e8a820',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#f5c842',
              color: '#f5c842',
              background: 'rgba(232,168,32,0.08)',
            },
          }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Worker Profile | Kelmah</title>
        <meta
          name="description"
          content="View worker profile, portfolio, skills and reviews on Kelmah."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', background: '#0c0c0c' }}>
        {/*
          key={workerId} forces WorkerProfile to fully re-mount every time the
          user navigates to a different worker, guaranteeing a clean state and
          fresh data fetch for each profile.
        */}
        <WorkerProfile key={workerId} workerId={workerId} />
      </Box>
    </>
  );
};

export default WorkerProfilePage;