import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Button,
  Card,
  Chip,
  Avatar,
  Rating,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowForward as ArrowForwardIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  Payments as PaymentsIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  Bolt as BoltIcon,
  Build as CarpenterIcon,
  Construction as MasonIcon,
  Plumbing as PlumberIcon,
  ElectricalServices as ElectricianIcon,
  Brush as PainterIcon,
  Roofing as RoofingIcon,
  Star as StarIcon,
  FormatQuote as QuoteIcon,
  Handyman as HandymanIcon,
  PersonSearch as PersonSearchIcon,
  Map as MapIcon,
  SupportAgent as SupportIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Place as PlaceIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import heroBg from '../assets/images/background.jpg';
import carpentryImg from '../assets/images/carpentry.jpg';
import constructionImg from '../assets/images/construction.jpg';
import electricalImg from '../assets/images/electrical.jpg';

/* ─── animation variants ─────────────────────────────────
 * heroAnim  → fires immediately on mount (animate, not whileInView)
 * scrollIn  → fires when scrolled into view (below-fold sections)
 * Both start visible (opacity:1) so content is NEVER invisible
 * even if IntersectionObserver doesn't fire on mobile.
 * ──────────────────────────────────────────────────────── */
const heroAnim = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const scrollIn = {
  initial: { opacity: 0.15, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

/* ─── Category data ─── */
const TRADE_CATEGORIES = [
  { icon: <CarpenterIcon />, label: 'Carpentry', img: carpentryImg, count: '800+', query: 'carpentry' },
  { icon: <MasonIcon />, label: 'Masonry', img: constructionImg, count: '650+', query: 'masonry' },
  { icon: <ElectricianIcon />, label: 'Electrical', img: electricalImg, count: '500+', query: 'electrical' },
  { icon: <PlumberIcon />, label: 'Plumbing', img: null, count: '420+', query: 'plumbing' },
  { icon: <PainterIcon />, label: 'Painting', img: null, count: '380+', query: 'painting' },
  { icon: <RoofingIcon />, label: 'Roofing', img: null, count: '310+', query: 'roofing' },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    name: 'Kwame A.',
    role: 'Carpenter, Accra',
    text: 'Since joining Kelmah I get steady work every week. Customers find me easily and I get paid on time.',
    rating: 5,
    avatar: 'K',
  },
  {
    name: 'Ama D.',
    role: 'Homeowner, Kumasi',
    text: 'I needed a plumber urgently and Kelmah connected me with a verified one within 30 minutes. Excellent service!',
    rating: 5,
    avatar: 'A',
  },
  {
    name: 'Yaw M.',
    role: 'Electrician, Tamale',
    text: 'The app is easy to use — even my uncle who cannot read well uses the icons to find jobs near him.',
    rating: 4,
    avatar: 'Y',
  },
];

const HomeLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /* theme-aware surface colours */
  const altBg = isDark ? 'rgba(255,255,255,0.03)' : '#F5F2E8';
  const statsBg = isDark ? '#111827' : '#1B2130';
  const ctaBg = isDark ? '#0B1220' : '#0F172A';
  const cardBorder = isDark ? 'rgba(255,215,0,0.12)' : 'divider';
  const goldAlpha = (a) => `rgba(255,215,0,${a})`;

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* ═══ HERO — full-viewport, background image, immediate animation ═══ */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 'min(55vh, 440px)', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          pt: { xs: '40px', md: '48px' },
          boxSizing: 'border-box',
          color: '#fff',
          backgroundImage: `linear-gradient(160deg, rgba(5,5,7,0.93) 0%, rgba(5,5,7,0.6) 50%, rgba(5,5,7,0.35) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 15% 30%, rgba(255,215,0,0.16), transparent 55%), radial-gradient(ellipse at 85% 25%, rgba(26,138,74,0.12), transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 10 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div {...heroAnim}>
                <Chip
                  label="Ghana's #1 trades marketplace"
                  size="small"
                  sx={{
                    mb: 2,
                    bgcolor: goldAlpha(0.14),
                    color: '#FFD700',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.85rem', sm: '2.6rem', md: '3.25rem' },
                    lineHeight: 1.12,
                    mb: 2,
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  Find skilled tradespeople&nbsp;
                  <Box component="span" sx={{ color: '#FFD700' }}>
                    you can trust.
                  </Box>
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    maxWidth: 540,
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    lineHeight: 1.65,
                    opacity: 0.92,
                    mb: 3.5,
                  }}
                >
                  Kelmah connects vetted carpenters, electricians, plumbers and masons with
                  households and businesses across Ghana. Post a job in minutes or discover paid
                  work near you.
                </Typography>

                {/* Primary CTAs — large touch targets (min 54px) for accessibility */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3.5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    aria-label="Find a worker"
                    onClick={() => navigate('/search')}
                    sx={{
                      bgcolor: '#FFD700',
                      color: '#111',
                      fontWeight: 700,
                      textTransform: 'none',
                      minHeight: 54,
                      fontSize: '1rem',
                      px: 4,
                      borderRadius: 2,
                      boxShadow: '0 4px 16px rgba(255,215,0,0.25)',
                      '&:hover': { bgcolor: '#F5C800', boxShadow: '0 6px 24px rgba(255,215,0,0.35)' },
                    }}
                  >
                    Find a worker
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<WorkIcon />}
                    aria-label="Browse jobs"
                    onClick={() => navigate('/jobs')}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.55)',
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 54,
                      fontSize: '1rem',
                      px: 4,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#FFD700',
                        color: '#FFD700',
                        bgcolor: goldAlpha(0.06),
                      },
                    }}
                  >
                    Browse jobs
                  </Button>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ mb: 2.5 }}
                >
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<WorkIcon />}
                    onClick={() => navigate('/register')}
                    sx={{
                      justifyContent: { xs: 'flex-start', sm: 'center' },
                      color: '#FFD700',
                      textTransform: 'none',
                      fontWeight: 700,
                      minHeight: 48,
                    }}
                  >
                    I need work
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/search')}
                    sx={{
                      justifyContent: { xs: 'flex-start', sm: 'center' },
                      color: '#FFD700',
                      textTransform: 'none',
                      fontWeight: 700,
                      minHeight: 48,
                    }}
                  >
                    I want to hire
                  </Button>
                </Stack>

                {/* Trust badges */}
                <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} flexWrap="wrap" useFlexGap>
                  {[
                    { icon: <VerifiedIcon />, text: '5,000+ verified workers' },
                    { icon: <SecurityIcon />, text: 'Secure payments' },
                    { icon: <StarIcon />, text: '98% satisfaction' },
                  ].map((badge) => (
                    <Stack key={badge.text} direction="row" spacing={0.75} alignItems="center">
                      {React.cloneElement(badge.icon, { sx: { color: '#FFD700', fontSize: 18 } })}
                      <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {badge.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </motion.div>
            </Grid>

            {/* ── right card — what Kelmah does ── */}
            <Grid item xs={12} md={5}>
              <motion.div {...heroAnim} transition={{ duration: 0.6, delay: 0.15 }}>
                <Card
                  role="region"
                  aria-label="Kelmah key benefits"
                  sx={{
                    bgcolor: 'rgba(14,15,20,0.88)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 3,
                    p: { xs: 2.5, md: 3 },
                    color: '#fff',
                    border: '1px solid rgba(255,215,0,0.18)',
                  }}
                >
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    What Kelmah does for you
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      { icon: <SearchIcon />, title: 'Match with vetted talent', desc: 'Discover top-rated tradespeople near you.' },
                      { icon: <SecurityIcon />, title: 'Hire with confidence', desc: 'Verified profiles, ratings and secure messaging.' },
                      { icon: <PaymentsIcon />, title: 'Pay only when happy', desc: 'Transparent quotes and payment protection.' },
                    ].map((item) => (
                      <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                        <Avatar sx={{ bgcolor: goldAlpha(0.15), color: '#FFD700', width: 44, height: 44 }}>
                          {item.icon}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} variant="body1">{item.title}</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.75 }}>{item.desc}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══ QUICK CATEGORY ICONS — large icon tiles for easy browsing (accessibility-first) ═══ */}
      <Box component="section" sx={{ py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, mb: 1, textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}
            >
              What work do you need?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center', maxWidth: 420, mx: 'auto' }}>
              Tap a trade to find workers near you.
            </Typography>
          </motion.div>

          <Grid container spacing={2} justifyContent="center">
            {TRADE_CATEGORIES.map((cat, i) => (
              <Grid item xs={4} sm={4} md={2} key={cat.label}>
                <motion.div {...scrollIn} transition={{ duration: 0.35, delay: i * 0.05 }}>
                  <Card
                    component="button"
                    type="button"
                    aria-label={`Find ${cat.label} workers`}
                    onClick={() => navigate(`/search?category=${cat.query}`)}
                    sx={{
                      width: '100%',
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: cardBorder,
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minHeight: { xs: 100, md: 120 },
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${goldAlpha(0.15)}`,
                        borderColor: '#FFD700',
                      },
                      '&:focus-visible': {
                        outline: '3px solid #FFD700',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: isDark ? goldAlpha(0.12) : goldAlpha(0.08),
                        color: '#FFD700',
                        width: { xs: 48, md: 56 },
                        height: { xs: 48, md: 56 },
                        '& .MuiSvgIcon-root': { fontSize: { xs: 26, md: 30 } },
                      }}
                    >
                      {cat.icon}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, textAlign: 'center' }}
                    >
                      {cat.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {cat.count} pros
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ CATEGORY PHOTO SHOWCASE ═══ */}
      <Box component="section" sx={{ py: { xs: 3, md: 8 }, bgcolor: altBg }}>
        <Container maxWidth="lg">
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, mb: 1, fontFamily: 'Montserrat, sans-serif' }}
            >
              Explore top trades
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480 }}>
              Browse professionals across Ghana's most in-demand skill categories.
            </Typography>
          </motion.div>

          <Grid container spacing={2.5} alignItems="stretch">
            {[
              { title: 'Carpentry & Woodwork', img: carpentryImg, tag: '800+ carpenters', query: 'carpentry' },
              { title: 'Construction & Masonry', img: constructionImg, tag: '650+ builders', query: 'masonry' },
              { title: 'Electrical Installs & Repair', img: electricalImg, tag: '500+ electricians', query: 'electrical' },
            ].map((item, i) => (
              <Grid item xs={12} sm={6} md={4} key={item.title}>
                <motion.div {...scrollIn} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <Card
                    component="button"
                    type="button"
                    aria-label={`Browse ${item.title}`}
                    onClick={() => navigate(`/search?category=${item.query}`)}
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: cardBorder,
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      p: 0,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                      '&:focus-visible': { outline: '3px solid #FFD700', outlineOffset: 2 },
                    }}
                  >
                    <Box
                      component="img"
                      src={item.img}
                      alt={item.title}
                      loading="lazy"
                      sx={{ width: '100%', height: { xs: 180, md: 200 }, objectFit: 'cover' }}
                    />
                    <Box sx={{ p: 2.5 }}>
                      <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.tag}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.25 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: '#FFD700' }}
                        >
                          View workers
                        </Typography>
                        <ArrowForwardIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                      </Stack>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Quick-link chips for all categories */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 3, rowGap: 1 }}
          >
            {TRADE_CATEGORIES.map((cat) => (
              <Chip
                key={cat.label}
                icon={React.cloneElement(cat.icon, { sx: { fontSize: 18 } })}
                label={cat.label}
                clickable
                aria-label={`Search ${cat.label} workers`}
                onClick={() => navigate(`/search?category=${cat.query}`)}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderColor: cardBorder,
                  minHeight: 36,
                  '&:hover': { borderColor: '#FFD700', color: '#FFD700' },
                }}
              />
            ))}
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/search')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 36 }}
            >
              View all trades
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ═══ FOR WORKERS / FOR HIRERS — dual value cards ═══ */}
      <Box component="section" sx={{ py: { xs: 4, md: 10 } }}>
        <Container maxWidth="lg">
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, textAlign: 'center', mb: 1, fontFamily: 'Montserrat, sans-serif' }}
            >
              Built for everyone
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 5, maxWidth: 480, mx: 'auto' }}
            >
              Whether you&apos;re looking for work or looking to hire — Kelmah has you covered.
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {/* For Workers */}
            <Grid item xs={12} md={6}>
              <motion.div {...scrollIn} transition={{ duration: 0.45, delay: 0 }}>
                <Card
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    height: '100%',
                    border: '2px solid',
                    borderColor: goldAlpha(0.2),
                    boxShadow: 'none',
                    bgcolor: isDark ? goldAlpha(0.03) : goldAlpha(0.02),
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: goldAlpha(0.15), color: '#FFD700', width: 56, height: 56 }}>
                      <HandymanIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>For Workers</Typography>
                      <Typography variant="body2" color="text.secondary">Carpenters, plumbers, electricians &amp; more</Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    {[
                      { icon: <SearchIcon />, text: 'Find paid jobs near you every day' },
                      { icon: <TrendingUpIcon />, text: 'Build your profile and get more customers' },
                      { icon: <PaymentsIcon />, text: 'Get paid safely through the app' },
                      { icon: <StarIcon />, text: 'Earn ratings and grow your reputation' },
                    ].map((item) => (
                      <Stack key={item.text} direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: goldAlpha(0.1), color: '#FFD700', width: 36, height: 36 }}>
                          {item.icon}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.text}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<WorkIcon />}
                    aria-label="Sign up as a worker"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: '#FFD700',
                      color: '#111',
                      fontWeight: 700,
                      textTransform: 'none',
                      minHeight: 54,
                      fontSize: '1rem',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#F5C800' },
                    }}
                  >
                    Start getting jobs
                  </Button>
                </Card>
              </motion.div>
            </Grid>

            {/* For Hirers */}
            <Grid item xs={12} md={6}>
              <motion.div {...scrollIn} transition={{ duration: 0.45, delay: 0.1 }}>
                <Card
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    height: '100%',
                    border: '2px solid',
                    borderColor: isDark ? 'rgba(26,138,74,0.2)' : 'rgba(26,138,74,0.15)',
                    boxShadow: 'none',
                    bgcolor: isDark ? 'rgba(26,138,74,0.03)' : 'rgba(26,138,74,0.02)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'rgba(26,138,74,0.12)', color: '#1A8A4A', width: 56, height: 56 }}>
                      <PersonSearchIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>For Hirers</Typography>
                      <Typography variant="body2" color="text.secondary">Homeowners, businesses &amp; contractors</Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    {[
                      { icon: <VerifiedIcon />, text: 'Hire verified and rated tradespeople' },
                      { icon: <BoltIcon />, text: 'Post a job and get responses in minutes' },
                      { icon: <SecurityIcon />, text: 'Payment protection with escrow' },
                      { icon: <GroupsIcon />, text: 'Compare multiple workers and reviews' },
                    ].map((item) => (
                      <Stack key={item.text} direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(26,138,74,0.1)', color: '#1A8A4A', width: 36, height: 36 }}>
                          {item.icon}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.text}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<SearchIcon />}
                    aria-label="Find a worker to hire"
                    onClick={() => navigate('/search')}
                    sx={{
                      bgcolor: '#1A8A4A',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'none',
                      minHeight: 54,
                      fontSize: '1rem',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#157a40' },
                    }}
                  >
                    Find a worker now
                  </Button>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══ HOW IT WORKS ═══ */}
      <Box component="section" sx={{ py: { xs: 4, md: 10 }, bgcolor: altBg }}>
        <Container maxWidth="lg">
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, textAlign: 'center', mb: 1, fontFamily: 'Montserrat, sans-serif' }}
            >
              How Kelmah works
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 5, maxWidth: 420, mx: 'auto' }}>
              Three simple steps from posting to paying.
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {[
              { num: '1', icon: <WorkIcon sx={{ fontSize: 28 }} />, title: 'Post your job', text: 'Describe the work, budget and timeline in minutes.' },
              { num: '2', icon: <GroupsIcon sx={{ fontSize: 28 }} />, title: 'Compare offers', text: 'Review verified profiles and choose the right pro.' },
              { num: '3', icon: <PaymentsIcon sx={{ fontSize: 28 }} />, title: 'Pay securely', text: 'Release payment only when the work is done.' },
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={item.title}>
                <motion.div {...scrollIn} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <Card
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: 3,
                      height: '100%',
                      border: '1px solid',
                      borderColor: cardBorder,
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                      textAlign: 'center',
                    }}
                  >
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: isDark ? goldAlpha(0.12) : 'primary.main',
                          color: isDark ? '#FFD700' : 'primary.contrastText',
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: '#FFD700',
                          color: '#111',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.num}
                      </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {item.text}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ STATS BAR ═══ */}
      <Box
        component="section"
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: statsBg,
          color: '#fff',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center" textAlign="center">
            {[
              { val: '12,000+', label: 'Jobs completed', icon: <WorkIcon /> },
              { val: '5,000+', label: 'Verified workers', icon: <VerifiedIcon /> },
              { val: '98%', label: 'Satisfaction rate', icon: <StarIcon /> },
              { val: '24/7', label: 'Support available', icon: <SupportIcon /> },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={stat.val}>
                <motion.div {...scrollIn} transition={{ duration: 0.35, delay: i * 0.06 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {React.cloneElement(stat.icon, { sx: { color: '#FFD700', fontSize: 32 } })}
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#FFD700' }}>
                      {stat.val}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ TESTIMONIALS ═══ */}
      <Box component="section" sx={{ py: { xs: 4, md: 10 } }}>
        <Container maxWidth="lg">
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, textAlign: 'center', mb: 1, fontFamily: 'Montserrat, sans-serif' }}
            >
              What people say
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 5, maxWidth: 440, mx: 'auto' }}
            >
              Real stories from workers and hirers across Ghana.
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {TESTIMONIALS.map((t, i) => (
              <Grid item xs={12} md={4} key={t.name}>
                <motion.div {...scrollIn} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '100%',
                      border: '1px solid',
                      borderColor: cardBorder,
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <QuoteIcon sx={{ color: goldAlpha(0.3), fontSize: 32, mb: 1 }} />
                    <Typography
                      variant="body1"
                      sx={{ fontStyle: 'italic', lineHeight: 1.7, mb: 2, flex: 1 }}
                    >
                      &ldquo;{t.text}&rdquo;
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: goldAlpha(0.15),
                          color: '#FFD700',
                          width: 44,
                          height: 44,
                          fontWeight: 700,
                        }}
                      >
                        {t.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.role}
                        </Typography>
                      </Box>
                      <Rating value={t.rating} size="small" readOnly sx={{ '& .MuiRating-iconFilled': { color: '#FFD700' } }} />
                    </Stack>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══ QUICK HIRE CTA ═══ */}
      <Box
        component="section"
        sx={{
          py: { xs: 4, md: 8 },
          bgcolor: altBg,
        }}
      >
        <Container maxWidth="md">
          <motion.div {...scrollIn}>
            <Card
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                textAlign: 'center',
                border: '2px solid',
                borderColor: goldAlpha(0.2),
                boxShadow: `0 8px 32px ${goldAlpha(0.08)}`,
                bgcolor: 'background.paper',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: goldAlpha(0.12),
                  color: '#FFD700',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <BoltIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ mb: 1, fontFamily: 'Montserrat, sans-serif' }}
              >
                Need someone right now?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 480, mx: 'auto', lineHeight: 1.6 }}
              >
                Use Quick Hire to find available workers near you instantly.
                Describe your job with text, voice, or a photo — we&apos;ll match you in minutes.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<BoltIcon />}
                  aria-label="Quick hire a worker"
                  onClick={() => navigate('/quick-hire')}
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#111',
                    fontWeight: 700,
                    textTransform: 'none',
                    minHeight: 54,
                    px: 4,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#F5C800' },
                  }}
                >
                  Quick Hire
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<MapIcon />}
                  aria-label="View workers on map"
                  onClick={() => navigate('/map')}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 54,
                    px: 4,
                    borderRadius: 2,
                    borderColor: cardBorder,
                    '&:hover': { borderColor: '#FFD700', color: '#FFD700' },
                  }}
                >
                  View on Map
                </Button>
              </Stack>
            </Card>
          </motion.div>
        </Container>
      </Box>

      {/* ═══ FINAL CTA ═══ */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 12 },
          bgcolor: ctaBg,
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${goldAlpha(0.08)}, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div {...scrollIn}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, mb: 2, fontFamily: 'Montserrat, sans-serif' }}
            >
              Ready to get started?
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mb: 4, lineHeight: 1.6 }}>
              Join thousands of verified workers and businesses already building with&nbsp;Kelmah.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                aria-label="Sign up for Kelmah"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: '#FFD700',
                  color: '#111',
                  fontWeight: 700,
                  textTransform: 'none',
                  minHeight: 54,
                  fontSize: '1rem',
                  px: 5,
                  borderRadius: 2,
                  boxShadow: `0 4px 20px ${goldAlpha(0.3)}`,
                  '&:hover': { bgcolor: '#F5C800', boxShadow: `0 6px 28px ${goldAlpha(0.4)}` },
                }}
              >
                Sign up free
              </Button>
              <Button
                variant="outlined"
                size="large"
                aria-label="Log in to Kelmah"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.45)',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 54,
                  fontSize: '1rem',
                  px: 5,
                  borderRadius: 2,
                  '&:hover': { borderColor: '#FFD700', color: '#FFD700' },
                }}
              >
                Log in
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.55, mt: 2, fontSize: '0.8rem' }}>
              No credit card required &middot; Free for workers
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* ═══ FOOTER ═══ */}
      <Box
        component="footer"
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: isDark ? '#050507' : '#0A0A0C',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Brand */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#FFD700', mb: 1 }}>
                Kelmah
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 280, lineHeight: 1.6, mb: 2 }}>
                Connecting skilled tradespeople with people who need their services. Built for Ghana.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PlaceIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>Accra, Ghana</Typography>
                </Stack>
              </Stack>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', mb: 2 }}>
                Platform
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Find Workers', path: '/search' },
                  { label: 'Browse Jobs', path: '/jobs' },
                  { label: 'Quick Hire', path: '/quick-hire' },
                  { label: 'Map View', path: '/map' },
                ].map((link) => (
                  <Typography
                    key={link.label}
                    component="button"
                    variant="body2"
                    onClick={() => navigate(link.path)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      p: 0,
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      minHeight: 32,
                      display: 'block',
                      '&:hover': { color: '#FFD700' },
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            {/* For Users */}
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', mb: 2 }}>
                Account
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Sign Up', path: '/register' },
                  { label: 'Log In', path: '/login' },
                  { label: 'Help Center', path: '/support' },
                  { label: 'Premium', path: '/premium' },
                ].map((link) => (
                  <Typography
                    key={link.label}
                    component="button"
                    variant="body2"
                    onClick={() => navigate(link.path)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      p: 0,
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      minHeight: 32,
                      display: 'block',
                      '&:hover': { color: '#FFD700' },
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            {/* Trades */}
            <Grid item xs={12} sm={4} md={4}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', mb: 2 }}>
                Popular Trades
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {TRADE_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.label}
                    label={cat.label}
                    size="small"
                    clickable
                    onClick={() => navigate(`/search?category=${cat.query}`)}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: goldAlpha(0.15), color: '#FFD700' },
                    }}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Typography variant="caption" sx={{ opacity: 0.4 }}>
              © {new Date().getFullYear()} Kelmah. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.4 }}>
              Made with ❤ in Ghana
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomeLanding;
