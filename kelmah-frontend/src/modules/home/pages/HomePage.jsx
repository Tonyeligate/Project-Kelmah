import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Rating,
  IconButton,
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
  Work as WorkIcon,
  PersonSearch as FindTalentIcon,
  VerifiedUser as VerifiedIcon,
  Payments as PaymentIcon,
  ChatBubbleOutline as ChatIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  LocationOn as LocationIcon,
  Groups as GroupsIcon,
  TaskAlt as TaskAltIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

// ─── HERO SECTION ─────────────────────────────────────────
const HeroSection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 'auto', md: '88vh' },
        display: 'flex',
        alignItems: 'center',
        pt: { xs: 6, sm: 8, md: 0 },
        pb: { xs: 8, sm: 10, md: 0 },
        overflow: 'hidden',
        // Subtle gradient background instead of garish colors
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(ellipse at 20% 50%, rgba(255,215,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,215,0,0.04) 0%, transparent 50%)'
          : 'radial-gradient(ellipse at 20% 50%, rgba(255,215,0,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,193,7,0.06) 0%, transparent 50%)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* Left — Copy */}
          <Grid item xs={12} md={7}>
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              {/* Top badge */}
              <motion.div variants={fadeInUp}>
                <Chip
                  icon={<LocationIcon sx={{ fontSize: 16 }} />}
                  label="Ghana's #1 Skilled Trades Platform"
                  size="small"
                  sx={{
                    mb: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    '& .MuiChip-icon': { color: 'primary.main' },
                  }}
                />
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.2rem', sm: '3rem', md: '3.75rem' },
                    lineHeight: 1.12,
                    letterSpacing: '-0.025em',
                    color: 'text.primary',
                    mb: 2.5,
                  }}
                >
                  Find skilled workers{' '}
                  <Box
                    component="span"
                    sx={{
                      color: 'primary.main',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 2,
                        left: 0,
                        width: '100%',
                        height: '6px',
                        bgcolor: alpha(theme.palette.primary.main, 0.25),
                        borderRadius: 2,
                      },
                    }}
                  >
                    you can trust
                  </Box>
                </Typography>
              </motion.div>

              {/* Subheadline */}
              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 400,
                    lineHeight: 1.6,
                    fontSize: { xs: '1rem', sm: '1.15rem', md: '1.3rem' },
                    mb: 4,
                    maxWidth: 520,
                  }}
                >
                  Connect with verified carpenters, electricians, plumbers, masons
                  and more — hire with confidence or find your next job.
                </Typography>
              </motion.div>

              {/* Search / CTA */}
              <motion.div variants={fadeInUp}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                    mb: 4,
                    maxWidth: 560,
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder={isMobile ? 'Search skills…' : 'Try "plumber in Accra" or "electrician"'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fff',
                        '& fieldset': {
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: { xs: '100%', sm: 150 },
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                    onClick={() => navigate('/search')}
                  >
                    Search
                  </Button>
                </Box>
              </motion.div>

              {/* Dual CTA */}
              <motion.div variants={fadeInUp}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FindTalentIcon />}
                    onClick={() => navigate('/search')}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    Find Talent
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<WorkIcon />}
                    onClick={() => navigate('/jobs')}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    Browse Jobs
                  </Button>
                </Stack>
              </motion.div>

              {/* Trust bar */}
              <motion.div variants={fadeInUp}>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                  {[
                    { icon: <VerifiedIcon sx={{ fontSize: 18 }} />, text: 'Verified Pros' },
                    { icon: <ShieldIcon sx={{ fontSize: 18 }} />, text: 'Secure Payments' },
                    { icon: <StarIcon sx={{ fontSize: 18 }} />, text: 'Rated & Reviewed' },
                  ].map((item) => (
                    <Stack key={item.text} direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </motion.div>
            </motion.div>
          </Grid>

          {/* Right — Hero visual (desktop only) */}
          {!isMd && (
            <Grid item md={5}>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <Box sx={{ position: 'relative' }}>
                  {/* Floating stat cards */}
                  <FloatingStatCard
                    top="10%"
                    right="-5%"
                    icon={<GroupsIcon />}
                    value="5,000+"
                    label="Active Workers"
                    delay={0.5}
                  />
                  <FloatingStatCard
                    bottom="15%"
                    left="-5%"
                    icon={<TaskAltIcon />}
                    value="12,000+"
                    label="Jobs Completed"
                    delay={0.7}
                  />
                  {/* Main visual card */}
                  <Card
                    sx={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                          🔥 Top Workers This Week
                        </Typography>
                        {[
                          { name: 'Kwame Asante', skill: 'Master Electrician', rating: 4.9, jobs: 127, color: '#FFD700' },
                          { name: 'Ama Mensah', skill: 'Expert Plumber', rating: 4.8, jobs: 98, color: '#4169E1' },
                          { name: 'Kofi Boateng', skill: 'Carpenter', rating: 4.9, jobs: 156, color: '#8B4513' },
                        ].map((worker) => (
                          <Stack key={worker.name} direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: worker.color, width: 48, height: 48, fontWeight: 700 }}>
                              {worker.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {worker.name}
                                </Typography>
                                <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {worker.skill}
                              </Typography>
                            </Box>
                            <Stack alignItems="flex-end">
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <StarIcon sx={{ fontSize: 14, color: '#FFD700' }} />
                                <Typography variant="caption" fontWeight={700}>{worker.rating}</Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {worker.jobs} jobs
                              </Typography>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

// Floating stat card component
const FloatingStatCard = ({ icon, value, label, delay = 0, ...positionProps }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{
        position: 'absolute',
        zIndex: 2,
        ...positionProps,
      }}
    >
      <Card
        sx={{
          px: 2.5,
          py: 2,
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,16,22,0.95)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.2)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', width: 40, height: 40 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </Card>
    </motion.div>
  );
};

// ─── CATEGORIES SECTION (like Upwork's "Explore millions of pros") ──
const CategoriesSection = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const categories = [
    { icon: <CarpenterIcon />, name: 'Carpentry', color: '#8B4513', jobs: '800+', path: '/search?category=carpentry' },
    { icon: <ElectricianIcon />, name: 'Electrical', color: '#FFB300', jobs: '650+', path: '/search?category=electrical' },
    { icon: <PlumberIcon />, name: 'Plumbing', color: '#1E88E5', jobs: '520+', path: '/search?category=plumbing' },
    { icon: <MasonIcon />, name: 'Masonry', color: '#757575', jobs: '430+', path: '/search?category=masonry' },
    { icon: <PainterIcon />, name: 'Painting', color: '#E91E63', jobs: '380+', path: '/search?category=painting' },
    { icon: <RoofingIcon />, name: 'Roofing', color: '#795548', jobs: '290+', path: '/search?category=roofing' },
  ];

  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 2,
                mb: 1,
                display: 'block',
              }}
            >
              EXPLORE BY CATEGORY
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 1.5 }}>
              Browse talent by trade
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 500 }}>
              Find the right professional for your project from our growing community of verified tradespeople.
            </Typography>
          </motion.div>

          <Grid container spacing={2.5}>
            {categories.map((cat, i) => (
              <Grid item xs={6} sm={4} md={2} key={cat.name}>
                <motion.div variants={fadeInUp} custom={i}>
                  <Card
                    onClick={() => navigate(cat.path)}
                    sx={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      py: { xs: 3, md: 4 },
                      px: 2,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        borderColor: alpha(cat.color, 0.5),
                        boxShadow: `0 12px 40px ${alpha(cat.color, 0.15)}`,
                        '& .cat-icon': {
                          bgcolor: cat.color,
                          color: '#fff',
                          transform: 'scale(1.1)',
                        },
                      },
                    }}
                  >
                    <Avatar
                      className="cat-icon"
                      sx={{
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: alpha(cat.color, 0.12),
                        color: cat.color,
                        transition: 'all 0.3s ease',
                        '& svg': { fontSize: 28 },
                      }}
                    >
                      {cat.icon}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      {cat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat.jobs} jobs
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/search')}
              sx={{ borderRadius: 2, px: 4, py: 1.2 }}
            >
              View All Categories
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── HOW IT WORKS SECTION ─────────────────────────────────
const HowItWorksSection = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState('hiring');

  const hiringSteps = [
    { icon: <WorkIcon />, title: 'Post Your Job', desc: 'Describe what you need — it\'s free and takes 2 minutes.' },
    { icon: <FindTalentIcon />, title: 'Get Matched', desc: 'Receive bids from verified workers near you, often within minutes.' },
    { icon: <ChatIcon />, title: 'Chat & Hire', desc: 'Compare profiles, reviews and quotes. Hire the right person.' },
    { icon: <PaymentIcon />, title: 'Pay Securely', desc: 'Pay only when you\'re satisfied — your money is protected.' },
  ];

  const workingSteps = [
    { icon: <SearchIcon />, title: 'Create Profile', desc: 'Showcase your skills, certifications and portfolio for free.' },
    { icon: <SpeedIcon />, title: 'Browse Jobs', desc: 'Find work that matches your skills and location.' },
    { icon: <HandshakeIcon />, title: 'Apply & Work', desc: 'Submit bids, get hired, and deliver great work.' },
    { icon: <PaymentIcon />, title: 'Get Paid', desc: 'Receive secure payments directly to your account.' },
  ];

  const steps = activeTab === 'hiring' ? hiringSteps : workingSteps;

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <Container maxWidth="lg">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}>
              HOW IT WORKS
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
              Simple steps to get started
            </Typography>

            {/* Tab switcher like Upwork */}
            <Stack direction="row" spacing={1} sx={{ mb: 6 }}>
              {['hiring', 'working'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'contained' : 'text'}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    ...(activeTab !== tab && {
                      color: 'text.secondary',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }),
                  }}
                >
                  {tab === 'hiring' ? 'For Hiring' : 'For Finding Work'}
                </Button>
              ))}
            </Stack>
          </motion.div>

          <Grid container spacing={3}>
            {steps.map((step, i) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <motion.div variants={fadeInUp} custom={i}>
                  <Box sx={{ position: 'relative' }}>
                    {/* Step number */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: -8,
                        left: 0,
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        color: alpha(theme.palette.primary.main, 0.08),
                        lineHeight: 1,
                        zIndex: 0,
                        userSelect: 'none',
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Box sx={{ position: 'relative', zIndex: 1, pt: 3 }}>
                      <Avatar
                        sx={{
                          width: 52,
                          height: 52,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: 'primary.main',
                          mb: 2.5,
                          '& svg': { fontSize: 26 },
                        }}
                      >
                        {step.icon}
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {step.desc}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── STATS / SOCIAL PROOF SECTION ─────────────────────────
const StatsSection = () => {
  const theme = useTheme();

  const stats = [
    { value: '5,000+', label: 'Verified Workers', icon: <GroupsIcon /> },
    { value: '12,000+', label: 'Jobs Completed', icon: <TaskAltIcon /> },
    { value: '4.8/5', label: 'Average Rating', icon: <StarIcon /> },
    { value: '16', label: 'Regions Covered', icon: <LocationIcon /> },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <Grid container spacing={4}>
            {stats.map((stat, i) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <motion.div variants={fadeInUp} custom={i}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Typography
                      variant="h3"
                      fontWeight={800}
                      sx={{
                        color: 'primary.main',
                        fontSize: { xs: '2rem', md: '2.75rem' },
                        mb: 0.5,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── WHY KELMAH SECTION (Trust / Value props) ─────────────
const WhyKelmahSection = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
      title: 'Verified Professionals',
      desc: 'Every worker is identity-verified and skill-assessed before joining our platform.',
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 32 }} />,
      title: 'Secure Payments',
      desc: 'Your money is held safely until the job is done to your satisfaction.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32 }} />,
      title: 'Fast Matching',
      desc: 'Post a job and receive bids from qualified workers, often within minutes.',
    },
    {
      icon: <ChatIcon sx={{ fontSize: 32 }} />,
      title: 'Real-Time Chat',
      desc: 'Communicate instantly with workers — discuss details, share photos, stay updated.',
    },
    {
      icon: <StarIcon sx={{ fontSize: 32 }} />,
      title: 'Transparent Reviews',
      desc: 'Read honest reviews from real clients. No surprises — hire based on track record.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      title: 'Growing Opportunities',
      desc: 'New jobs posted daily across all 16 regions of Ghana. Your next gig is waiting.',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      }}
    >
      <Container maxWidth="lg">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}>
                WHY KELMAH
              </Typography>
              <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
                Built for Ghana's workforce
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, mx: 'auto' }}>
                We understand the unique needs of skilled tradespeople and the businesses that hire them.
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={3}>
            {features.map((feat, i) => (
              <Grid item xs={12} sm={6} md={4} key={feat.title}>
                <motion.div variants={fadeInUp} custom={i}>
                  <Card
                    sx={{
                      p: 3.5,
                      height: '100%',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 2, display: 'flex' }}>
                      {feat.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feat.desc}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── TESTIMONIALS ─────────────────────────────────────────
const TestimonialsSection = () => {
  const theme = useTheme();

  const testimonials = [
    {
      name: 'Akua Darkowaa',
      role: 'Business Owner, Kumasi',
      text: 'I found a reliable electrician for my shop renovation within an hour. The quality of work was excellent and the whole process was transparent.',
      rating: 5,
      avatar: 'A',
    },
    {
      name: 'Emmanuel Tetteh',
      role: 'Master Carpenter',
      text: 'Kelmah has transformed how I find work. I get steady jobs, clients can see my portfolio, and I get paid on time every time.',
      rating: 5,
      avatar: 'E',
    },
    {
      name: 'Nana Adwoa Serwaa',
      role: 'Property Manager, Accra',
      text: 'Managing maintenance for multiple properties used to be a nightmare. Now I have a network of trusted workers just a tap away.',
      rating: 5,
      avatar: 'N',
    },
  ];

  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}>
                TESTIMONIALS
              </Typography>
              <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
                Real results from real people
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={3}>
            {testimonials.map((t, i) => (
              <Grid item xs={12} md={4} key={t.name}>
                <motion.div variants={fadeInUp} custom={i}>
                  <Card
                    sx={{
                      p: 3.5,
                      height: '100%',
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Rating value={t.rating} readOnly size="small" sx={{ mb: 2 }} />
                    <Typography
                      variant="body1"
                      sx={{ mb: 3, flex: 1, fontStyle: 'italic', lineHeight: 1.7, color: 'text.secondary' }}
                    >
                      "{t.text}"
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
                        {t.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{t.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                      </Box>
                    </Stack>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── CTA BANNER ───────────────────────────────────────────
const CTASection = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.02) 100%)`
          : `linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,193,7,0.04) 100%)`,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
              Ready to get started?
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 5, maxWidth: 500, mx: 'auto' }}>
              Join thousands of skilled workers and businesses already on Kelmah.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ py: 1.8, px: 5, borderRadius: 2, fontSize: '1.05rem', fontWeight: 700 }}
              >
                Sign Up Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ py: 1.8, px: 5, borderRadius: 2, fontSize: '1.05rem', fontWeight: 700 }}
              >
                Log In
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              No credit card required · Free for workers · Post your first job in minutes
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// ─── MAIN HOME PAGE ───────────────────────────────────────
const HomePage = () => {
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <HeroSection />
      <CategoriesSection />
      <StatsSection />
      <HowItWorksSection />
      <WhyKelmahSection />
      <TestimonialsSection />
      <CTASection />
    </Box>
  );
};

export default HomePage;
