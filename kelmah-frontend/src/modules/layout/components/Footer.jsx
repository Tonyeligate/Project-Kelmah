import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Link,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const currentYear = new Date().getFullYear();
  const [showFooter, setShowFooter] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    let scrollTimeout;
    
    const checkScrollPosition = () => {
      // Clear any existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // Use a small delay to debounce scroll events
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Mark that user has scrolled at least once
        if (scrollTop > 100 && !hasUserScrolled) {
          setHasUserScrolled(true);
        }
        
        // Check if user is near the bottom of the page
        const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
        const shouldShow = distanceFromBottom <= 150 && hasUserScrolled; // Show when within 150px of bottom
        
        setShowFooter(shouldShow);
      }, 50); // 50ms debounce
    };

    // Add scroll listener
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    // Check initial position
    checkScrollPosition();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [hasUserScrolled]);

  // Don't render if footer shouldn't be shown
  if (!showFooter) {
    return null;
  }

  const footerSections = [
    {
      title: 'For Workers',
      links: [
        { label: 'Find Work', href: '/search/location' },
        { label: 'Create Profile', href: '/profile' },
        { label: 'Payment Settings', href: '/settings/payments' },
        { label: 'Resources', href: '/resources/workers' },
      ],
    },
    {
      title: 'For Hirers',
      links: [
        { label: 'Find Talent', href: '/find-talent' },
        { label: 'Post a Job', href: '/post-job' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Resources', href: '/resources/hirers' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FacebookIcon, color: '#1877F2', label: 'Facebook', href: '#' },
    { icon: TwitterIcon, color: '#1DA1F2', label: 'Twitter', href: '#' },
    { icon: LinkedInIcon, color: '#0A66C2', label: 'LinkedIn', href: '#' },
    { icon: InstagramIcon, color: '#E4405F', label: 'Instagram', href: '#' },
  ];

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
            py: { xs: 2, sm: 3 },
            backgroundColor: 'rgba(25, 25, 25, 0.98)',
            backdropFilter: 'blur(25px)',
            borderTop: '3px solid rgba(255, 215, 0, 0.5)',
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.8)',
            background: 'linear-gradient(135deg, rgba(25, 25, 25, 0.98) 0%, rgba(35, 35, 35, 0.95) 100%)',
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
          <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2 } }}>
            {/* Mobile Accordion Layout */}
            {isMobile ? (
              <Box>
                {/* Mobile Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Typography
                      variant="h5"
              sx={{
                        fontWeight: 800,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.warning.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
              }}
            >
              KELMAH
            </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ textAlign: 'center', px: 2, lineHeight: 1.5 }}
                    >
                      Ghana's premier platform for skilled trades
            </Typography>
                  </Stack>
                </motion.div>

                {/* Mobile Social Icons */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Stack direction="row" spacing={1}>
                      {socialLinks.map((social) => (
              <IconButton
                          key={social.label}
                          size="large"
                          href={social.href}
                sx={{
                            background: `rgba(${
                              social.color === '#1877F2' ? '24,119,242' : 
                              social.color === '#1DA1F2' ? '29,161,242' : 
                              social.color === '#0A66C2' ? '10,102,194' : 
                              '228,64,95'
                            }, 0.1)`,
                            color: social.color,
                            border: `1px solid rgba(${
                              social.color === '#1877F2' ? '24,119,242' : 
                              social.color === '#1DA1F2' ? '29,161,242' : 
                              social.color === '#0A66C2' ? '10,102,194' : 
                              '228,64,95'
                            }, 0.2)`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: social.color,
                              color: '#fff',
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px rgba(${
                                social.color === '#1877F2' ? '24,119,242' : 
                                social.color === '#1DA1F2' ? '29,161,242' : 
                                social.color === '#0A66C2' ? '10,102,194' : 
                                '228,64,95'
                              }, 0.3)`,
                            },
                          }}
                        >
                          <social.icon sx={{ fontSize: 20 }} />
              </IconButton>
                      ))}
                    </Stack>
                  </Box>
                </motion.div>

                {/* Mobile Accordion Sections */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {footerSections.map((section, index) => (
                    <Accordion
                      key={section.title}
                      expanded={expandedSection === index}
                      onChange={() => setExpandedSection(expandedSection === index ? null : index)}
                sx={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,215,0,0.1)',
                        borderRadius: 2,
                        mb: 1,
                        '&:before': { display: 'none' },
                        '&.Mui-expanded': {
                          margin: '0 0 8px 0',
                          background: 'rgba(255,215,0,0.05)',
                          border: '1px solid rgba(255,215,0,0.2)',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#FFD700' }} />}
                sx={{
                          minHeight: 48,
                          '&.Mui-expanded': { minHeight: 48 },
                          '& .MuiAccordionSummary-content': {
                            margin: '8px 0',
                            '&.Mui-expanded': { margin: '8px 0' },
                          },
                        }}
                      >
            <Typography
              variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: expandedSection === index ? '#FFD700' : 'text.primary',
                            transition: 'color 0.3s ease',
                          }}
                        >
                          {section.title}
            </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                        <Stack spacing={1.5}>
                          {section.links.map((link) => (
            <Link
                              key={link.label}
              component={RouterLink}
                              to={link.href}
                              sx={{
                                color: 'text.secondary',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  color: '#FFD700',
                                  background: 'rgba(255,215,0,0.1)',
                                  transform: 'translateX(4px)',
                                },
                              }}
                            >
                              {link.label}
            </Link>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </motion.div>

                {/* Mobile Contact Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Divider sx={{ my: 3, borderColor: 'rgba(255,215,0,0.2)' }} />
                  <Stack spacing={2} alignItems="center">
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#FFD700',
                        textAlign: 'center',
                      }}
                    >
                      Get in Touch
                    </Typography>
                    <Stack spacing={1.5} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          support@kelmah.com
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          +233 24 123 4567
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          Accra, Ghana
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </motion.div>
              </Box>
            ) : (
              /* Desktop Grid Layout */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Grid container spacing={{ sm: 3, md: 4 }}>
                  {/* Company Info Column */}
          <Grid item xs={12} sm={6} md={3}>
                    <Stack spacing={2}>
            <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.warning.main})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 1,
                        }}
                      >
                        KELMAH
            </Typography>
                      <Typography 
                        variant="body2" 
              color="text.secondary"
                        sx={{ lineHeight: 1.6, maxWidth: 280 }}
                      >
                        Your professional platform for skilled trades, connecting experts,
                        and growing businesses across Ghana.
                      </Typography>
                      
                      {/* Enhanced Social Icons */}
                      <Box sx={{ mt: 2 }}>
                        <Typography 
                          variant="caption" 
              color="text.secondary"
                          sx={{ fontWeight: 600, mb: 1, display: 'block' }}
                        >
                          FOLLOW US
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {socialLinks.map((social) => (
                            <IconButton
                              key={social.label}
                              size="medium"
                              href={social.href}
                              sx={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'text.secondary',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  background: social.color,
                                  color: '#fff',
                                  transform: 'translateY(-2px) scale(1.05)',
                                  boxShadow: `0 8px 25px rgba(${
                                    social.color === '#1877F2' ? '24,119,242' : 
                                    social.color === '#1DA1F2' ? '29,161,242' : 
                                    social.color === '#0A66C2' ? '10,102,194' : 
                                    '228,64,95'
                                  }, 0.4)`,
                                  border: `1px solid ${social.color}`,
                                },
                              }}
                            >
                              <social.icon sx={{ fontSize: 20 }} />
                            </IconButton>
                          ))}
                        </Stack>
                      </Box>
                      
                      {/* Contact Info */}
                      <Box sx={{ mt: 3 }}>
                        <Typography 
                          variant="caption" 
              color="text.secondary"
                          sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}
                        >
                          CONTACT INFO
                        </Typography>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                              support@kelmah.com
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                              +233 24 123 4567
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
          </Grid>

                  {/* Dynamic Sections */}
                  {footerSections.map((section) => (
                    <Grid key={section.title} item xs={12} sm={6} md={3}>
                      <Stack spacing={2}>
            <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#FFD700',
                            fontSize: { sm: '1.1rem', md: '1.2rem' },
                            mb: 1,
                          }}
                        >
                          {section.title}
            </Typography>
                        <Stack spacing={1}>
                          {section.links.map((link) => (
            <Link
                              key={link.label}
              component={RouterLink}
                              to={link.href}
                              sx={{
                                color: 'text.secondary',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'block',
                                '&:hover': {
                                  color: '#FFD700',
                                  background: 'rgba(255,215,0,0.08)',
                                  transform: 'translateX(4px)',
                                  paddingLeft: 1.5,
                                },
                              }}
                            >
                              {link.label}
            </Link>
                          ))}
                        </Stack>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}

            {/* Enhanced Copyright Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Divider 
                sx={{ 
                  mt: { xs: 3, sm: 4 }, 
                  mb: { xs: 2, sm: 3 },
                  borderColor: 'rgba(255,215,0,0.2)' 
                }} 
              />
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems="center"
                spacing={{ xs: 2, sm: 1 }}
              >
                <Typography 
                  variant="body2" 
              color="text.secondary"
          sx={{
                    textAlign: { xs: 'center', sm: 'left' },
                    fontWeight: 500,
          }}
        >
            © {currentYear} Kelmah. All rights reserved.
          </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Made with ❤️ in Ghana
                  </Typography>
                  <Box
                    sx={{
                      width: 24,
                      height: 16,
                      background: 'linear-gradient(to bottom, #CE1126 33%, #FCD116 33%, #FCD116 66%, #006B3F 66%)',
                      borderRadius: 0.5,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </Stack>
              </Stack>
            </motion.div>
          </Container>
        </Box>
    </Box>
    </Slide>
  );
};

export default Footer;