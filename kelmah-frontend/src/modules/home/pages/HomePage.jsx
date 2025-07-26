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
import { useAuth } from '../../auth/contexts/AuthContext';
import { checkApiHealth } from '../../common/utils/apiUtils';
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
  // Ensure no horizontal scroll on small screens
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    left: 0,
    right: 0,
    marginLeft: 0,
    marginRight: 0,
  },
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
    background:
      'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 85%, #000 100%)',
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
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
  },
}));

const FeatureCircle = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.secondary.contrastText,
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
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '2px solid rgba(255, 215, 0, 0.2)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 215, 0, 0.6)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.1)',
    },
    '& .service-icon': {
      transform: 'rotate(360deg)',
    },
  },
}));

const ServiceCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 220,
  transition: 'transform 0.6s ease',
  position: 'relative',
}));

const ServiceCardContent = styled(CardContent)(({ theme }) => ({
  background:
    'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(44,44,44,0.6) 100%)',
  padding: theme.spacing(3),
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
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState({
    isReachable: true,
    checking: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [bgIndex, setBgIndex] = useState(0);

  // Enhanced services with proper vocational trade focus
  const services = [
    {
      title: 'Plumbing Services',
      description: 'Professional plumbing installations, repairs, and maintenance for homes and businesses',
      image: plumbingImg,
      icon: <PlumbingIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Pipe Installation', 'Leak Repairs', 'Drain Cleaning'],
    },
    {
      title: 'Electrical Work',
      description: 'Licensed electricians for wiring, installations, and electrical system maintenance',
      image: electricalImg,
      icon: <ElectricalServicesIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Wiring', 'Panel Upgrades', 'Lighting Installation'],
    },
    {
      title: 'Carpentry & Woodwork',
      description: 'Custom carpentry, furniture making, and wooden structure construction',
      image: carpentryImg,
      icon: <CarpenterIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Custom Furniture', 'Framing', 'Cabinet Making'],
    },
    {
      title: 'Construction & Masonry',
      description: 'Building construction, masonry work, and renovation projects',
      image: constructionImg,
      icon: <ConstructionIcon sx={{ color: '#000', fontSize: 24 }} />,
      skills: ['Foundation Work', 'Bricklaying', 'Concrete Work'],
    },
  ];

  const features = [
    {
      icon: <VerifiedIcon sx={{ fontSize: 28, color: '#000' }} />,
      title: 'Verified Skilled Workers',
      description: 'All tradespeople are vetted and verified for quality assurance'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 28, color: '#000' }} />,
      title: 'Secure Escrow Payments',
      description: 'Safe payment system protecting both workers and hirers'
    },
    {
      icon: <StarIcon sx={{ fontSize: 28, color: '#000' }} />,
      title: 'Quality Guarantee',
      description: 'Rating system ensuring high-quality workmanship'
    },
  ];

  // Control loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
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
      } catch (error) {
        console.warn('API check failed, continuing anyway:', error);
        setApiStatus({ isReachable: true, checking: false });
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
      <GestureControl>
        <Box sx={{ position: 'relative' }}>
          {/* Enhanced platform status badge */}
          <Chip
            label={`Platform ${apiStatus.isReachable ? 'Online' : 'Offline'}`}
            color={apiStatus.isReachable ? 'success' : 'error'}
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              zIndex: 2,
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
          
          <Section>
            <HeroBackgroundImage
              sx={{ backgroundImage: `url(${services[bgIndex].image})` }}
            />
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
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
                      variant={isSm ? 'h4' : 'h1'}
                      sx={{
                        fontSize: { xs: '2.2rem', sm: '3.8rem', md: '5rem' },
                        fontWeight: 800,
                        color: theme.palette.secondary.main,
                        mb: 3,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        lineHeight: 1.1,
                      }}
                    >
                      Ghana's Premier
                      <br />
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          background: 'linear-gradient(45deg, #FFD700 30%, #FFC000 90%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        Skilled Trades
                      </Typography>
                      {' '}Network
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        mb: 4,
                        fontWeight: 400,
                        maxWidth: '85%',
                        lineHeight: 1.4,
                        fontSize: { xs: '1.1rem', md: '1.3rem' },
                      }}
                    >
                      Connect with verified skilled workers across Ghana. 
                      From plumbing and electrical work to carpentry and construction - 
                      find the right professional for every job.
                    </Typography>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isSm ? 'column' : 'row',
                          gap: isSm ? 2 : 3,
                          mt: 5,
                      }}
                    >
                      {!user ? (
                        <>
                          <StyledButton
                            variant="contained"
                              size="large"
                            sx={{
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                px: 5,
                                py: 2,
                              '&:hover': {
                                  background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                              },
                            }}
                            fullWidth={isSm}
                            onClick={() => navigate('/register')}
                          >
                              {isSm ? 'Join Kelmah' : 'Join the Network'}
                          </StyledButton>
                          <StyledButton
                            variant="outlined"
                              size="large"
                            sx={{
                              borderColor: theme.palette.secondary.main,
                              color: theme.palette.secondary.main,
                                borderWidth: 3,
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                px: 5,
                                py: 2,
                              '&:hover': {
                                borderColor: theme.palette.secondary.dark,
                                  background: alpha(theme.palette.secondary.main, 0.15),
                                  borderWidth: 3,
                              },
                            }}
                            fullWidth={isSm}
                            onClick={() => navigate('/search')}
                          >
                              Find Workers
                          </StyledButton>
                        </>
                      ) : user.role === 'worker' ? (
                        <StyledButton
                          variant="contained"
                            size="large"
                          sx={{
                              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: '1.2rem',
                              px: 5,
                              py: 2,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                            },
                          }}
                          onClick={() => navigate('/jobs')}
                        >
                            Browse Available Jobs
                        </StyledButton>
                      ) : (
                        <StyledButton
                          variant="contained"
                            size="large"
                          sx={{
                              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              color: '#000',
                              fontWeight: 800,
                              fontSize: '1.2rem',
                              px: 5,
                              py: 2,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                            },
                          }}
                          onClick={() => navigate('/hirer/jobs/post')}
                        >
                          Post a Job
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
                    <Box sx={{ mt: { xs: 4, md: 8 } }}>
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
            </Container>
            
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
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
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

          {/* Enhanced Services Section */}
          <Section
            id="services"
            sx={{ minHeight: 'auto', py: 16, background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)' }}
          >
            <Container maxWidth="lg">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
              <Typography
                variant="h2"
                sx={{
                  textAlign: 'center',
                    mb: 3,
                  color: theme.palette.secondary.main,
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                  Trade Services Available
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    mb: 10,
                    color: 'rgba(255,255,255,0.8)',
                    maxWidth: 600,
                    mx: 'auto',
                    fontWeight: 400,
                  }}
                >
                  Professional skilled workers ready to tackle your projects with expertise and dedication
              </Typography>
              </motion.div>

              <Grid container spacing={4}>
                {services.map((service, index) => (
                  <Grid item xs={12} sm={6} md={3} key={service.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.15 }}
                    >
                      <ServiceCard>
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
                            variant="h5"
                            component="div"
                            color="white"
                            sx={{ fontWeight: 700, mb: 2 }}
                          >
                            {service.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="rgba(255,255,255,0.85)"
                            sx={{ mb: 2, lineHeight: 1.5 }}
                          >
                            {service.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                <Box sx={{ textAlign: 'center', mt: 12 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: 'white',
                      mb: 3,
                      fontWeight: 700,
                    }}
                  >
                    Ready to Get Started?
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      mb: 4,
                      maxWidth: 500,
                      mx: 'auto',
                    }}
                  >
                    Join thousands of skilled workers and satisfied customers on Ghana's leading trade platform
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <StyledButton
                      variant="contained"
                      size="large"
                      sx={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                        },
                      }}
                      onClick={() => navigate('/register')}
                    >
                      Join as a Worker
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: '#FFD700',
                        color: '#FFD700',
                        borderWidth: 2,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          background: alpha('#FFD700', 0.1),
                          borderWidth: 2,
                        },
                      }}
                      onClick={() => navigate('/find-talents')}
                    >
                      Hire Skilled Workers
                    </StyledButton>
                  </Box>
                </Box>
              </motion.div>
            </Container>
          </Section>
        </Box>
      </GestureControl>
    </>
  );
};

export default HomePage;
