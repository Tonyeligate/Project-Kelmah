import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Link,
  IconButton,
  useTheme,
  Stack,
  Divider,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { useBreakpointDown } from '@/hooks/useResponsive';

// Centralised contact info — update here when details change
const CONTACT = {
  email: 'support@kelmah.com',
  phone: '+233 24 123 4567',
  location: 'Accra, Ghana',
};

const sanitizeSocialUrl = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  return trimmed;
};

const Footer = () => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'For Workers',
      links: [
        { label: 'Find Work', href: '/jobs' },
        { label: 'Create Profile', href: '/register' },
        { label: 'How It Works', href: '/' },
        { label: 'Payments', href: '/payments' },
        { label: 'Skills Assessment', href: '/worker/skills' },
      ],
    },
    {
      title: 'For Hirers',
      links: [
        { label: 'Find Talent', href: '/search' },
        { label: 'Post a Job', href: '/hirer/jobs/post' },
        { label: 'How It Works', href: '/' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Enterprise', href: '/support' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help & Support', href: '/support' },
        { label: 'Safety Centre', href: '/support/help-center' },
        { label: 'Community', href: '/community' },
        { label: 'Blog', href: '/docs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Careers', href: '/community' },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: FacebookIcon,
      label: 'Facebook',
      href: sanitizeSocialUrl(
        import.meta.env.VITE_SOCIAL_FACEBOOK_URL || 'https://www.facebook.com/kelmah',
      ),
    },
    {
      icon: InstagramIcon,
      label: 'Instagram',
      href: sanitizeSocialUrl(
        import.meta.env.VITE_SOCIAL_INSTAGRAM_URL || 'https://www.instagram.com/kelmah',
      ),
    },
    {
      icon: TwitterIcon,
      label: 'X',
      href: sanitizeSocialUrl(import.meta.env.VITE_SOCIAL_X_URL || ''),
    },
    {
      icon: LinkedInIcon,
      label: 'LinkedIn',
      href: sanitizeSocialUrl(import.meta.env.VITE_SOCIAL_LINKEDIN_URL || ''),
    },
  ].filter((social) => Boolean(social.href));

  return (
    <Box
      component="footer"
      sx={{ width: '100%', flexShrink: 0 }}
    >
      <Box
        sx={{
          py: { xs: 2.5, md: 6 },
          bgcolor: theme.palette.mode === 'dark' ? '#0A0B10' : '#1a1a2e',
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <Container maxWidth="lg">
          {isMobile ? (
            /* ─── Mobile: Minimal footer like freelancer.com ─── */
            <Box>
              {/* Brand + socials — single compact row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2.5 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.primary.main,
                    fontFamily: '"Montserrat", sans-serif',
                  }}
                >
                  Kelmah
                </Typography>
                <Stack direction="row" spacing={1}>
                  {socialLinks.map((social) => (
                    <IconButton
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.6)',
                        p: 1,
                      }}
                    >
                      <social.icon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ))}
                </Stack>
              </Stack>

              {/* Key links — single compact row of the most important links */}
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 2 }}
              >
                {[
                  { label: 'Find Work', href: '/jobs' },
                  { label: 'Find Talent', href: '/search' },
                  { label: 'Help', href: '/support' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ].map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.href}
                    sx={{
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      '&:hover': { color: theme.palette.primary.main },
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Box>
          ) : (
            /* ─── Desktop: Grid layout ─── */
            <Grid container spacing={4}>
              <Grid item xs={12} md={3.5}>
                <Stack spacing={2}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: theme.palette.primary.main,
                      fontFamily: '"Montserrat", sans-serif',
                    }}
                  >
                    Kelmah
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.55)',
                      lineHeight: 1.7,
                      maxWidth: 260,
                    }}
                  >
                    Your professional platform for skilled trades — connecting experts
                    and growing businesses across all 16 regions of Ghana.
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    {socialLinks.map((social) => (
                      <IconButton
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.6)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            color: theme.palette.primary.main,
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <social.icon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ))}
                  </Stack>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EmailIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {CONTACT.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {CONTACT.phone}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {CONTACT.location}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>

              {footerSections.map((section) => (
                <Grid key={section.title} item xs={6} sm={3} md={2.125}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: '#fff', mb: 2, fontSize: '0.9rem' }}
                  >
                    {section.title}
                  </Typography>
                  <Stack spacing={0.5}>
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        component={RouterLink}
                        to={link.href}
                        sx={{
                          color: 'rgba(255,255,255,0.5)',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          py: 0.6,
                          display: 'block',
                          transition: 'color 0.2s ease',
                          '&:hover': { color: theme.palette.primary.main },
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Bottom bar */}
          <Divider sx={{ mt: { xs: 2, md: 4 }, mb: 1.5, borderColor: 'rgba(255,255,255,0.08)' }} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © {currentYear} Kelmah. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Link
                component={RouterLink}
                to="/privacy"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'rgba(255,255,255,0.7)' },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                component={RouterLink}
                to="/terms"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'rgba(255,255,255,0.7)' },
                }}
              >
                Terms of Service
              </Link>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Made with ❤️ in Ghana
                </Typography>
                <Box
                  sx={{
                    width: 20,
                    height: 14,
                    background:
                      'linear-gradient(to bottom, #CE1126 33%, #FCD116 33%, #FCD116 66%, #006B3F 66%)',
                    borderRadius: '2px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
