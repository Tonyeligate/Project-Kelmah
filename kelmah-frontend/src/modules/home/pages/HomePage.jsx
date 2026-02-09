import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar,
  Rating,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  Build as CarpenterIcon,
  Construction as MasonIcon,
  Plumbing as PlumberIcon,
  ElectricalServices as ElectricianIcon,
  Brush as PainterIcon,
  Roofing as RoofingIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  Work as WorkIcon,
  PersonSearch as FindTalentIcon,
  ChatBubbleOutline as ChatIcon,
  Payments as PaymentIcon,
  Speed as SpeedIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

/* =================================================================
 * DESIGN-SYSTEM PRIMITIVES
 *
 * Three reusable layout helpers used on this page and suitable for
 * extraction to src/components/common/ for reuse on other pages.
 *
 * Spacing scale (MUI 8 px base):
 *   0.5 = 4 px | 1 = 8 | 1.5 = 12 | 2 = 16 | 3 = 24 | 4 = 32
 *
 * Typography contract — only three levels on this page:
 *   H1  →  hero headline (variant="h2", component="h1")
 *   H2  →  section titles (variant="h4", component="h2")
 *   Body → everything else (body1 / body2)
 * ================================================================= */

/**
 * Reveal — scroll-triggered fade-in.
 * Wrap any block to animate on viewport entry.
 * Stagger siblings with `delay={index * 0.06}`.
 */
const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

/**
 * Section — consistent vertical rhythm and container width.
 *
 * Props
 *   alt  — subtle tinted background for visual separation
 *   sx   — MUI sx overrides (merged last, wins on conflict)
 *
 * Rhythm: xs → 48 px (py 6) | md → 80 px (py 10)
 *
 * Usage:
 *   <Section>…</Section>           default bg
 *   <Section alt>…</Section>       tinted bg
 *   <Section sx={{ py: 8 }}>…</Section>   override spacing
 */
const Section = ({ children, alt = false, sx: sxOverride, ...rest }) => {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: alt
          ? theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.02)
            : alpha(theme.palette.common.black, 0.02)
          : 'transparent',
        ...sxOverride,
      }}
      {...rest}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
};

/**
 * SectionHeader — consistent H2 heading + optional subtitle.
 *
 * Usage:
 *   <SectionHeader title="Browse by category" />
 *   <SectionHeader title="…" subtitle="…" align="center" />
 */
const SectionHeader = ({ title, subtitle, align = 'left' }) => (
  <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: align }}>
    <Typography
      variant="h4"
      component="h2"
      sx={{
        fontWeight: 700,
        fontSize: { xs: '1.5rem', md: '2rem' },
        lineHeight: 1.3,
        mb: subtitle ? 1.5 : 0,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          maxWidth: align === 'center' ? 520 : 480,
          mx: align === 'center' ? 'auto' : 0,
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

/* =================================================================
 * SHARED STYLE TOKENS — single source of truth for this page.
 * Keeps card / button styling identical across every section.
 * ================================================================= */
const CARD_SX = {
  p: 3,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'none',
  height: '100%',
};

const BTN_SX = {
  minHeight: 48,
  px: 4,
  borderRadius: 1.5,
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
};

/* =================================================================
 * PAGE SECTIONS
 * ================================================================= */

// ─── HERO ─────────────────────────────────────────────────
// Centered layout — works well without hero imagery.
// One primary action (search), dual CTAs beneath, compact trust bar.
const HeroSection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="section"
      sx={{ pt: { xs: 6, sm: 8, md: 10 }, pb: { xs: 6, sm: 8, md: 10 }, textAlign: 'center' }}
    >
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* H1 — hero headline */}
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Find skilled workers{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                you can trust
              </Box>
            </Typography>

            {/* Subtitle — one sentence, comfortable line-height */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.6,
                maxWidth: 520,
                mx: 'auto',
                mb: 4,
              }}
            >
              Connect with verified carpenters, electricians, plumbers and more
              across Ghana — hire with confidence or land your next job.
            </Typography>

            {/* Search bar — primary hero interaction */}
            <Box sx={{ maxWidth: 520, mx: 'auto', mb: 3 }}>
              <TextField
                fullWidth
                placeholder={
                  isMobile
                    ? 'Search skills or location…'
                    : 'Try "plumber in Accra" or "electrician"'
                }
                variant="outlined"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    height: 52,
                    '& fieldset': { borderColor: 'divider' },
                  },
                }}
              />
            </Box>

            {/* Dual CTAs */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Button variant="contained" size="large" onClick={() => navigate('/search')} sx={BTN_SX}>
                Find Talent
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/jobs')} sx={BTN_SX}>
                Browse Jobs
              </Button>
            </Stack>

            {/* Trust metrics — compact proof points */}
            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 3 }}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              {[
                '5,000+ verified workers',
                '12,000+ jobs completed',
                '98% satisfaction',
              ].map((text) => (
                <Stack key={text} direction="row" alignItems="center" spacing={0.75}>
                  <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    {text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

// ─── CATEGORIES ───────────────────────────────────────────
// 6-column grid on desktop, 2-col on mobile. Consistent card style.
const CATEGORIES = [
  { icon: <CarpenterIcon />, name: 'Carpentry', jobs: '800+', color: '#8B4513', path: '/search?category=carpentry' },
  { icon: <ElectricianIcon />, name: 'Electrical', jobs: '650+', color: '#E5A100', path: '/search?category=electrical' },
  { icon: <PlumberIcon />, name: 'Plumbing', jobs: '520+', color: '#1976D2', path: '/search?category=plumbing' },
  { icon: <MasonIcon />, name: 'Masonry', jobs: '430+', color: '#616161', path: '/search?category=masonry' },
  { icon: <PainterIcon />, name: 'Painting', jobs: '380+', color: '#C62828', path: '/search?category=painting' },
  { icon: <RoofingIcon />, name: 'Roofing', jobs: '290+', color: '#5D4037', path: '/search?category=roofing' },
];

const CategoriesSection = () => {
  const navigate = useNavigate();

  return (
    <Section alt>
      <Reveal>
        <SectionHeader
          title="Browse by category"
          subtitle="Find the right professional for your project from our growing community of verified tradespeople."
        />
      </Reveal>

      <Grid container spacing={2}>
        {CATEGORIES.map((cat, i) => (
          <Grid item xs={6} sm={4} md={2} key={cat.name}>
            <Reveal delay={i * 0.06}>
              <Card
                onClick={() => navigate(cat.path)}
                sx={{
                  ...CARD_SX,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    borderColor: alpha(cat.color, 0.5),
                    boxShadow: `0 4px 20px ${alpha(cat.color, 0.1)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1.5,
                    bgcolor: alpha(cat.color, 0.1),
                    color: cat.color,
                    '& svg': { fontSize: 24 },
                  }}
                >
                  {cat.icon}
                </Avatar>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                  {cat.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {cat.jobs} jobs
                </Typography>
              </Card>
            </Reveal>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/search')}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }}
        >
          View all categories
        </Button>
      </Box>
    </Section>
  );
};

// ─── HOW IT WORKS ─────────────────────────────────────────
// Tab toggle distinguishes hirer / worker flows. 4-column on desktop.
const STEPS = {
  hiring: [
    { icon: <WorkIcon />, title: 'Post a job', desc: 'Describe what you need — free, takes 2 minutes.' },
    { icon: <FindTalentIcon />, title: 'Get matched', desc: 'Receive bids from verified workers near you.' },
    { icon: <ChatIcon />, title: 'Chat & hire', desc: 'Compare profiles, reviews and quotes.' },
    { icon: <PaymentIcon />, title: 'Pay securely', desc: 'Release payment only when satisfied.' },
  ],
  working: [
    { icon: <FindTalentIcon />, title: 'Create profile', desc: 'Showcase skills and portfolio for free.' },
    { icon: <SpeedIcon />, title: 'Browse jobs', desc: 'Find work matching your skills and location.' },
    { icon: <HandshakeIcon />, title: 'Apply & deliver', desc: 'Submit bids, get hired, do great work.' },
    { icon: <PaymentIcon />, title: 'Get paid', desc: 'Receive secure payments to your account.' },
  ],
};

const HowItWorksSection = () => {
  const theme = useTheme();
  const [tab, setTab] = React.useState('hiring');

  return (
    <Section>
      <Reveal>
        <SectionHeader title="How Kelmah works" />
      </Reveal>

      {/* Tab toggle — same button tokens as rest of page */}
      <Reveal>
        <Stack direction="row" spacing={1} sx={{ mb: { xs: 4, md: 6 } }}>
          {[
            { key: 'hiring', label: 'I want to hire' },
            { key: 'working', label: 'I want to work' },
          ].map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'contained' : 'outlined'}
              onClick={() => setTab(t.key)}
              size="small"
              sx={{
                minHeight: 40,
                px: 2.5,
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                ...(tab !== t.key && { borderColor: 'divider', color: 'text.secondary' }),
              }}
            >
              {t.label}
            </Button>
          ))}
        </Stack>
      </Reveal>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {STEPS[tab].map((step, i) => (
          <Grid item xs={12} sm={6} md={3} key={step.title}>
            <Reveal delay={i * 0.08}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 1.5,
                    fontSize: '0.75rem',
                    letterSpacing: 1,
                  }}
                >
                  STEP {i + 1}
                </Typography>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    mb: 2,
                    '& svg': { fontSize: 24 },
                  }}
                >
                  {step.icon}
                </Avatar>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {step.desc}
                </Typography>
              </Box>
            </Reveal>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
};

// ─── TESTIMONIALS ─────────────────────────────────────────
// 3-column on desktop, full-width stacked on mobile. Same CARD_SX.
const TESTIMONIALS = [
  {
    name: 'Akua Darkowaa',
    role: 'Business Owner, Kumasi',
    text: 'I found a reliable electrician for my shop renovation within an hour. The quality of work was excellent and the whole process was transparent.',
    rating: 5,
  },
  {
    name: 'Emmanuel Tetteh',
    role: 'Master Carpenter',
    text: 'Kelmah has transformed how I find work. I get steady jobs, clients can see my portfolio, and I get paid on time every time.',
    rating: 5,
  },
  {
    name: 'Nana Adwoa Serwaa',
    role: 'Property Manager, Accra',
    text: 'Managing maintenance for multiple properties used to be a nightmare. Now I have a trusted network just a tap away.',
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <Section alt>
    <Reveal>
      <SectionHeader title="What our users say" align="center" />
    </Reveal>

    <Grid container spacing={3}>
      {TESTIMONIALS.map((t, i) => (
        <Grid item xs={12} md={4} key={t.name}>
          <Reveal delay={i * 0.08}>
            <Card
              sx={{
                ...CARD_SX,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Rating value={t.rating} readOnly size="small" sx={{ mb: 2 }} />
              <Typography
                variant="body2"
                sx={{ flex: 1, mb: 3, lineHeight: 1.7, color: 'text.secondary' }}
              >
                &ldquo;{t.text}&rdquo;
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {t.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {t.role}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Reveal>
        </Grid>
      ))}
    </Grid>
  </Section>
);

// ─── CTA BANNER ───────────────────────────────────────────
const CTASection = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Section
      sx={{
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.04)
            : alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Reveal>
        <Box sx={{ textAlign: 'center', maxWidth: 520, mx: 'auto' }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, mb: 2 }}
          >
            Ready to get started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            Join thousands of skilled workers and businesses already on Kelmah.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button variant="contained" size="large" onClick={() => navigate('/register')} sx={BTN_SX}>
              Sign up free
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')} sx={BTN_SX}>
              Log in
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, fontSize: '0.8rem' }}>
            No credit card required · Free for workers
          </Typography>
        </Box>
      </Reveal>
    </Section>
  );
};

/* =================================================================
 * MAIN PAGE COMPOSITION
 *
 * 5 sections — same count as Upwork:
 *   Hero → Categories → How It Works → Testimonials → CTA
 *
 * Removed from previous version:
 *   - StatsSection (metrics now inline in hero trust bar)
 *   - WhyKelmahSection (overlapped How It Works messaging)
 *   - Floating stat cards + Top Workers card (fake data / gimmick)
 *   - Industry name strip ("CONSTRUCTION", "REAL ESTATE" etc.)
 *   - Animated counter hook (unnecessary complexity)
 *   - Per-child stagger animations (animation fatigue)
 * ================================================================= */
const HomePage = () => (
  <Box>
    <HeroSection />
    <CategoriesSection />
    <HowItWorksSection />
    <TestimonialsSection />
    <CTASection />
  </Box>
);

export default HomePage;
