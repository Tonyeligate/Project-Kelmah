import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Grid, CircularProgress, Card, CardMedia, CardContent } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { styled } from '@mui/material/styles';
import LoadingScreen from '../components/loading/LoadingScreen';
import GestureControl from '../components/controls/GestureControl';
import WorkAnimation from '../components/animations/WorkAnimation';
import { useNavigate } from 'react-router-dom';
import { checkApiHealth } from '../utils/apiUtils';
import backgroundImg from '../assets/images/background.jpg';
import plumbingImg from '../assets/images/plumbing.jpg.jpeg';
import electricalImg from '../assets/images/electrical.jpg';
import carpentryImg from '../assets/images/carpentry.jpg';
import constructionImg from '../assets/images/construction.jpg';

const Section = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.background.default,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, 
      rgba(255, 215, 0, 0.05) 0%, 
      rgba(26, 26, 26, 0.2) 100%
    )`,
    zIndex: 0,
  },
}));

const HeroBackgroundImage = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `url(${backgroundImg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.4,
  zIndex: -1,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)',
    zIndex: 0,
  }
}));

const GlassCard = styled(Box)(({ theme }) => ({
  background: 'rgba(44, 44, 44, 0.2)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 215, 0, 0.1)',
  padding: theme.spacing(4),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.1)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: `${theme.spacing(1.5)} ${theme.spacing(4)}`,
  fontSize: '1.1rem',
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
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

const Home = () => {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState({ isReachable: true, checking: false });
  const [isLoading, setIsLoading] = useState(true);

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
        const isReachable = await checkApiHealth(false);
        
        // Only update state if the reachability changed
        setApiStatus(prev => {
          if (prev.isReachable !== isReachable) {
            return { isReachable, checking: false };
          }
          return prev;
        });
      } catch (error) {
        // This shouldn't happen with our improved error handling
        setApiStatus({ isReachable: false, checking: false });
      }
    };
    
    // Initial check without showing loading state
    checkApiStatus();
    
    // We don't need an interval here since OfflineBanner handles periodic checks
    // This reduces duplicate API calls
  }, []);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <GestureControl>
        <Box>
          <Section>
            <HeroBackgroundImage />
            <Box sx={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%',
              zIndex: 1,
            }}>
              <WorkAnimation />
            </Box>
            <Container 
              maxWidth="lg" 
              sx={{ 
                position: 'relative', 
                zIndex: 2,
              }}
            >
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={7}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 3,
                      }}
                    >
                      Connect & Grow Your Trade Network
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        mb: 4,
                        fontWeight: 'normal',
                      }}
                    >
                      Your professional platform for skilled trades, connecting experts, and growing businesses
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <StyledButton
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                          color: '#000',
                        }}
                        onClick={() => navigate('/register')}
                      >
                        Join Network
                      </StyledButton>
                      <StyledButton
                        variant="outlined"
                        sx={{
                          borderColor: '#FFD700',
                          color: '#FFD700',
                        }}
                        onClick={() => navigate('/find-work')}
                      >
                        Explore Services
                      </StyledButton>
                    </Box>
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={5}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <GlassCard>
                      <Grid container spacing={3}>
                        {['Verified Professionals', 'Secure Payments', 'Quality Assurance'].map((feature, index) => (
                          <Grid item xs={12} key={feature}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#000',
                                  fontWeight: 'bold',
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography variant="h6" sx={{ color: '#FFD700' }}>
                                {feature}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </GlassCard>
                  </motion.div>
                </Grid>
              </Grid>
            </Container>
          </Section>

          <Section>
            <Container sx={{ position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    textAlign: 'center',
                    mb: 6,
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Professional Services
                </Typography>
                <Grid container spacing={4}>
                  {['Plumbing', 'Electrical', 'Carpentry', 'HVAC', 'Masonry', 'Painting'].map((service, index) => (
                    <Grid item xs={12} sm={6} md={4} key={service}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <GlassCard>
                          <Typography variant="h5" sx={{ color: '#FFD700', mb: 2 }}>
                            {service}
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Connect with verified {service.toLowerCase()} professionals
                          </Typography>
                        </GlassCard>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Container>
          </Section>

          <Section id="trades-section">
            <Container sx={{ position: 'relative', zIndex: 1, py: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    textAlign: 'center',
                    mb: 6,
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Featured Trades
                </Typography>
                
                <Grid container spacing={4}>
                  {[
                    { title: 'Plumbing Services', image: plumbingImg, description: 'Professional plumbing solutions for residential and commercial properties' },
                    { title: 'Electrical Work', image: electricalImg, description: 'Licensed electricians for all your electrical needs and installations' },
                    { title: 'Carpentry Expertise', image: carpentryImg, description: 'Skilled carpenters crafting quality woodwork and structures' },
                    { title: 'Construction Projects', image: constructionImg, description: 'Full-service construction and renovation projects' },
                  ].map((service, index) => (
                    <Grid item xs={12} sm={6} md={3} key={service.title}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <ServiceCard>
                          <ServiceCardMedia
                            component="img"
                            image={service.image}
                            alt={service.title}
                          />
                          <ServiceCardContent>
                            <Typography variant="h6" component="div" sx={{ color: '#FFD700', mb: 1 }}>
                              {service.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {service.description}
                            </Typography>
                          </ServiceCardContent>
                        </ServiceCard>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Container>
          </Section>
        </Box>
      </GestureControl>
    </>
  );
};

export default Home;