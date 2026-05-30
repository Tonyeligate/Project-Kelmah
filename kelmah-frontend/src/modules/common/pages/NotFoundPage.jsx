import { Box, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '@/modules/common/components/PageCanvas';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const accentColor = theme.palette.primary.main || '#FFD34D';

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}
    >
      <Box
        sx={{
          minHeight: '70dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          textAlign: 'center',
          px: 2,
          minWidth: 0,
        }}
      >
        <Helmet>
          <title>Page Not Found | Kelmah</title>
        </Helmet>
        
        {/* Premium 404 Display with Glowing Effect */}
        <Box
          sx={{
            position: 'relative',
            mb: 2,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 180,
              height: 180,
              borderRadius: '50%',
              backgroundColor: alpha(accentColor, isDarkMode ? 0.1 : 0.15),
              filter: 'blur(40px)',
              zIndex: 0,
            }}
          />
          <Typography
            variant="h1"
            component="p"
            sx={{
              position: 'relative',
              zIndex: 1,
              fontSize: { xs: '120px', md: '160px' },
              fontWeight: 800,
              color: isDarkMode ? accentColor : '#D4A017',
              textShadow: isDarkMode 
                ? `0 0 40px ${alpha(accentColor, 0.3)}, 0 0 80px ${alpha(accentColor, 0.2)}`
                : '0 2px 4px rgba(0,0,0,0.1)',
              lineHeight: 1,
            }}
          >
            404
          </Typography>
        </Box>

        <Typography 
          variant="h4" 
          component="p" 
          sx={{ 
            fontWeight: 700,
            color: isDarkMode ? 'text.primary' : '#1A1A1A',
            mb: 1
          }}
        >
          Page not found
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: isDarkMode ? 'text.secondary' : '#555555',
            maxWidth: 480,
            mb: 4,
            lineHeight: 1.6
          }}
        >
          This page may have moved or no longer exists. Use the buttons below to return home or continue exploring opportunities.
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              minHeight: 48,
              borderRadius: '24px',
              px: 4,
              bgcolor: isDarkMode ? accentColor : '#D4A017',
              color: '#171A1F',
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              border: isDarkMode ? 'none' : '1px solid #B8860B',
              '&:hover': {
                bgcolor: isDarkMode ? alpha(accentColor, 0.9) : '#C4941C',
                boxShadow: isDarkMode 
                  ? `0 8px 16px ${alpha(accentColor, 0.3)}`
                  : '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/jobs')}
            sx={{
              minHeight: 48,
              borderRadius: '24px',
              px: 4,
              borderColor: isDarkMode ? accentColor : '#B8860B',
              color: isDarkMode ? accentColor : '#1A1A1A',
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              borderWidth: 2,
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: isDarkMode ? alpha(accentColor, 0.9) : '#D4A017',
                backgroundColor: isDarkMode ? alpha(accentColor, 0.08) : 'rgba(212, 160, 23, 0.08)',
              },
            }}
          >
            Find Jobs
          </Button>
        </Box>
      </Box>
    </PageCanvas>
  );
};

export default NotFoundPage;
