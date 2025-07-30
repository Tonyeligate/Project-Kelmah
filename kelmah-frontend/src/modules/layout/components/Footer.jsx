import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Link,
  IconButton,
  useTheme,
  Slide,
  Fade,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Calculate if user has reached the EXACT bottom (within 10px for precision)
      const isAtActualBottom = scrollTop + windowHeight >= documentHeight - 10;
      
      // Only show footer when user has actually scrolled to the very bottom
      if (isAtActualBottom) {
        setIsAtBottom(true);
        setIsVisible(true);
      } else {
        setIsAtBottom(false);
        setIsVisible(false);
      }
    };

    // Throttle scroll events for better performance
    let timeoutId;
    const throttledHandleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 16); // ~60fps
    };

    // Add scroll event listener
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // Check initial position
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Don't render footer at all if not at bottom
  if (!isAtBottom) {
    return null;
  }

  return (
    <Slide direction="up" in={isVisible} timeout={500}>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300, // Higher z-index to ensure it appears above everything
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          // Ensure footer doesn't interfere when hidden
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <Box
          sx={{
            py: 3,
            backgroundColor: 'rgba(25, 25, 25, 0.98)',
            backdropFilter: 'blur(25px)',
            borderTop: '3px solid rgba(255, 215, 0, 0.5)',
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.8)',
            // Enhanced glassmorphism effect for popup
            background: 'linear-gradient(135deg, rgba(25, 25, 25, 0.98) 0%, rgba(35, 35, 35, 0.95) 100%)',
            // Add a subtle glow effect
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.6) 50%, transparent 100%)',
              animation: 'footerGlow 2s ease-in-out infinite alternate',
            },
            '@keyframes footerGlow': {
              '0%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }}
        >
          <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.warning.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KELMAH
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your professional platform for skilled trades, connecting experts,
              and growing businesses.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex' }}>
              <IconButton
                size="small"
                color="inherit"
                sx={{
                  mr: 1,
                  color: 'text.secondary',
                  '&:hover': { color: theme.palette.secondary.main },
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={{
                  mr: 1,
                  color: 'text.secondary',
                  '&:hover': { color: theme.palette.secondary.main },
                }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={{
                  mr: 1,
                  color: 'text.secondary',
                  '&:hover': { color: theme.palette.secondary.main },
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: theme.palette.secondary.main },
                }}
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="subtitle1"
              gutterBottom
              color="text.primary"
              fontWeight="bold"
            >
              For Workers
            </Typography>
            <Link
              component={RouterLink}
              to="/search/location"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Find Work
            </Link>
            <Link
              component={RouterLink}
              to="/profile"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Create Profile
            </Link>
            <Link
              component={RouterLink}
              to="/settings/payments"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Payment Settings
            </Link>
            <Link
              component={RouterLink}
              to="/resources/workers"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Resources
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="subtitle1"
              gutterBottom
              color="text.primary"
              fontWeight="bold"
            >
              For Hirers
            </Typography>
            <Link
              component={RouterLink}
              to="/find-talent"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Find Talent
            </Link>
            <Link
              component={RouterLink}
              to="/post-job"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Post a Job
            </Link>
            <Link
              component={RouterLink}
              to="/pricing"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Pricing
            </Link>
            <Link
              component={RouterLink}
              to="/resources/hirers"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Resources
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="subtitle1"
              gutterBottom
              color="text.primary"
              fontWeight="bold"
            >
              Company
            </Typography>
            <Link
              component={RouterLink}
              to="/about"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              About Us
            </Link>
            <Link
              component={RouterLink}
              to="/contact"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Contact
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Privacy Policy
            </Link>
            <Link
              component={RouterLink}
              to="/terms"
              color="text.secondary"
              display="block"
              sx={{ mb: 1, '&:hover': { color: theme.palette.secondary.main } }}
            >
              Terms of Service
            </Link>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 5,
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            © {currentYear} Kelmah. All rights reserved.
          </Typography>
        </Box>
          </Container>
        </Box>
      </Box>
    </Slide>
  );
};

export default Footer;
