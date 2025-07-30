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
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  useEffect(() => {
    let scrollTimeout;
    
    const checkScrollPosition = () => {
      // Clear any existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // Use a small delay to debounce scroll events
      scrollTimeout = setTimeout(() => {
        // ANALYTICAL DEBUG - Let's see EVERYTHING
        const docElement = document.documentElement;
        const body = document.body;
        const mainElement = document.querySelector('main');
        
        // Check BOTH document scroll AND main element scroll
        const docScrollHeight = Math.max(docElement.scrollHeight, body.scrollHeight);
        const docScrollTop = Math.max(docElement.scrollTop, body.scrollTop, window.pageYOffset);
        const docClientHeight = Math.max(docElement.clientHeight, window.innerHeight);
        
        // Check main element scroll (this might be where the real scrolling happens)
        const mainScrollHeight = mainElement ? mainElement.scrollHeight : 0;
        const mainScrollTop = mainElement ? mainElement.scrollTop : 0;
        const mainClientHeight = mainElement ? mainElement.clientHeight : 0;
        
        // Use whichever scroll container has actual scrolling
        const scrollHeight = Math.max(docScrollHeight, mainScrollHeight);
        const scrollTop = Math.max(docScrollTop, mainScrollTop);
        const clientHeight = Math.max(docClientHeight, mainClientHeight);
        
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        const isNearBottom = distanceFromBottom <= 150;
        
        // COMPREHENSIVE DEBUG LOG
        console.log('🔍 FOOTER ANALYSIS:', {
          '📏 DOC SCROLL': {
            docScrollHeight,
            docScrollTop,
            docClientHeight,
          },
          '🎯 MAIN SCROLL': {
            mainScrollHeight,
            mainScrollTop,
            mainClientHeight,
            mainExists: !!mainElement,
          },
          '🔥 FINAL VALUES': {
            scrollHeight,
            scrollTop,
            clientHeight,
            distanceFromBottom,
            isNearBottom,
          },
          '✅ DETECTION': {
            hasUserScrolled,
            hasScrollableContent: scrollHeight > clientHeight + 100,
          }
        });
        
        // Track if user has scrolled at all
        if (scrollTop > 20 && !hasUserScrolled) {
          setHasUserScrolled(true);
          console.log('✅ User started scrolling!');
        }
        
        const shouldShowFooter = hasUserScrolled && isNearBottom;
        const hasScrollableContent = scrollHeight > clientHeight + 100;
        const finalShouldShow = shouldShowFooter && hasScrollableContent;
        
        console.log('🎭 FOOTER DECISION:', {
          shouldShowFooter,
          hasScrollableContent,
          finalShouldShow,
          currentFooterState: showFooter
        });
        
        setShowFooter(finalShouldShow);
      }, 50);
    };

    // Add scroll listeners to ALL possible scroll containers
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    document.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });
    
    // CRITICAL: Also listen to the main element scroll (this is likely where the real scrolling happens)
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', checkScrollPosition, { passive: true });
    }
    
    // Listen to the parent layout container too
    const layoutContainer = document.querySelector('[data-testid="layout-container"], .MuiBox-root');
    if (layoutContainer) {
      layoutContainer.addEventListener('scroll', checkScrollPosition, { passive: true });
    }
    
    // Initial check after a delay to ensure page is loaded
    const initialTimeout = setTimeout(checkScrollPosition, 1000);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      document.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      if (mainElement) {
        mainElement.removeEventListener('scroll', checkScrollPosition);
      }
      if (layoutContainer) {
        layoutContainer.removeEventListener('scroll', checkScrollPosition);
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  }, [hasUserScrolled]);

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
