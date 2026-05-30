import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import WorkerProfile from '../components/WorkerProfile';
import PageCanvas from '../../common/components/PageCanvas';
import { withBottomNavSafeArea } from '@/utils/safeArea';

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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const accentColor = theme.palette.primary.main || '#FFD34D';
    
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 1.5, md: 4 },
          pb: { xs: withBottomNavSafeArea(20), md: 6 },
          overflowX: 'clip',
        }}
      >
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <PersonSearchIcon
            sx={{ fontSize: 64, color: isDarkMode ? 'secondary.dark' : '#B8860B', mb: 2 }}
          />
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ color: isDarkMode ? 'text.primary' : '#1A1A1A' }}
          >
            Worker profile not found
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 3, 
              color: isDarkMode ? 'text.secondary' : '#555555'
            }}
          >
            This worker page is unavailable right now. You can return to the
            worker directory and choose another profile.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/search')}
            sx={{
              minHeight: 44,
              px: 2.5,
              backgroundColor: isDarkMode ? 'secondary.dark' : '#D4A017',
              color: '#171A1F',
              fontWeight: 600,
              border: isDarkMode ? 'none' : '1px solid #B8860B',
              '&:hover': { 
                backgroundColor: isDarkMode ? 'secondary.dark' : '#C4941C',
              },
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

      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 1, md: 4 },
          pb: { xs: withBottomNavSafeArea(0), md: 6 },
          overflowX: 'clip',
          '--wp-bg': '#101116',
          '--wp-surface': '#1A1D26',
          '--wp-gold': '#FFD34D',
          '--wp-gold-soft': 'rgba(255, 211, 77, 0.28)',
          '--wp-text': '#F7F3E3',
          '--wp-muted': '#B3AFA3',
          '--wp-stroke': 'rgba(255, 211, 77, 0.22)',
          '--wp-shadow': '0 18px 40px rgba(0, 0, 0, 0.45)',
          backgroundColor: 'var(--wp-bg)',
          backgroundImage:
            'radial-gradient(circle at 16% 8%, rgba(255, 211, 77, 0.18) 0%, transparent 45%), radial-gradient(circle at 85% 0%, rgba(255, 255, 255, 0.06) 0%, transparent 45%), linear-gradient(180deg, #1A1D26 0%, #101116 58%, #0A0B10 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)',
            backgroundSize: '120px 120px',
            opacity: 0.25,
            pointerEvents: 'none',
            maskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 50% 0%, rgba(0,0,0,0.4) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 50%)',
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {/* Pass workerId as prop so the profile remounts cleanly between public worker routes */}
          <WorkerProfile workerId={workerId} />
        </Box>
      </PageCanvas>
    </>
  );
};

export default WorkerProfilePage;
