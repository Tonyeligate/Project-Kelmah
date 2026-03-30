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
  const footerTextStrong = 'rgba(255,255,255,0.88)';
  const footerTextMedium = 'rgba(255,255,255,0.8)';
  const footerTextSoft = 'rgba(255,255,255,0.74)';

  const footerSections = [
    {
      title: 'For Workers',
      links: [
        { label: 'Find Work', href: '/jobs', intent: 'Browse available jobs' },
        {
          label: 'Create Profile',
          href: '/register',
          intent: 'Register as a worker or hirer',
        },
        {
          label: 'How Kelmah Works',
          href: '/support/help-center',
          intent: 'Learn how hiring and job applications work',
        },
        {
          label: 'Payments & Wallet',
          href: '/payments',
          intent: 'View payments, wallet, and transaction tools',
        },
        {
          label: 'Skills Assessment',
          href: '/worker/skills',
          intent: 'Take skills assessments and view progress',
        },
      ],
    },
    {
      title: 'For Hirers',
      links: [
        {
          label: 'Find Talent',
          href: '/search',
          intent: 'Search and discover skilled workers',
        },
        {
          label: 'Post a Job',
          href: '/hirer/jobs/post',
          intent: 'Create a new job posting',
        },
        {
          label: 'Hiring Guide',
          href: '/support/help-center',
          intent: 'Learn the step-by-step hiring process',
        },
        {
          label: 'Pricing',
          href: '/pricing',
          intent: 'Review premium and pricing options',
        },
        {
          label: 'Business Support',
          href: '/support',
          intent: 'Get help for teams and business workflows',
        },
      ],
    },
    {
      title: 'Resources',
      links: [
        {
          label: 'Help & Support',
          href: '/support',
          intent: 'Get support and troubleshooting help',
        },
        {
          label: 'Safety Centre',
          href: '/support/help-center',
          intent: 'Read safety guidance for workers and hirers',
        },
        {
          label: 'Community',
          href: '/community',
          intent: 'Explore community discussions and updates',
        },
        {
          label: 'Guides & Docs',
          href: '/docs',
          intent: 'Read guides and platform documentation',
        },
      ],
    },
    {
      title: 'Company',
      links: [
        {
          label: 'About Us',
          href: '/about',
          intent: 'Learn about Kelmah mission and values',
        },
        {
          label: 'Contact',
          href: '/contact',
          intent: 'Contact the Kelmah team',
        },
        {
          label: 'Privacy Policy',
          href: '/privacy',
          intent: 'Review privacy and data handling policy',
        },
        {
          label: 'Terms of Service',
          href: '/terms',
          intent: 'Review service terms and user responsibilities',
        },
        {
          label: 'Community Updates',
          href: '/community',
          intent: 'See community discussions, updates, and opportunities',
        },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: FacebookIcon,
      label: 'Facebook',
      href: sanitizeSocialUrl(
        import.meta.env.VITE_SOCIAL_FACEBOOK_URL ||
          'https://www.facebook.com/kelmah',
      ),
    },
    {
      icon: InstagramIcon,
      label: 'Instagram',
      href: sanitizeSocialUrl(
        import.meta.env.VITE_SOCIAL_INSTAGRAM_URL ||
          'https://www.instagram.com/kelmah',
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
    <Box component="footer" sx={{ width: '100%', flexShrink: 0 }}>
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
                        color: footerTextStrong,
                        p: 1,
                        '&:focus-visible': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        },
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
                      color: footerTextMedium,
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      '&:hover': { color: theme.palette.primary.main },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                        borderRadius: 2,
                      },
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
                      color: footerTextSoft,
                      lineHeight: 1.7,
                      maxWidth: 260,
                    }}
                  >
                    Your professional platform for skilled trades — connecting
                    experts and growing businesses across all 16 regions of
                    Ghana.
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
                          color: footerTextStrong,
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                          },
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
                      <EmailIcon
                        sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: footerTextSoft }}
                      >
                        {CONTACT.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon
                        sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: footerTextSoft }}
                      >
                        {CONTACT.phone}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationIcon
                        sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: footerTextSoft }}
                      >
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
                    sx={{
                      fontWeight: 700,
                      color: '#fff',
                      mb: 2,
                      fontSize: '0.9rem',
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Stack spacing={0.5}>
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        component={RouterLink}
                        to={link.href}
                        aria-label={`${link.label} - ${link.intent}`}
                        title={link.intent}
                        sx={{
                          color: 'rgba(255,255,255,0.74)',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          py: 0.6,
                          display: 'block',
                          transition: 'color 0.2s ease',
                          '&:hover': { color: theme.palette.primary.main },
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                            borderRadius: 2,
                          },
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
          <Divider
            sx={{
              mt: { xs: 2, md: 4 },
              mb: 1.5,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
          >
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.68)' }}
            >
              © {currentYear} Kelmah. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Link
                component={RouterLink}
                to="/privacy"
                aria-label="Privacy Policy - Review privacy and data handling policy"
                title="Review privacy and data handling policy"
                sx={{
                  color: 'rgba(255,255,255,0.68)',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'rgba(255,255,255,0.7)' },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                    borderRadius: 2,
                  },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                component={RouterLink}
                to="/terms"
                aria-label="Terms of Service - Review service terms and user responsibilities"
                title="Review service terms and user responsibilities"
                sx={{
                  color: 'rgba(255,255,255,0.68)',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { color: 'rgba(255,255,255,0.7)' },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                    borderRadius: 2,
                  },
                }}
              >
                Terms of Service
              </Link>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.68)' }}
                >
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
