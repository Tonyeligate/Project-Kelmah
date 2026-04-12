import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import ForumIcon from '@mui/icons-material/Forum';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  checkServiceHealth,
  getServiceStatusMessage,
} from '../../../utils/serviceHealthCheck';
import PageCanvas from '../../common/components/PageCanvas';
import { BRAND_COLORS } from '../../../theme';
import { Helmet } from 'react-helmet-async';
import { TOUCH_TARGET_MIN, Z_INDEX } from '@/constants/layout';
import { withBottomNavSafeArea, withSafeAreaBottom } from '@/utils/safeArea';

const contactChannels = [
  {
    title: 'Email Support',
    description: 'Guaranteed reply within 24 hours for all account questions.',
    icon: EmailIcon,
    action: () => (window.location.href = 'mailto:support@kelmah.com'),
    ctaLabel: 'Send Email',
  },
  {
    title: 'Priority Callback',
    description:
      'Speak with a Kelmah specialist for billing or security issues.',
    icon: PhoneIphoneIcon,
    action: () => (window.location.href = 'tel:+233201234567'),
    ctaLabel: 'Call Support',
  },
  {
    title: 'Trust & Safety',
    description: 'Report fraud, impersonation, or platform abuse immediately.',
    icon: AssignmentTurnedInIcon,
    action: () => (window.location.href = 'mailto:safety@kelmah.com'),
    ctaLabel: 'Report Issue',
  },
];

const quickActions = (navigate, mode) =>
  [
    {
      key: 'support',
      title: 'Open Support Ticket',
      description: 'Submit detailed requests and track responses in one place.',
      icon: SupportAgentIcon,
      onClick: () => navigate('/messages'),
      chip: 'SLA 8h',
    },
    {
      key: 'docs',
      title: 'Live Knowledge Base',
      description: 'Browse deployment, payments, and verification guides.',
      icon: LiveHelpIcon,
      onClick: () => navigate('/docs'),
      chip: 'Updated hourly',
    },
    {
      key: 'community',
      title: 'Community Forum',
      description: 'Learn from 4,000+ hirers and technicians across Ghana.',
      icon: ForumIcon,
      onClick: () => navigate('/community'),
      chip: 'Beta',
    },
  ].filter((action) => action.key !== mode);

const faqs = [
  {
    question: 'How long does it take to verify a worker profile?',
    answer:
      'Verification normally completes within 24 hours once ID, certifications, and work history are uploaded. You can track the checklist inside your dashboard → Profile → Verification.',
  },
  {
    question: 'Why does my dashboard show Service Unavailable errors?',
    answer:
      'Render microservices sometimes experience cold starts after inactivity. The system pings each service automatically, but you can also refresh once after 30 seconds. Visit Status History below for live uptime.',
  },
  {
    question: 'How do I reach Kelmah urgently for a contract dispute?',
    answer:
      'Use the Trust & Safety lane with subject "URGENT CONTRACT". This bypasses normal queues and notifies the on-call operations specialist.',
  },
];

const HelpCenterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState({
    status: 'checking',
    message: 'Checking live system status…',
    action: 'Please hold while we confirm every service.',
  });

  const supportMode = useMemo(() => {
    if (location.pathname === '/docs') return 'docs';
    if (location.pathname === '/community') return 'community';
    return 'support';
  }, [location.pathname]);

  const pageCopy = useMemo(() => {
    if (supportMode === 'docs') {
      return {
        title: 'Documentation Hub',
        subtitle:
          'Find support playbooks, setup guides, and troubleshooting references for the Kelmah platform.',
        primaryLabel: 'Open Help Center',
        primaryAction: () => navigate('/support/help-center'),
        secondaryLabel: 'Visit Community',
        secondaryAction: () => navigate('/community'),
      };
    }

    if (supportMode === 'community') {
      return {
        title: 'Community & Peer Support',
        subtitle:
          'Learn from other hirers and vocational workers, and follow practical community-tested workflows.',
        primaryLabel: 'Open Help Center',
        primaryAction: () => navigate('/support/help-center'),
        secondaryLabel: 'View Documentation',
        secondaryAction: () => navigate('/docs'),
      };
    }

    return {
      title: 'Help Center & Status Desk',
      subtitle:
        'Reach the Kelmah support pod, open priority tickets, and review live service status without leaving the marketplace.',
      primaryLabel: 'Chat with Support',
      primaryAction: () => navigate('/messages'),
      secondaryLabel: 'View Documentation',
      secondaryAction: () => navigate('/docs'),
    };
  }, [navigate, supportMode]);

  useEffect(() => {
    let isMounted = true;
    const evaluateHealth = async () => {
      setHealthStatus((prev) => ({ ...prev, status: 'checking' }));
      await checkServiceHealth('aggregate', 15000);
      const next = getServiceStatusMessage('aggregate');
      if (!isMounted) return;
      setHealthStatus(next);
    };

    evaluateHealth();
    const interval = setInterval(evaluateHealth, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const statusChip = useMemo(() => {
    const paletteMap = {
      healthy: {
        label: 'Operational',
        textColor:
          theme.palette.mode === 'dark' ? BRAND_COLORS.gold : '#2e7d32',
        bg:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.secondary.main, 0.12)
            : 'rgba(46,125,50,0.12)',
      },
      cold: {
        label: 'Warming Up',
        textColor: '#ef6c00',
        bg: alpha(theme.palette.warning.main, 0.15),
      },
      error: {
        label: 'Service Disruption',
        textColor: '#c62828',
        bg: 'rgba(244,67,54,0.12)',
      },
      unknown: {
        label: 'Status Unknown',
        textColor: theme.palette.text.primary,
        bg: 'rgba(158,158,158,0.2)',
      },
      checking: {
        label: 'Checking…',
        textColor: '#0288d1',
        bg: 'rgba(3,169,244,0.12)',
      },
    };

    return paletteMap[healthStatus.status] || paletteMap.unknown;
  }, [healthStatus.status, theme.palette.mode, theme.palette.text.primary]);

  return (
    <PageCanvas
      disableContainer
      sx={{
        pt: { xs: 1, md: 4 },
        pb: { xs: withBottomNavSafeArea(84), md: 6 },
        overflowX: 'clip',
      }}
    >
      <Box
        sx={{
          minHeight: '100dvh',
          pt: { xs: 4, md: 10 },
          width: '100%',
          minWidth: 0,
          overflowX: 'clip',
        }}
      >
        <Helmet>
          <title>Help Center | Kelmah</title>
        </Helmet>
        <Container
          maxWidth="lg"
          sx={{ px: { xs: 1.25, sm: 3 }, width: '100%', minWidth: 0 }}
        >
          <Box
            sx={{
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackMedium} 100%)`
                  : `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`,
              borderRadius: 4,
              p: { xs: 1.75, md: 5.5 },
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.common.white
                  : BRAND_COLORS.black,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 20px 45px rgba(0,0,0,0.65)'
                  : '0 25px 55px rgba(0,0,0,0.15)',
              mb: { xs: 1.75, md: 5 },
            }}
          >
            <Stack spacing={{ xs: 1.25, md: 2.5 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems="center"
              >
                <Chip
                  icon={<SupportAgentIcon />}
                  label="Kelmah Support"
                  sx={{
                    mr: { md: 'auto' },
                    fontWeight: 600,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    color:
                      theme.palette.mode === 'dark'
                        ? BRAND_COLORS.gold
                        : theme.palette.common.white,
                    '& .MuiSvgIcon-root': { color: 'inherit !important' },
                  }}
                />
                <Chip
                  icon={<CheckCircleIcon />}
                  label={statusChip.label}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: statusChip.bg,
                    color:
                      statusChip.textColor ||
                      (theme.palette.mode === 'dark'
                        ? BRAND_COLORS.gold
                        : theme.palette.text.primary),
                  }}
                />
              </Stack>
              <Box>
                <Typography
                  component="h1"
                  variant={isMobile ? 'h5' : 'h3'}
                  fontWeight={800}
                  gutterBottom
                >
                  {pageCopy.title}
                </Typography>
                <Typography
                  variant={isMobile ? 'body1' : 'h6'}
                  maxWidth="720px"
                >
                  {pageCopy.subtitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, opacity: 0.9, maxWidth: '720px' }}
                >
                  Quick steps: choose a channel, share your job or account
                  details, then watch for the reply time shown in-app.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={pageCopy.primaryAction}
                  aria-label={pageCopy.primaryLabel}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ minHeight: 44 }}
                >
                  {pageCopy.primaryLabel}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={pageCopy.secondaryAction}
                  aria-label={pageCopy.secondaryLabel}
                  sx={{ minHeight: 44 }}
                >
                  {pageCopy.secondaryLabel}
                </Button>
              </Stack>
              <Typography variant="body2">
                {healthStatus.message} · {healthStatus.action}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                For urgent fraud or account safety issues, use Trust and Safety
                for priority handling.
              </Typography>
            </Stack>
          </Box>

          <Grid container spacing={{ xs: 1.25, md: 3 }} mb={{ xs: 2, md: 4 }}>
            {quickActions(navigate, supportMode).map((action) => (
              <Grid item xs={12} md={4} key={action.title}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 10px 35px rgba(0,0,0,0.07)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack spacing={{ xs: 1.25, md: 2 }}>
                      <action.icon
                        sx={{
                          fontSize: 34,
                          color:
                            theme.palette.mode === 'dark'
                              ? BRAND_COLORS.gold
                              : BRAND_COLORS.black,
                        }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={action.chip}
                        size="small"
                        sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                      />
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button
                      onClick={action.onClick}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ minHeight: 44 }}
                    >
                      Open
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={{ xs: 1.5, md: 3 }} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Popular Questions
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Tap each topic to reveal the recommended fix or workflow.
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {faqs.map((faq) => (
                    <Accordion key={faq.question} disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={600}>{faq.question}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={{ xs: 1.5, md: 2.5 }} height="100%">
                {contactChannels.map((channel) => (
                  <Card key={channel.title} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <channel.icon
                            sx={{
                              fontSize: 32,
                              color:
                                theme.palette.mode === 'dark'
                                  ? BRAND_COLORS.gold
                                  : BRAND_COLORS.black,
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {channel.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {channel.description}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          variant="outlined"
                          onClick={channel.action}
                          aria-label={`Open ${channel.title}`}
                          sx={{ alignSelf: 'flex-start', minHeight: 44 }}
                        >
                          {channel.ctaLabel}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Paper
            elevation={8}
            sx={(muiTheme) => ({
              display: { xs: 'flex', sm: 'none' },
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: withBottomNavSafeArea(0),
              zIndex: Z_INDEX.stickyCta,
              px: 1.25,
              pt: 0.75,
              pb: withSafeAreaBottom(8),
              gap: 1,
              borderTop: `1px solid ${muiTheme.palette.divider}`,
              backgroundColor: muiTheme.palette.background.paper,
              boxShadow:
                muiTheme.palette.mode === 'dark'
                  ? '0 -8px 24px rgba(0, 0, 0, 0.4)'
                  : '0 -6px 18px rgba(16, 17, 19, 0.12)',
            })}
          >
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ minHeight: TOUCH_TARGET_MIN }}
              onClick={pageCopy.secondaryAction}
            >
              {pageCopy.secondaryLabel}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              sx={{
                minHeight: TOUCH_TARGET_MIN,
                boxShadow: '0 2px 8px rgba(255,215,0,0.35)',
              }}
              onClick={pageCopy.primaryAction}
              endIcon={<ArrowForwardIcon />}
            >
              {pageCopy.primaryLabel}
            </Button>
          </Paper>
        </Container>
      </Box>
    </PageCanvas>
  );
};

export default HelpCenterPage;
