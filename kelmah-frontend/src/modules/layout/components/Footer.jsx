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
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight;
      
      // Only show footer if:
      // 1. Page has enough content (scrollHeight > clientHeight + 200px)
      // 2. User has scrolled (scrollTop > 50px) 
      // 3. User is within 50px of the bottom
      const hasEnoughContent = scrollHeight > clientHeight + 200;
      const hasScrolled = scrollTop > 50;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      const shouldShowFooter = hasEnoughContent && hasScrolled && isNearBottom;
      
      setShowFooter(shouldShowFooter);
    };

    // Add scroll listener
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    // Delay initial check to ensure page is fully loaded
    const timeoutId = setTimeout(checkScrollPosition, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      clearTimeout(timeoutId);
    };
  }, []);

  // Don't render anything if footer shouldn't show
  if (!showFooter) {
    return null;
  }

  return (
    <Slide direction="up" in={showFooter} timeout={500}>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
