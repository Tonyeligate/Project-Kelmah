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
  useTheme,
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

const HomeLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /* theme-aware surface colours */
  const altBg = isDark ? 'rgba(255,255,255,0.03)' : '#F5F2E8';
  const statsBg = isDark ? '#111827' : '#1B2130';
  const ctaBg = isDark ? '#0B1220' : '#0F172A';

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>

      {/* ═══ HERO — full-viewport, background image, immediate animation ═══ */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100dvh - 48px)', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          pt: { xs: '40px', md: '48px' },
          boxSizing: 'border-box',
          color: '#fff',
          backgroundImage: `linear-gradient(160deg, rgba(5,5,7,0.93) 0%, rgba(5,5,7,0.6) 50%, rgba(5,5,7,0.35) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          overflow: 'hidden',
          /* gold + green accent glows */
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
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 10 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div {...heroAnim}>
                <Chip
                  label="Ghana's #1 trades marketplace"
                  size="small"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(255,215,0,0.14)',
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

                {/* Primary CTAs */}
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
                      minHeight: 50,
                      px: 3.5,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#F5C800' },
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
                      minHeight: 50,
                      px: 3.5,
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: '#FFD700',
                        color: '#FFD700',
                        bgcolor: 'rgba(255,215,0,0.06)',
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
                      minHeight: 44,
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
                      minHeight: 44,
                    }}
                  >
                    I want to hire
                  </Button>
                </Stack>

                {/* Trust badges */}
                <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} flexWrap="wrap" useFlexGap>
                  {[
                    '5,000+ verified workers',
                    'Secure payments',
                    '98% satisfaction',
                  ].map((text) => (
                    <Stack key={text} direction="row" spacing={0.75} alignItems="center">
                      <VerifiedIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {text}
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
                        <Avatar sx={{ bgcolor: 'rgba(255,215,0,0.15)', color: '#FFD700', width: 40, height: 40 }}>
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

      {/* ═══ CATEGORY SHOWCASE — real photos ═══ */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
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
              { title: 'Carpentry & woodwork', img: carpentryImg, tag: '800+ carpenters' },
              { title: 'Construction & masonry', img: constructionImg, tag: '650+ builders' },
              { title: 'Electrical installs & repair', img: electricalImg, tag: '500+ electricians' },
            ].map((item, i) => (
              <Grid item xs={12} sm={6} md={4} key={item.title}>
                <motion.div {...scrollIn} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <Card
                    component="button"
                    type="button"
                    aria-label={`Browse ${item.title}`}
                    onClick={() => navigate('/search')}
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      p: 0,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
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
                      <Button
                        size="small"
                        sx={{ mt: 1.25, px: 0, textTransform: 'none', fontWeight: 700 }}
                      >
                        View workers
                      </Button>
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
            {[
              { icon: <CarpenterIcon sx={{ fontSize: 16 }} />, label: 'Carpentry' },
              { icon: <ElectricianIcon sx={{ fontSize: 16 }} />, label: 'Electrical' },
              { icon: <PlumberIcon sx={{ fontSize: 16 }} />, label: 'Plumbing' },
              { icon: <MasonIcon sx={{ fontSize: 16 }} />, label: 'Masonry' },
              { icon: <PainterIcon sx={{ fontSize: 16 }} />, label: 'Painting' },
              { icon: <RoofingIcon sx={{ fontSize: 16 }} />, label: 'Roofing' },
            ].map((cat) => (
              <Chip
                key={cat.label}
                icon={cat.icon}
                label={cat.label}
                clickable
                aria-label={`Search ${cat.label} workers`}
                onClick={() => navigate(`/search?category=${cat.label.toLowerCase()}`)}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600, borderColor: 'divider' }}
              />
            ))}
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/search')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              View all
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ═══ ABOUT / VALUE PROPOSITION ═══ */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: altBg }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div {...scrollIn}>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{ fontWeight: 800, mb: 2, fontFamily: 'Montserrat, sans-serif' }}
                >
                  Built for Ghanaian workers and&nbsp;the people who hire&nbsp;them.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Kelmah makes hiring and job discovery simple. From verified profiles to secure
                  payments and transparent reviews, every step is designed to protect both hirers
                  and skilled workers.
                </Typography>
                <Stack spacing={2.5}>
                  {[
                    { icon: <BoltIcon />, title: 'Fast hiring flow', text: 'Post a job in minutes and get responses quickly.' },
                    { icon: <WorkIcon />, title: 'Quality-focused matching', text: 'Search by location, ratings and verified skills.' },
                    { icon: <PaymentsIcon />, title: 'Secure payments', text: 'Keep payments safe with clear pricing and milestones.' },
                  ].map((item) => (
                    <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                      <Avatar
                        sx={{
                          bgcolor: isDark ? 'rgba(255,215,0,0.12)' : 'rgba(26,138,74,0.1)',
                          color: isDark ? '#FFD700' : '#1A8A4A',
                          width: 44,
                          height: 44,
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </motion.div>
            </Grid>

            {/* Stats block */}
            <Grid item xs={12} md={6}>
              <motion.div {...scrollIn} transition={{ duration: 0.45, delay: 0.1 }}>
                <Box
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    bgcolor: statsBg,
                    color: '#fff',
                    display: 'grid',
                    gap: 3,
                  }}
                >
                  {[
                    { val: '12,000+', label: 'Jobs completed across Ghana' },
                    { val: '98%', label: 'Client satisfaction rate' },
                    { val: '24/7', label: 'Support for disputes and safety' },
                  ].map((item) => (
                    <Box key={item.val}>
                      <Typography variant="h5" fontWeight={800} sx={{ color: '#FFD700', mb: 0.25 }}>
                        {item.val}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══ HOW IT WORKS ═══ */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
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
              { num: '1', title: 'Post your job', text: 'Describe the work, budget and timeline in minutes.' },
              { num: '2', title: 'Compare offers', text: 'Review verified profiles and choose the right pro.' },
              { num: '3', title: 'Pay securely', text: 'Release payment only when the work is done.' },
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={item.title}>
                <motion.div {...scrollIn} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: isDark ? 'rgba(255,215,0,0.12)' : 'primary.main',
                        color: isDark ? '#FFD700' : 'primary.contrastText',
                        fontWeight: 800,
                        fontSize: '1rem',
                        mb: 2,
                      }}
                    >
                      {item.num}
                    </Avatar>
                    <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>
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

      {/* ═══ FINAL CTA ═══ */}
      <Box
        component="section"
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: ctaBg,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
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
                  minHeight: 48,
                  px: 4,
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: '#F5C800' },
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
                  minHeight: 48,
                  px: 4,
                  borderRadius: 1.5,
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
    </Box>
  );
};

export default HomeLanding;
