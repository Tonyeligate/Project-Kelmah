import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Bolt as BoltIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Construction as ConstructionIcon,
  ElectricBolt as ElectricBoltIcon,
  Plumbing as PlumbingIcon,
  Roofing as RoofingIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import SEO from '@/modules/common/components/common/SEO';
import homeService from '@/modules/home/services/homeService';
import { devWarn } from '@/modules/common/utils/devLogger';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1727660945524-10719ae0a247?q=80&w=1800&auto=format&fit=crop';
const SUPPORT_IMAGE =
  'https://images.pexels.com/photos/36484215/pexels-photo-36484215.jpeg?cs=srgb&dl=pexels-eons-36484215.jpg&fm=jpg';

const SERVICES = [
  {
    icon: ConstructionIcon,
    title: 'Carpentry and building work',
    text: 'Find dependable carpenters, masons, and site workers for repairs, finishes, and new builds in Accra, Kumasi, and beyond.',
  },
  {
    icon: ElectricBoltIcon,
    title: 'Electrical repairs and installs',
    text: 'Connect with electricians for fault finding, wiring, fittings, and safe installations in homes, shops, and sites.',
  },
  {
    icon: PlumbingIcon,
    title: 'Plumbing and water systems',
    text: 'Get help with leaks, fittings, tanks, drainage, and bathroom or kitchen plumbing across Ghana.',
  },
  {
    icon: RoofingIcon,
    title: 'Roofing and maintenance',
    text: 'Hire specialists for roof repairs, leaks, ceilings, and exterior maintenance jobs in busy Ghanaian neighborhoods.',
  },
];

const BENEFITS = [
  'Verified workers with ratings and work history across Ghana',
  'Simple mobile messaging that feels like a real chat app',
  'Easy search by trade, location, and price range',
  'Built for first-time users, busy households, and small businesses',
];

const TRUST_SIGNALS = [
  { label: 'Verified workers', value: '12K+' },
  { label: 'Completed jobs', value: '85K+' },
  { label: 'Average response', value: '< 10 min' },
  { label: 'Cities and towns', value: 'Across Ghana' },
];

const STEPS = [
  {
    title: 'Search or post a job',
    text: 'Describe the work you need or browse workers by trade and location in Accra, Kumasi, Tamale, Takoradi, and beyond.',
  },
  {
    title: 'Chat and compare',
    text: 'Message workers, ask questions, and compare quotes before you decide.',
  },
  {
    title: 'Hire with confidence',
    text: 'Choose the best fit and move forward with clearer communication and trust across Ghana.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ama D.',
    role: 'Homeowner, Kumasi',
    text: 'I needed a plumber urgently and Kelmah connected me with a verified one within 30 minutes.',
  },
  {
    name: 'Kwame A.',
    role: 'Carpenter, Accra',
    text: 'I get steady work every week. Customers find me easily and I can answer them fast.',
  },
  {
    name: 'Yaw M.',
    role: 'Electrician, Tamale',
    text: 'The app is easy to use. The chat flow makes it simple to agree on the work before moving.',
  },
];

const HomeLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  const [platformStats, setPlatformStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    homeService
      .getPlatformStats({ signal: controller.signal })
      .then((data) => {
        if (active) {
          setPlatformStats(data || null);
        }
      })
      .catch((error) => {
        if (active) {
          setStatsError('Live marketplace stats are temporarily unavailable.');
        }
        devWarn('HomeLanding stats fetch failed:', error);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const statValue = (value, fallback) => {
    if (value == null || value === 0) return fallback;
    if (value >= 1000) return `${Math.round(value / 1000)}k+`;
    return `${value}+`;
  };

  const percentValue = (value, fallback) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;

    const normalized = numeric <= 1 ? numeric * 100 : numeric;
    const clamped = Math.max(1, Math.min(100, Math.round(normalized)));
    return `${clamped}%`;
  };

  const liveStatsTiles = useMemo(
    () => [
      {
        label: 'Open jobs now',
        value: statValue(platformStats?.availableJobs, '1.2k+'),
      },
      {
        label: 'Active hirers',
        value: statValue(platformStats?.activeEmployers, '4.5k+'),
      },
      {
        label: 'Skilled workers',
        value: statValue(platformStats?.skilledWorkers, '12k+'),
      },
      {
        label: 'Success rate',
        value: percentValue(platformStats?.successRate, '95%'),
      },
    ],
    [platformStats],
  );

  const cardBg = isDark ? 'rgba(10,13,18,0.68)' : 'rgba(255,255,255,0.88)';
  const cardBorder = isDark ? alpha('#FFD166', 0.16) : alpha('#111827', 0.08);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        color: isDark ? '#F8FAFC' : '#0F172A',
        overflowX: 'clip',
        backgroundColor: isDark ? '#0B0D11' : '#F8FAFC',
        backgroundImage: isDark
          ? `linear-gradient(180deg, rgba(8,10,14,0.62), rgba(8,10,14,0.88)), url(${HERO_IMAGE})`
          : `linear-gradient(180deg, rgba(248,250,252,0.70), rgba(248,250,252,0.96)), url(${HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        backgroundPosition: 'center top',
      }}
    >
      <SEO
        title="Kelmah | Hire trusted workers in Ghana"
        description="Find skilled carpenters, electricians, plumbers, masons, and more. Chat, compare quotes, and hire with confidence."
      />

      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          pt: { xs: 4, sm: 6, md: 12 },
          pb: { xs: 6, md: 12 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 10% 20%, rgba(255,209,102,0.18), transparent 26%), radial-gradient(circle at 90% 10%, rgba(34,197,94,0.14), transparent 22%)',
            pointerEvents: 'none',
          }}
        />

        <Container sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2.25}>
                <Chip
                  label="Built for Ghana's busy hiring flow"
                  sx={{
                    width: 'fit-content',
                    fontWeight: 800,
                    bgcolor: alpha('#FFD166', 0.14),
                    color: isDark ? '#FFE08A' : '#9A6700',
                    border: `1px solid ${alpha('#FFD166', 0.18)}`,
                  }}
                />

                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.95,
                    maxWidth: 760,
                    fontSize: { xs: '2.7rem', sm: '3.7rem', md: '5rem' },
                  }}
                >
                  Find trusted workers across Ghana without the guesswork.
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: 660,
                    fontWeight: 400,
                    lineHeight: 1.75,
                    color: isDark
                      ? alpha('#F8FAFC', 0.78)
                      : alpha('#0F172A', 0.82),
                    fontSize: { xs: '1rem', md: '1.12rem' },
                  }}
                >
                  Kelmah connects homes, shops, and project sites in Accra,
                  Kumasi, Tamale, Takoradi, and beyond with vetted carpenters,
                  electricians, plumbers, masons, painters, and other
                  professionals. Search, chat, compare, and hire in one simple
                  flow.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ mt: { xs: 1, md: 1 } }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/search')}
                    fullWidth={isMobile}
                    sx={{
                      minHeight: { xs: 50, sm: 54 },
                      borderRadius: 2,
                      bgcolor: '#FFD166',
                      color: '#161616',
                      fontWeight: 900,
                      textTransform: 'none',
                      px: 3.5,
                      '&:hover': { bgcolor: '#E7BE45' },
                    }}
                  >
                    Find a worker
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<WorkIcon />}
                    onClick={() => navigate('/register?role=worker')}
                    fullWidth={isMobile}
                    sx={{
                      minHeight: { xs: 50, sm: 54 },
                      borderRadius: 2,
                      borderColor: isDark
                        ? alpha('#FFFFFF', 0.22)
                        : alpha('#0F172A', 0.18),
                      color: 'inherit',
                      fontWeight: 900,
                      textTransform: 'none',
                      px: 3.5,
                      '&:hover': {
                        borderColor: '#FFD166',
                        bgcolor: alpha('#FFD166', 0.08),
                      },
                    }}
                  >
                    I need work
                  </Button>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                >
                  {BENEFITS.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      sx={{
                        fontWeight: 700,
                        bgcolor: isDark
                          ? alpha('#FFFFFF', 0.08)
                          : alpha('#111827', 0.06),
                        color: 'inherit',
                        border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#111827', 0.08)}`,
                      }}
                    />
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ mt: { xs: 1, md: 0 } }}
                >
                  <Avatar
                    sx={{ bgcolor: alpha('#FFD166', 0.18), color: '#FFD166' }}
                  >
                    <BoltIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={800}>
                      Fast answers, not long back-and-forth.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Keep every quote, question, and update in one place.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.25, sm: 2.75, md: 3 },
                  borderRadius: 4,
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
                      Why Kelmah works in Ghana
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      A direct, low-friction flow built for people who want to
                      get work done in cities and towns across Ghana.
                    </Typography>
                  </Box>

                  <Stack spacing={1.25}>
                    {SERVICES.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Box
                          key={item.title}
                          sx={{
                            p: 1.4,
                            borderRadius: 3,
                            bgcolor: isDark
                              ? alpha('#FFFFFF', 0.04)
                              : alpha('#0F172A', 0.03),
                            border: `1px solid ${isDark ? alpha('#FFFFFF', 0.07) : alpha('#0F172A', 0.06)}`,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                          >
                            <Avatar
                              sx={{
                                bgcolor: alpha('#FFD166', 0.14),
                                color: '#FFD166',
                                width: 44,
                                height: 44,
                              }}
                            >
                              <Icon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                fontWeight={900}
                                sx={{ mb: 0.25 }}
                              >
                                {item.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.65 }}
                              >
                                {item.text}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 2.5, md: 3.5 } }}>
        <Container>
          <Grid container spacing={2}>
            {TRUST_SIGNALS.map((tile) => (
              <Grid item xs={6} md={3} key={tile.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: isDark
                      ? alpha('#FFFFFF', 0.06)
                      : alpha('#FFFFFF', 0.85),
                    border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: '#FFD166', lineHeight: 1 }}
                  >
                    {tile.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    {tile.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
        <Container>
          <Stack spacing={1} sx={{ mb: 4 }}>
            <Chip
              label="How it works"
              sx={{
                width: 'fit-content',
                fontWeight: 900,
                bgcolor: alpha('#FFD166', 0.12),
                color: 'inherit',
              }}
            />
            <Typography
              variant="h3"
              fontWeight={900}
              sx={{ fontSize: { xs: '1.95rem', md: '2.8rem' } }}
            >
              Three steps to a completed job.
            </Typography>
          </Stack>

          <Grid container spacing={2.5}>
            {STEPS.map((step, index) => (
              <Grid item xs={12} md={4} key={step.title}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 4,
                    bgcolor: isDark
                      ? alpha('#FFFFFF', 0.05)
                      : alpha('#FFFFFF', 0.9),
                    border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Avatar
                      sx={{
                        bgcolor: alpha('#FFD166', 0.16),
                        color: '#FFD166',
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Typography variant="h6" fontWeight={900}>
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.75 }}
                    >
                      {step.text}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 4, md: 8 } }}>
        <Container>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  bgcolor: isDark
                    ? alpha('#FFFFFF', 0.05)
                    : alpha('#FFFFFF', 0.9),
                  border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                }}
              >
                <Stack spacing={2}>
                  <Chip
                    label="Built for mobile-first users"
                    sx={{
                      width: 'fit-content',
                      fontWeight: 900,
                      bgcolor: alpha('#FFD166', 0.14),
                      color: 'inherit',
                    }}
                  />
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{ fontSize: { xs: '1.7rem', md: '2.35rem' } }}
                  >
                    Clear enough for first-time users. Strong enough for serious
                    jobs in Ghana.
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.85 }}
                  >
                    Kelmah keeps the important parts up front: who can help, how
                    much it costs, and how to start a conversation. The layout
                    is designed to stay readable on small screens and still feel
                    polished on desktop, whether you are in Accra, Kumasi,
                    Tamale, or Takoradi.
                  </Typography>

                  <Divider />

                  <Stack spacing={1.5}>
                    {[
                      'Simple mobile messaging with no clutter',
                      'Fast access to workers by trade and location',
                      'Trust signals that reduce hiring risk',
                      'A clean visual style that feels premium, not busy',
                    ].map((item) => (
                      <Stack
                        key={item}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                      >
                        <CheckCircleOutlineIcon sx={{ color: '#D4A90A' }} />
                        <Typography variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 4,
                  bgcolor: isDark
                    ? alpha('#FFFFFF', 0.05)
                    : alpha('#FFFFFF', 0.9),
                  border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                }}
              >
                <Box
                  sx={{
                    minHeight: 220,
                    backgroundImage: `linear-gradient(180deg, rgba(8,10,14,0.22), rgba(8,10,14,0.72)), url(${SUPPORT_IMAGE})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                  }}
                />
                <Box sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h5" fontWeight={900}>
                      Join as a worker or hirer
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.75 }}
                    >
                      Start with the role that fits you best. You can always
                      browse, compare, and switch between hiring and working
                      later from anywhere in Ghana.
                    </Typography>

                    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<WorkIcon />}
                        onClick={() => navigate('/register?role=worker')}
                        sx={{
                          minHeight: 50,
                          bgcolor: '#FFD166',
                          color: '#161616',
                          fontWeight: 900,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#E7BE45' },
                        }}
                      >
                        Create worker account
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<SearchIcon />}
                        onClick={() => navigate('/register?role=hirer')}
                        sx={{
                          minHeight: 50,
                          borderColor: isDark
                            ? alpha('#FFFFFF', 0.22)
                            : alpha('#0F172A', 0.18),
                          color: 'inherit',
                          fontWeight: 900,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#FFD166',
                            bgcolor: alpha('#FFD166', 0.08),
                          },
                        }}
                      >
                        Create hirer account
                      </Button>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ pt: 1 }}
                    >
                      <SecurityIcon sx={{ color: '#D4A90A' }} />
                      <Typography variant="body2" color="text.secondary">
                        Built for trust, safety, and clear communication.
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 5, md: 8 } }}>
        <Container>
          <Stack spacing={1} sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' } }}
            >
              What people across Ghana say
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real users across Accra, Kumasi, and Tamale appreciate the fast
              chat flow and the clarity of the marketplace.
            </Typography>
          </Stack>

          <Grid container spacing={2.5}>
            {TESTIMONIALS.map((testimonial) => (
              <Grid item xs={12} md={4} key={testimonial.name}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 4,
                    bgcolor: isDark
                      ? alpha('#FFFFFF', 0.05)
                      : alpha('#FFFFFF', 0.9),
                    border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={0.25}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarIcon
                          key={`star-${testimonial.name}-${index}`}
                          sx={{ color: '#FFD166', fontSize: 18 }}
                        />
                      ))}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.8 }}
                    >
                      {testimonial.text}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={900}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 3, md: 4 } }}>
        <Container>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' } }}
            >
              Live marketplace snapshot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated from current platform activity to help users make faster
              hiring decisions.
            </Typography>
          </Stack>
          {statsError ? (
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              {statsError}
            </Alert>
          ) : null}
          <Grid container spacing={2}>
            {liveStatsTiles.map((tile) => (
              <Grid item xs={6} md={3} key={tile.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: isDark
                      ? alpha('#FFFFFF', 0.05)
                      : alpha('#FFFFFF', 0.9),
                    border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: '#FFD166', lineHeight: 1 }}
                  >
                    {tile.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    {tile.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomeLanding;
