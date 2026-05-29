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
              backgroundColor: alpha(accentColor, 0.1),
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
              color: accentColor,
              textShadow: `0 0 40px ${alpha(accentColor, 0.3)}, 0 0 80px ${alpha(accentColor, 0.2)}`,
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
            color: 'text.primary',
            mb: 1
          }}
        >
          Page not found
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          maxWidth={480}
          sx={{ mb: 4 }}
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
              bgcolor: accentColor,
              color: isDarkMode ? '#000' : '#171A1F',
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: isDarkMode ? alpha(accentColor, 0.9) : alpha(accentColor, 0.85),
                boxShadow: `0 8px 16px ${alpha(accentColor, 0.3)}`,
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
              borderColor: accentColor,
              color: accentColor,
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              borderWidth: 2,
              '&:hover': {
                borderColor: isDarkMode ? alpha(accentColor, 0.9) : alpha(accentColor, 0.85),
                backgroundColor: alpha(accentColor, 0.08),
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
