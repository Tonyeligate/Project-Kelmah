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
  useTheme,
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
import { useNavigate } from 'react-router-dom';
import {
  checkServiceHealth,
  getServiceStatusMessage,
} from '../../../utils/serviceHealthCheck';
import { BRAND_COLORS } from '../../../theme';

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

const quickActions = (navigate) => [
  {
    title: 'Open Support Ticket',
    description: 'Submit detailed requests and track responses in one place.',
    icon: SupportAgentIcon,
    onClick: () => navigate('/messages?tab=support'),
    chip: 'SLA 8h',
  },
  {
    title: 'Live Knowledge Base',
    description: 'Browse deployment, payments, and verification guides.',
    icon: LiveHelpIcon,
    onClick: () => navigate('/docs?category=support'),
    chip: 'Updated hourly',
  },
  {
    title: 'Community Forum',
    description: 'Learn from 4,000+ hirers and technicians across Ghana.',
    icon: ForumIcon,
    onClick: () => navigate('/community'),
    chip: 'Beta',
  },
];

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
      'Use the Trust & Safety lane with subject “URGENT CONTRACT”. This bypasses normal queues and notifies the on-call operations specialist.',
  },
];

const HelpCenterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState({
    status: 'checking',
    message: 'Checking live system status…',
    action: 'Please hold while we confirm every service.',
  });

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
            ? 'rgba(255,215,0,0.12)'
            : 'rgba(46,125,50,0.12)',
      },
      cold: {
        label: 'Warming Up',
        textColor: '#ef6c00',
        bg: 'rgba(255,152,0,0.15)',
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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? BRAND_COLORS.blackDark
            : theme.palette.grey[50],
        pt: { xs: 10, md: 14 },
        pb: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackMedium} 100%)`
                : `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`,
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.common.white
                : BRAND_COLORS.black,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 20px 45px rgba(0,0,0,0.65)'
                : '0 25px 55px rgba(0,0,0,0.15)',
            mb: 6,
          }}
        >
          <Stack spacing={3}>
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
              <Typography variant="h3" fontWeight={800} gutterBottom>
                Help Center & Status Desk
              </Typography>
              <Typography variant="h6" maxWidth="720px">
                Reach the Kelmah support pod, open priority tickets, and review
                live service status without leaving the marketplace.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/messages?tab=support')}
                endIcon={<ArrowForwardIcon />}
              >
                Contact Support
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/docs?category=support')}
              >
                View Documentation
              </Button>
            </Stack>
            <Typography variant="body2">
              {healthStatus.message} · {healthStatus.action}
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={3} mb={4}>
          {quickActions(navigate).map((action) => (
            <Grid item xs={12} md={4} key={action.title}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 10px 35px rgba(0,0,0,0.07)',
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
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
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Popular Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
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
            <Stack spacing={3} height="100%">
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
                        sx={{ alignSelf: 'flex-start' }}
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
      </Container>
    </Box>
  );
};

export default HelpCenterPage;
