import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Grid, CircularProgress, Card, CardMedia, CardContent, Chip, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import LoadingScreen from '../../common/components/loading/LoadingScreen';
import GestureControl from '../../common/components/controls/GestureControl';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { checkApiHealth } from '../../common/utils/apiUtils';
import backgroundImg from '../../../assets/images/background.jpg';
import plumbingImg from '../../../assets/images/plumbing.jpg.jpeg';
import electricalImg from '../../../assets/images/electrical.jpg';
import carpentryImg from '../../../assets/images/carpentry.jpg';
import constructionImg from '../../../assets/images/construction.jpg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha } from '@mui/material/styles';

const Section = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000000',
  width: '100vw',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
}));

const HeroBackgroundImage = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100%',
  backgroundImage: `url(${plumbingImg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  zIndex: 0,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
    background: 'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.7) 15%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.7) 85%, #000 100%)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: `${theme.spacing(1.5)} ${theme.spacing(4)}`,
  fontSize: '1.1rem',
  textTransform: 'none',
  fontWeight: 'bold',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const FeatureCircle = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: theme.palette.secondary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.secondary.contrastText,
  fontWeight: 'bold',
  marginRight: theme.spacing(2),
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  background: 'rgba(50, 50, 50, 0.8)',
  backdropFilter: 'blur(10px)',
  marginBottom: theme.spacing(2),
}));

const ServiceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(44, 44, 44, 0.4)',
  backdropFilter: 'blur(5px)',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    }
  }
}));

const ServiceCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  transition: 'transform 0.5s ease',
}));

const ServiceCardContent = styled(CardContent)(({ theme }) => ({
  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(44,44,44,0.4) 100%)',
}));

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState({ isReachable: true, checking: false });
  const [isLoading, setIsLoading] = useState(true);
  const [bgIndex, setBgIndex] = useState(0);

  // Hoist services and features above the rotate useEffect
  const services = [
    { title: "Plumbing", description: "Expert plumbing services for residential and commercial properties", image: plumbingImg },
    { title: "Electrical", description: "Professional electrical installations and maintenance", image: electricalImg },
    { title: "Carpentry", description: "Custom woodworking and structural carpentry services", image: carpentryImg },
    { title: "Construction", description: "Full-service construction and renovation projects", image: constructionImg }
  ];

  const features = [
    "Verified Professionals",
    "Secure Payments",
    "Quality Assurance"
  ];

  // Control loading screen
  useEffect(() => {
    // Hide loading screen after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show content immediately, check API status in background
    const checkApiStatus = async () => {
      try {
        // In development, bypass API health check to prevent blocking UI
        const isReachable = import.meta.env.DEV || await checkApiHealth(false);
        
        // Only update state if the reachability changed
        setApiStatus(prev => {
          if (prev.isReachable !== isReachable) {
            return { isReachable, checking: false };
          }
          return prev;
        });
      } catch (error) {
        // This shouldn't happen with our improved error handling
        console.warn("API check failed, continuing anyway:", error);
        setApiStatus({ isReachable: true, checking: false }); // Assume reachable to avoid UI blocks
      }
    };
    
    // Initial check without showing loading state
    checkApiStatus();
  }, []);

  useEffect(() => {
    const rotate = setInterval(() => setBgIndex(i => (i + 1) % services.length), 8000);
    return () => clearInterval(rotate);
  }, [services.length]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <GestureControl>
        <Box sx={{ position: 'relative' }}>
          {/* Platform status badge */}
          <Chip
            label={`Platform ${apiStatus.isReachable ? 'Online' : 'Offline'}`}
            color={apiStatus.isReachable ? 'success' : 'error'}
            size="small"
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
          />
          <Section>
            <HeroBackgroundImage sx={{ backgroundImage: `url(${services[bgIndex].image})` }} />
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    {user && (
                      <Typography variant="h4" sx={{ color: theme.palette.secondary.main, mb: 2 }}>
                        Welcome back, {user.firstName || user.username}!
                      </Typography>
                    )}
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                        fontWeight: 'bold',
                        color: theme.palette.secondary.main,
                        mb: 3,
                      }}
                    >
                      Connect & Grow<br />
                      Your Trade Network
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        mb: 4,
                        fontWeight: 'normal',
                        maxWidth: '80%',
                      }}
                    >
                      Your professional platform for skilled trades, connecting experts, and growing businesses
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      {!user ? (
                        <>
                      <StyledButton
                        variant="contained"
                        sx={{
                          background: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          '&:hover': { background: theme.palette.secondary.dark }
                        }}
                        onClick={() => navigate('/register')}
                      >
                        Join Network
                      </StyledButton>
                      <StyledButton
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.secondary.main,
                          color: theme.palette.secondary.main,
                          borderWidth: 2,
                          '&:hover': {
                            borderColor: theme.palette.secondary.dark,
                            background: alpha(theme.palette.secondary.main, 0.1)
                          }
                        }}
                        onClick={() => navigate('/search')}
                      >
                        Explore Services
                      </StyledButton>
                        </>
                      ) : user.role === 'worker' ? (
                        <StyledButton
                          variant="contained"
                          sx={{
                            background: theme.palette.secondary.main,
                            color: theme.palette.secondary.contrastText,
                            '&:hover': { background: theme.palette.secondary.dark }
                          }}
                          onClick={() => navigate('/jobs')}
                        >
                          Find Jobs
                        </StyledButton>
                      ) : (
                        <StyledButton
                          variant="contained"
                          sx={{
                            background: theme.palette.secondary.main,
                            color: theme.palette.secondary.contrastText,
                            '&:hover': { background: theme.palette.secondary.dark }
                          }}
                          onClick={() => navigate('/hirer/jobs/post')}
                        >
                          Post a Job
                        </StyledButton>
                      )}
                    </Box>
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={4}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <Box sx={{ mt: { xs: 4, md: 12 } }}>
                      {features.map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                          <FeatureBox>
                            <FeatureCircle>{index + 1}</FeatureCircle>
                            <Typography color="white" variant="h6">
                              {feature}
                            </Typography>
                          </FeatureBox>
                        </motion.div>
                      ))}
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </Container>
            {/* Scroll down arrow */}
            <Box sx={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 10 }}
                transition={{ y: { repeat: Infinity, repeatType: 'reverse', duration: 1 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
              </motion.div>
            </Box>
          </Section>

          <Section id="services" sx={{ minHeight: 'auto', py: 12, background: '#111' }}>
            <Container maxWidth="lg">
              <Typography 
                variant="h2" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 8,
                  color: theme.palette.secondary.main,
                  fontWeight: 'bold'
                }}
              >
                Our Services
              </Typography>
              
              <Grid container spacing={4}>
                {services.map((service, index) => (
                  <Grid item xs={12} sm={6} md={3} key={service.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <ServiceCard>
                        <ServiceCardMedia
                          image={service.image}
                          title={service.title}
                        />
                        <ServiceCardContent>
                          <Typography gutterBottom variant="h5" component="div" color="white">
                            {service.title}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            {service.description}
                          </Typography>
                        </ServiceCardContent>
                      </ServiceCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Section>
        </Box>
      </GestureControl>
    </>
  );
};

export default HomePage; 
