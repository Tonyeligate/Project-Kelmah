import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import GestureControl from '../../common/components/controls/GestureControl';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { checkApiHealth } from '../../common/utils/apiUtils';
import {
  useResponsive,
  useResponsiveTypography,
  useResponsiveLayout,
} from '../../../hooks/useResponsive';
import backgroundImg from '../../../assets/images/background.jpg';
import plumbingImg from '../../../assets/images/plumbing.jpg.jpeg';
import electricalImg from '../../../assets/images/electrical.jpg';
import carpentryImg from '../../../assets/images/carpentry.jpg';
import constructionImg from '../../../assets/images/construction.jpg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BuildIcon from '@mui/icons-material/Build';
import HandymanIcon from '@mui/icons-material/Handyman';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import ConstructionIcon from '@mui/icons-material/Construction';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import { alpha } from '@mui/material/styles';

const Section = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden', // Prevent any overflow to avoid scroll bar glitches
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000000',
  width: '100%',
  maxWidth: '100vw',
  boxSizing: 'border-box',
  // Ensure proper full width utilization on all devices and zoom levels
  '@media (min-width: 1px)': {
    width: '100%',
    maxWidth: '100vw',
  },
  // Tablet adjustments
  [theme.breakpoints.between('sm', 'md')]: {
    minHeight: 'auto',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
}));

const HeroBackgroundImage = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxWidth: '100vw',
  backgroundImage: `url(${plumbingImg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  zIndex: 0,
  boxSizing: 'border-box',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
    background:
      'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.6) 100%)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: `${theme.spacing(1.8)} ${theme.spacing(4)}`,
  fontSize: '1.1rem',
  textTransform: 'none',
  fontWeight: 'bold',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  // Desktop styling for all devices
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
    // Consistent hover effects for all devices
  },
}));

const FeatureCircle = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000000',
  fontWeight: 'bold',
  marginRight: theme.spacing(3),
  boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(50, 50, 50, 0.9)',
  backdropFilter: 'blur(10px)',
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255,215,0,0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(60, 60, 60, 0.95)',
    border: '1px solid rgba(255,215,0,0.4)',
    transform: 'translateX(5px)',
  },
}));

const ServiceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(44, 44, 44, 0.6)',
  backdropFilter: 'blur(8px)',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '2px solid rgba(255, 215, 0, 0.2)',
  cursor: 'pointer',
  // Mobile-optimized hover effects
  '@media (max-width: 600px)': {
    borderRadius: theme.spacing(1.5),
    '&:hover': {
      transform: 'none',  // ✅ Disable transform on mobile
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      border: '2px solid rgba(255, 215, 0, 0.4)',
    },
    '&:active': {  // ✅ Active state for mobile touch feedback
      transform: 'scale(0.98)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
    },
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 215, 0, 0.6)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    },
    '& .service-icon': {
      transform: 'rotate(180deg)',
    },
  },
}));

const ServiceCardMedia = styled(CardMedia)(({ theme }) => ({
  height: { xs: 200, sm: 200, md: 220 },  // ✅ Updated to 200px max per user request
  transition: 'transform 0.4s ease',
  position: 'relative',
  objectFit: 'cover',  // ✅ Better image scaling
  // Mobile-specific optimizations
  '@media (max-width: 600px)': {
    height: 200,  // ✅ Updated to 200px max per user request
  },
  // ✅ Ensure images load efficiently
  '@media (max-width: 360px)': {
    height: 180,  // ✅ Smaller screens get appropriate sizing
  },
}));

const ServiceCardContent = styled(CardContent)(({ theme }) => ({
  background:
    'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(44,44,44,0.6) 100%)',
  padding: {
    xs: theme.spacing(2),  // ✅ Increased from 1.5
    sm: theme.spacing(2.5),
    md: theme.spacing(3),
  },
  // Mobile-specific optimizations
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),  // ✅ Consistent spacing
  },
}));

const TradeIcon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 15,
  right: 15,
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(255,215,0,0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.4s ease',
}));

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const responsiveTypography = useResponsiveTypography();
  const responsiveLayout = useResponsiveLayout();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [apiStatus, setApiStatus] = useState({
    isReachable: true,
    checking: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);  // ✅ NEW: Error state
  const [bgIndex, setBgIndex] = useState(0);

  // Enhanced services with proper vocational trade focus
  const services = [
    {
      title: 'Plumbing Services',
      description:
        'Professional plumbing installations, repairs, and maintenance for homes and businesses',
      image: plumbingImg,
      icon: <PlumbingIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Pipe Installation', 'Leak Repairs', 'Drain Cleaning'],
    },
    {
      title: 'Electrical Work',
      description:
        'Licensed electricians for wiring, installations, and electrical system maintenance',
      image: electricalImg,
      icon: <ElectricalServicesIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Wiring', 'Panel Upgrades', 'Lighting Installation'],
    },
    {
      title: 'Carpentry & Woodwork',
      description:
        'Custom carpentry, furniture making, and wooden structure construction',
      image: carpentryImg,
      icon: <CarpenterIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Custom Furniture', 'Framing', 'Cabinet Making'],
    },
    {
      title: 'Construction & Masonry',
      description:
        'Building construction, masonry work, and renovation projects',
      image: constructionImg,
      icon: <ConstructionIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Foundation Work', 'Bricklaying', 'Concrete Work'],
    },
  ];

  const features = [
    {
      icon: <VerifiedIcon sx={{ fontSize: 28, color: '#000000' }} />,
      title: 'Verified Skilled Workers',
      description:
        'All tradespeople are vetted and verified for quality assurance',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 28, color: '#000000' }} />,
      title: 'Secure Escrow Payments',
      description: 'Safe payment system protecting both workers and hirers',
    },
    {
      icon: <StarIcon sx={{ fontSize: 28, color: '#000000' }} />,
      title: 'Quality Guarantee',
      description: 'Rating system ensuring high-quality workmanship',
    },
  ];

  const goToCategorySearch = (category) => {
    const query = encodeURIComponent(category);
    navigate(`/search?categories=${query}`);
  };

  // Control loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setError(null);  // ✅ Clear any initialization errors
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const isReachable =
          import.meta.env.DEV || (await checkApiHealth(false));
        setApiStatus((prev) => {
          if (prev.isReachable !== isReachable) {
            return { isReachable, checking: false };
          }
          return prev;
        });
        setError(null);  // ✅ Clear errors on successful API check
      } catch (error) {
        console.warn('API check failed, continuing anyway:', error);
        setApiStatus({ isReachable: false, checking: false });
        setError('Unable to connect to server. Some features may be limited.');  // ✅ Set error message
      }
    };
    checkApiStatus();
  }, []);

  useEffect(() => {
    const rotate = setInterval(
      () => setBgIndex((i) => (i + 1) % services.length),
      10000,
    );
    return () => clearInterval(rotate);
  }, [services.length]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      
      {/* ✅ NEW: Error Message Display */}
      {error && !isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 60, sm: 70 },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            width: { xs: '90%', sm: '500px' },
            maxWidth: '90vw',
          }}
        >
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {error}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setError(null)}
              sx={{ color: 'white', minWidth: '44px', minHeight: '44px' }}
            >
              <Box component="span" sx={{ fontSize: '1.5rem' }}>×</Box>
            </IconButton>
          </Box>
        </Box>
      )}
      
      <GestureControl>
        <Box sx={{ position: 'relative' }}>
          {/* Enhanced platform status badge */}
          <Chip
            label={`Platform ${apiStatus.isReachable ? 'Online' : 'Offline'}`}
            color={apiStatus.isReachable ? 'success' : 'error'}
            size="small"
            sx={{
              position: 'absolute',
              top: { xs: 12, sm: 16 },  // ✅ Adjusted position
              right: { xs: 12, sm: 16 },  // ✅ Adjusted position
              zIndex: 2,
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },  // ✅ Responsive font
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              // ✅ Hide on very small screens to prevent overlap
              '@media (max-width: 320px)': {
                top: 8,
                right: 8,
                fontSize: '0.65rem',
                '& .MuiChip-label': {
                  padding: '0 6px',  // ✅ Reduced padding
                },
              },
            }}
          />

          <Section>
            <HeroBackgroundImage
              sx={{ backgroundImage: `url(${services[bgIndex].image})` }}
            />
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '100vw',
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 2, sm: 3, md: 4 },
                boxSizing: 'border-box',
                // Mobile-optimized spacing
                '@media (max-width: 600px)': {
                  px: 1.5,
                  py: 2,
                },
              }}
            >
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                <Grid item xs={12} md={8}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    {user && (
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: theme.palette.secondary.main,
                            mb: 2,
                            fontWeight: 600,
                          }}
                        >
                          Welcome back, {user.firstName || user.username}!
                        </Typography>
                      </motion.div>
                    )}
                    <Typography
                      variant={isMobile ? 'h3' : 'h1'}
                      sx={{
                        fontSize: {
                          xs: '2rem',
                          sm: '2.5rem',
                          md: '3.5rem',
                          lg: '4.5rem',
                          xl: '5rem',
                        },
                        fontWeight: 800,
                        color: '#FFFFFF',
                        mb: { xs: 2.5, sm: 3, md: 3 },  // ✅ Increased mobile spacing
                        textShadow:
                          '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.8)',
                        lineHeight: { xs: 1.2, sm: 1.2, md: 1.1 },  // ✅ Better mobile line height
                        textAlign: { xs: 'center', md: 'left' },
                        px: { xs: 1, sm: 0 },  // ✅ Added mobile horizontal padding
                        wordBreak: 'break-word',  // ✅ Prevent text overflow
                        // Mobile-specific optimizations
                        '@media (max-width: 600px)': {
                          fontSize: '1.75rem',
                          lineHeight: 1.2,  // ✅ Improved from 1.1
                          mb: 2,  // ✅ Increased from 1
                        },
                      }}
                    >
                      Ghana's Premier
                      <br />
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          background:
                            'linear-gradient(45deg, #FFD700 30%, #FFC000 90%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        Skilled Trades
                      </Typography>{' '}
                      Network
                    </Typography>
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      sx={{
                        color: '#FFFFFF',
                        mb: { xs: 3, sm: 3.5, md: 4 },  // ✅ Increased mobile spacing
                        fontWeight: 500,
                        maxWidth: { xs: '100%', md: '85%' },
                        lineHeight: { xs: 1.5, sm: 1.5, md: 1.6 },  // ✅ Better mobile readability
                        fontSize: {
                          xs: '1rem',
                          sm: '1.1rem',
                          md: '1.3rem',
                          lg: '1.4rem',
                        },
                        textAlign: { xs: 'center', md: 'left' },
                        px: { xs: 1.5, sm: 0 },  // ✅ Increased mobile padding
                        textShadow:
                          '1px 1px 3px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.6)',
                        // Mobile-specific optimizations
                        '@media (max-width: 600px)': {
                          fontSize: '0.95rem',
                          lineHeight: 1.5,  // ✅ Improved from 1.3
                          mb: 2.5,  // ✅ Increased from 1.5
                        },
                      }}
                    >
                      Connect with verified skilled workers across Ghana. From
                      plumbing and electrical work to carpentry and construction
                      - find the right professional for every job.
                    </Typography>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: { xs: 2, sm: 2, md: 3 },  // ✅ Increased mobile gap
                          mt: { xs: 3, sm: 3.5, md: 4 },  // ✅ Increased mobile margin
                          alignItems: { xs: 'center', md: 'flex-start' },
                          justifyContent: { xs: 'center', md: 'flex-start' },
                          width: '100%',
                          // Mobile-optimized button layout
                          '@media (max-width: 600px)': {
                            gap: 1.5,  // ✅ Increased from 1
                            mt: 2.5,  // ✅ Increased from 1.5
                          },
                        }}
                      >
                        {!user ? (
                          <>
                            <StyledButton
                              variant="contained"
                              size={isMobile ? 'medium' : 'large'}
                              sx={{
                                background:
                                  'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: {
                                  xs: '1rem',
                                  sm: '1.1rem',
                                  md: '1.2rem',
                                },
                                px: { xs: 3, sm: 4, md: 5 },
                                py: { xs: 1.5, sm: 1.8, md: 2 },
                                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                                border: '2px solid rgba(255, 215, 0, 0.8)',
                                minHeight: {
                                  xs: '48px',
                                  sm: '52px',
                                  md: '56px',
                                },
                                width: { xs: '100%', sm: 'auto' },
                                maxWidth: { xs: '300px', sm: 'none' },
                                // Mobile-specific optimizations
                                '@media (max-width: 600px)': {
                                  px: 2.5,
                                  py: 1.2,
                                  fontSize: '0.95rem',
                                  minHeight: '44px',
                                  maxWidth: '280px',
                                },
                                '&:hover': {
                                  background:
                                    'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                                  boxShadow:
                                    '0 6px 20px rgba(255, 215, 0, 0.6)',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                              fullWidth={isMobile}
                              onClick={() => navigate('/register')}
                            >
                              {isMobile ? 'Join Kelmah' : 'Join the Network'}
                            </StyledButton>
                            <StyledButton
                              variant="outlined"
                              size={isMobile ? 'medium' : 'large'}
                              sx={{
                                borderColor: '#FFD700',
                                color: '#FFD700',
                                borderWidth: { xs: 2, sm: 2.5, md: 3 },
                                fontWeight: 700,
                                fontSize: {
                                  xs: '1rem',
                                  sm: '1.1rem',
                                  md: '1.2rem',
                                },
                                px: { xs: 3, sm: 4, md: 5 },
                                py: { xs: 1.5, sm: 1.8, md: 2 },
                                textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                                boxShadow: '0 4px 15px rgba(255,215,0,0.4)',
                                background: 'rgba(255, 215, 0, 0.1)',
                                backdropFilter: 'blur(10px)',
                                minHeight: {
                                  xs: '48px',
                                  sm: '52px',
                                  md: '56px',
                                },
                                width: { xs: '100%', sm: 'auto' },
                                maxWidth: { xs: '300px', sm: 'none' },
                                // Mobile-specific optimizations
                                '@media (max-width: 600px)': {
                                  px: 2.5,
                                  py: 1.2,
                                  fontSize: '0.95rem',
                                  minHeight: '44px',
                                  maxWidth: '280px',
                                  borderWidth: 2,
                                },
                                '&:hover': {
                                  borderColor: '#FFC000',
                                  color: '#000',
                                  background:
                                    'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                                  borderWidth: { xs: 2, sm: 2.5, md: 3 },
                                  textShadow: 'none',
                                  boxShadow: '0 6px 20px rgba(255,215,0,0.6)',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                              fullWidth={isMobile}
                              onClick={() => navigate('/search')}
                            >
                              Find Workers
                            </StyledButton>
                          </>
                        ) : user.role === 'worker' ? (
                          <StyledButton
                            variant="contained"
                            size={isMobile ? 'medium' : 'large'}
                            sx={{
                              background:
                                'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: {
                                xs: '1rem',
                                sm: '1.1rem',
                                md: '1.2rem',
                              },
                              px: { xs: 3, sm: 4, md: 5 },
                              py: { xs: 1.5, sm: 1.8, md: 2 },
                              minHeight: { xs: '48px', sm: '52px', md: '56px' },
                              width: { xs: '100%', sm: 'auto' },
                              maxWidth: { xs: '300px', sm: 'none' },
                              '@media (max-width: 600px)': {
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                minHeight: '44px',
                                maxWidth: '280px',
                              },
                              '&:hover': {
                                background:
                                  'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                              },
                            }}
                            fullWidth={isMobile}
                            onClick={() => navigate('/jobs')}
                          >
                            {isMobile ? 'Browse Jobs' : 'Browse Available Jobs'}
                          </StyledButton>
                        ) : (
                          <StyledButton
                            variant="contained"
                            size={isMobile ? 'medium' : 'large'}
                            sx={{
                              background:
                                'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: {
                                xs: '1rem',
                                sm: '1.1rem',
                                md: '1.2rem',
                              },
                              px: { xs: 3, sm: 4, md: 5 },
                              py: { xs: 1.5, sm: 1.8, md: 2 },
                              minHeight: { xs: '48px', sm: '52px', md: '56px' },
                              width: { xs: '100%', sm: 'auto' },
                              maxWidth: { xs: '300px', sm: 'none' },
                              '@media (max-width: 600px)': {
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                minHeight: '44px',
                                maxWidth: '280px',
                              },
                              '&:hover': {
                                background:
                                  'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                              },
                            }}
                            fullWidth={isMobile}
                            onClick={() => navigate('/hirer/jobs/post')}
                          >
                            {isMobile ? 'Post Job' : 'Post a Job'}
                          </StyledButton>
                        )}
                      </Box>
                    </motion.div>
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={4}>
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                  >
                    <Box
                      sx={{
                        mt: { xs: 2, sm: 3, md: 8 },
                        display: { xs: 'none', sm: 'block' }, // Hide on mobile, show on larger screens
                      }}
                    >
                      {features.map((feature, index) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                        >
                          <FeatureBox>
                            <FeatureCircle>{feature.icon}</FeatureCircle>
                            <Box>
                              <Typography
                                color="white"
                                variant="h6"
                                sx={{ fontWeight: 700, mb: 0.5 }}
                              >
                                {feature.title}
                              </Typography>
                              <Typography
                                color="rgba(255,255,255,0.8)"
                                variant="body2"
                                sx={{ fontSize: '0.95rem' }}
                              >
                                {feature.description}
                              </Typography>
                            </Box>
                          </FeatureBox>
                        </motion.div>
                      ))}
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>

            {/* Enhanced scroll indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                // ✅ Hide on very small screens to prevent overlap
                '@media (max-width: 360px)': {
                  display: 'none',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },  // ✅ Responsive font
                }}
              >
                Explore Services
              </Typography>
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 10 }}
                transition={{
                  y: { repeat: Infinity, repeatType: 'reverse', duration: 1.5 },
                }}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  document
                    .getElementById('services')
                    .scrollIntoView({ behavior: 'smooth' })
                }
              >
                <KeyboardArrowDownIcon
                  sx={{ fontSize: 40, color: theme.palette.secondary.main }}
                />
              </motion.div>
            </Box>
          </Section>

          {/* ✅ NEW: Visual Separator Between Hero and Services */}
          <Box
            sx={{
              width: '100%',
              height: { xs: '4px', sm: '6px' },
              background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
              boxShadow: '0 2px 15px rgba(255, 215, 0, 0.5)',
            }}
          />

          {/* Enhanced Services Section */}
          <Section
            id="services"
            sx={{
              minHeight: 'auto',
              py: { xs: 6, sm: 10, md: 16 },  // ✅ Reduced top padding on mobile
              background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
              alignItems: 'flex-start',
              overflow: 'visible',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: '100vw',
                px: { xs: 2, sm: 3, md: 4, lg: 6 },  // ✅ Increased mobile padding
                boxSizing: 'border-box',
                // Mobile-specific optimizations
                '@media (max-width: 600px)': {
                  px: 1.5,  // ✅ Increased from 1
                },
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant={isMobile ? 'h4' : 'h2'}
                  sx={{
                    textAlign: 'center',
                    mb: { xs: 2.5, sm: 3 },  // ✅ Increased mobile spacing
                    color: theme.palette.secondary.main,
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
                    px: { xs: 1, sm: 0 },  // ✅ Added mobile padding
                  }}
                >
                  Trade Services Available
                </Typography>
                <Typography
                  variant={isMobile ? 'body1' : 'h6'}
                  sx={{
                    textAlign: 'center',
                    mb: { xs: 4, sm: 6, md: 10 },  // ✅ Reduced mobile margin
                    color: 'rgba(255,255,255,0.8)',
                    maxWidth: { xs: '100%', sm: 600 },
                    mx: 'auto',
                    fontWeight: 400,
                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                    lineHeight: { xs: 1.5, sm: 1.5 },  // ✅ Improved mobile readability
                    px: { xs: 2, sm: 0 },
                  }}
                >
                  Professional skilled workers ready to tackle your projects
                  with expertise and dedication
                </Typography>
              </motion.div>

              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {services.map((service, index) => (
                  <Grid item xs={12} sm={6} md={3} key={service.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.15 }}
                    >
                      <ServiceCard
                        onClick={() => goToCategorySearch(service.title)}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <ServiceCardMedia
                            image={service.image}
                            title={service.title}
                          />
                          <TradeIcon className="service-icon">
                            {service.icon}
                          </TradeIcon>
                        </Box>
                        <ServiceCardContent>
                          <Typography
                            gutterBottom
                            variant={isMobile ? 'h6' : 'h5'}
                            component="div"
                            color="white"
                            sx={{
                              fontWeight: 700,
                              mb: { xs: 1, sm: 1.5, md: 2 },
                              fontSize: {
                                xs: '1.1rem',
                                sm: '1.2rem',
                                md: '1.25rem',
                              },
                            }}
                          >
                            {service.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="rgba(255,255,255,0.85)"
                            sx={{
                              mb: { xs: 1.5, sm: 2 },
                              lineHeight: { xs: 1.4, sm: 1.5 },
                              fontSize: {
                                xs: '0.85rem',
                                sm: '0.9rem',
                                md: '0.875rem',
                              },
                            }}
                          >
                            {service.description}
                          </Typography>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                          >
                            {service.skills.map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255,215,0,0.2)',
                                  color: '#FFD700',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: { xs: 1.5, sm: 1 },  // ✅ Increased mobile gap
                              mt: { xs: 2, sm: 2 },  // ✅ Increased mobile margin
                              flexDirection: { xs: 'column', sm: 'row' },
                            }}
                          >
                            <StyledButton
                              variant="contained"
                              size={isMobile ? 'small' : 'small'}
                              sx={{
                                fontSize: { xs: '0.85rem', sm: '0.8rem' },  // ✅ Larger mobile font
                                py: { xs: 1.2, sm: 0.8 },  // ✅ More padding
                                px: { xs: 2, sm: 2 },  // ✅ More horizontal padding
                                minHeight: { xs: '44px', sm: '36px' },  // ✅ TOUCH TARGET
                                width: { xs: '100%', sm: 'auto' },
                                fontWeight: 600,  // ✅ Better readability
                                '&:active': { transform: 'scale(0.98)' },  // ✅ Mobile feedback
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                goToCategorySearch(service.title);
                              }}
                            >
                              {isMobile ? 'Find Workers' : 'Find Workers'}  {/* ✅ Full text on mobile */}
                            </StyledButton>
                            <StyledButton
                              variant="outlined"
                              size={isMobile ? 'small' : 'small'}
                              sx={{
                                fontSize: { xs: '0.85rem', sm: '0.8rem' },  // ✅ Larger mobile font
                                py: { xs: 1.2, sm: 0.8 },  // ✅ More padding
                                px: { xs: 2, sm: 2 },  // ✅ More horizontal padding
                                minHeight: { xs: '44px', sm: '36px' },  // ✅ TOUCH TARGET
                                width: { xs: '100%', sm: 'auto' },
                                borderWidth: { xs: 2, sm: 2 },  // ✅ Consistent border
                                fontWeight: 600,  // ✅ Better readability
                                '&:active': { transform: 'scale(0.98)' },  // ✅ Mobile feedback
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  navigate('/login?redirect=/hirer/jobs/post');
                                } else if (user.role === 'hirer') {
                                  navigate('/hirer/jobs/post');
                                } else {
                                  navigate('/jobs');
                                }
                              }}
                            >
                              {isMobile ? 'Post a Job' : 'Post Job'}  {/* ✅ Full text on mobile */}
                            </StyledButton>
                          </Box>
                        </ServiceCardContent>
                      </ServiceCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Call-to-action section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    mt: { xs: 5, sm: 8, md: 12 },  // ✅ Reduced mobile margin
                    px: { xs: 2.5, sm: 0 },  // ✅ Increased mobile padding
                    py: { xs: 4, sm: 5, md: 6 },  // ✅ Added vertical padding
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,215,0,0.1) 100%)',  // ✅ Better contrast
                    borderRadius: { xs: 2, sm: 3 },  // ✅ Rounded corners
                    border: '2px solid rgba(255, 215, 0, 0.2)',  // ✅ Visible border
                    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.15)',  // ✅ Subtle glow
                  }}
                >
                  <Typography
                    variant={isMobile ? 'h5' : 'h4'}
                    sx={{
                      color: '#FFD700',  // ✅ Gold color for prominence
                      mb: { xs: 2.5, sm: 3 },  // ✅ Increased spacing
                      fontWeight: 800,  // ✅ Bolder
                      fontSize: { xs: '1.6rem', sm: '2rem', md: '2.125rem' },  // ✅ Larger mobile
                      textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',  // ✅ Text glow
                      px: { xs: 1, sm: 0 },  // ✅ Mobile padding
                    }}
                  >
                    Ready to Get Started?
                  </Typography>
                  <Typography
                    variant={isMobile ? 'body1' : 'h6'}
                    sx={{
                      color: 'rgba(255,255,255,0.9)',  // ✅ Better contrast
                      mb: { xs: 3.5, sm: 4 },  // ✅ Increased spacing
                      maxWidth: { xs: '100%', sm: 500 },
                      mx: 'auto',
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },  // ✅ Larger mobile
                      lineHeight: { xs: 1.6, sm: 1.5 },  // ✅ Better readability
                      px: { xs: 1, sm: 0 },  // ✅ Mobile padding
                    }}
                  >
                    Join thousands of skilled workers and satisfied customers on
                    Ghana's leading trade platform
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 2, sm: 3 },
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                    }}
                  >
                    <StyledButton
                      variant="contained"
                      size={isMobile ? 'medium' : 'large'}
                      sx={{
                        background:
                          'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: { xs: '1.05rem', sm: '1.1rem' },  // ✅ Larger mobile font
                        px: { xs: 4, sm: 4 },  // ✅ More padding
                        py: { xs: 1.5, sm: 1.5 },  // ✅ More vertical padding
                        minHeight: { xs: '50px', sm: '52px' },  // ✅ Larger touch target
                        width: { xs: '100%', sm: 'auto' },
                        maxWidth: { xs: '300px', sm: 'none' },  // ✅ Wider mobile
                        boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',  // ✅ Prominent shadow
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                          boxShadow: '0 6px 25px rgba(255, 215, 0, 0.5)',  // ✅ Enhanced hover
                        },
                        '&:active': { transform: 'scale(0.98)' },  // ✅ Mobile feedback
                      }}
                      fullWidth={isMobile}
                      onClick={() => navigate('/register')}
                    >
                      {isMobile ? 'Join as Worker' : 'Join as a Worker'}
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      size={isMobile ? 'medium' : 'large'}
                      sx={{
                        borderColor: '#FFD700',
                        color: '#FFD700',
                        borderWidth: { xs: 2.5, sm: 2 },  // ✅ Thicker mobile border
                        fontWeight: 700,
                        fontSize: { xs: '1.05rem', sm: '1.1rem' },  // ✅ Larger mobile font
                        px: { xs: 4, sm: 4 },  // ✅ More padding
                        py: { xs: 1.5, sm: 1.5 },  // ✅ More vertical padding
                        minHeight: { xs: '50px', sm: '52px' },  // ✅ Larger touch target
                        width: { xs: '100%', sm: 'auto' },
                        maxWidth: { xs: '300px', sm: 'none' },  // ✅ Wider mobile
                        background: 'rgba(255, 215, 0, 0.08)',  // ✅ Better visibility
                        boxShadow: '0 4px 20px rgba(255, 215, 0, 0.2)',  // ✅ Prominent shadow
                        '&:hover': {
                          background: alpha('#FFD700', 0.15),  // ✅ Better hover
                          borderWidth: { xs: 2.5, sm: 2 },
                          borderColor: '#FFC000',
                          boxShadow: '0 6px 25px rgba(255, 215, 0, 0.3)',
                        },
                        '&:active': { transform: 'scale(0.98)' },  // ✅ Mobile feedback
                      }}
                      fullWidth={isMobile}
                      onClick={() => navigate('/hirer/find-talent')}
                    >
                      {isMobile ? 'Hire Workers' : 'Hire Skilled Workers'}
                    </StyledButton>
                  </Box>
                </Box>
              </motion.div>
            </Box>
          </Section>
        </Box>
      </GestureControl>
      
      {/* ✅ NEW: Sticky Footer Navigation for Mobile */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'flex', md: 'none' },  // Only mobile
          gap: 1,
          p: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTop: '2px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}
      >
        <StyledButton
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
            color: '#000',
            fontWeight: 800,
            minHeight: '44px',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FFC000 0%, #FFD700 100%)',
            },
            '&:active': { transform: 'scale(0.98)' },
          }}
          onClick={() => navigate('/register')}
        >
          Join Kelmah
        </StyledButton>
        <StyledButton
          variant="outlined"
          fullWidth
          sx={{
            borderColor: '#FFD700',
            color: '#FFD700',
            borderWidth: 2,
            fontWeight: 700,
            minHeight: '44px',
            fontSize: '0.9rem',
            background: 'rgba(255, 215, 0, 0.08)',
            '&:hover': {
              background: 'rgba(255, 215, 0, 0.15)',
              borderColor: '#FFC000',
            },
            '&:active': { transform: 'scale(0.98)' },
          }}
          onClick={() => navigate('/hirer/find-talent')}
        >
          Find Workers
        </StyledButton>
      </Box>
    </>
  );
};

export default HomePage;
