import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  Category,
  Star,
  ArrowBack,
  WorkOutline,
  BookmarkBorder,
  Bookmark,
  Share,
  Message,
  NoteAlt,
  VerifiedUser,
  CalendarToday,
  OpenInNew,
  Groups,
  AccessTime,
  CheckCircle,
  Business,
  Visibility,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled, useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import BidSubmissionForm from '../components/BidSubmissionForm';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobById,
  selectCurrentJob,
  selectJobsLoading,
  selectJobsError,
} from '../services/jobSlice';
import { secureStorage } from '../../../utils/secureStorage';
import { EXTERNAL_SERVICES } from '../../../config/services';
import jobsApi from '../services/jobsService';
import { Z_INDEX, BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
import { Helmet } from 'react-helmet-async';

// Styled components
const SectionHeading = ({ children, icon: Icon, sx = {} }) => {
  const theme = useTheme();
  const accentColor = theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, ...sx }}>
      {Icon && <Icon sx={{ color: accentColor, fontSize: 22 }} />}
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: 0.2 }}>
        {children}
      </Typography>
    </Box>
  );
};

const MetaPill = ({ icon: Icon, label }) => {
  const theme = useTheme();
  const iconColor = theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark;
  const pillBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.12)
    : alpha(theme.palette.primary.main, 0.18);
  const pillBorder = theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.28)
    : alpha(theme.palette.primary.dark, 0.2);

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 0.75,
      bgcolor: pillBg, borderRadius: 99, px: 1.5, py: 0.6,
      border: '1px solid', borderColor: pillBorder,
    }}>
      {Icon && <Icon sx={{ fontSize: 16, color: iconColor }} />}
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, lineHeight: 1.4 }}>
        {label}
      </Typography>
    </Box>
  );
};

const DetailsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(26, 26, 26, 0.8)'
      : theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : theme.palette.divider}`,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 3),
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 215, 0, 0.2)'
      : 'rgba(212, 175, 55, 0.12)',
  color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark,
  borderColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 215, 0, 0.5)'
      : 'rgba(212, 175, 55, 0.4)',
  '&:hover': {
    background:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 215, 0, 0.3)'
        : 'rgba(212, 175, 55, 0.2)',
  },
}));


const toDisplayText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const getJobLocationLabel = (job) => {
  const locationValue = job?.location;

  if (typeof locationValue === 'string') {
    return locationValue.trim() || 'Location not specified';
  }

  if (locationValue && typeof locationValue === 'object') {
    const address = toDisplayText(locationValue.address);
    const city = toDisplayText(locationValue.city);
    const region = toDisplayText(locationValue.region);
    const type = toDisplayText(locationValue.type);

    if (address) return address;
    if (city) return city;
    if (region) return region;
    if (type) {
      if (type.toLowerCase() === 'remote') return 'Remote';
      return type;
    }
  }

  return 'Location not specified';
};

const normalizeSkillLabels = (skills) => {
  if (!Array.isArray(skills)) return [];

  return skills
    .map((skill) => {
      if (typeof skill === 'string') return skill.trim();
      if (skill && typeof skill === 'object') {
        return (
          toDisplayText(skill.name) ||
          toDisplayText(skill.label) ||
          toDisplayText(skill.type) ||
          ''
        );
      }
      return '';
    })
    .filter(Boolean);
};

const JobDetailsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { search } = location;
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const job = useSelector(selectCurrentJob);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  // AUD2-M06 FIX: Use Redux auth state (survives token expiry / refresh) instead of
  // raw token-string presence which lets expired tokens pass as authenticated.
  const isAuthenticated = useSelector((state) => !!state.auth.user && !!state.auth.token);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [shareSnackbar, setShareSnackbar] = useState('');
  const locationLabel = getJobLocationLabel(job);
  const skillLabels = normalizeSkillLabels(job?.skills);
  const accentColor = theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark;
  const accentSoftBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.12)
    : alpha(theme.palette.primary.main, 0.2);

  useEffect(() => {
    // Validate jobId before fetching
    if (!id || id === 'undefined' || id === 'null') {
      if (import.meta.env.DEV) console.error('❌ Invalid job ID:', id);
      return;
    }

    // Fetch job details (public endpoint — no auth required for viewing)
    dispatch(fetchJobById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!job) return;
    setSaved(Boolean(job?.isSaved || job?.saved || job?.isBookmarked));
  }, [job]);

  // Debug logging (dev only)
  useEffect(() => {
    if (import.meta.env.DEV && job) {
      console.log('🔍 Job object in JobDetailsPage:', job);
      console.log('🔍 Job budget:', job.budget);
      console.log('🔍 Job budget type:', typeof job.budget);
    }
  }, [job]);

  // Auto-redirect to application form if ?apply=true
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') return;
    const params = new URLSearchParams(search);
    if (params.get('apply') === 'true' && isAuthenticated) {
      navigate(`/jobs/${id}/apply`, { replace: true });
    }
  }, [search, isAuthenticated, navigate, id]);

  const handleApplyNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}/apply` } });
      return;
    }
    // Navigate to the dedicated application form page for a consistent UX
    navigate(`/jobs/${id}/apply`);
  };

  const handleMessageHirer = () => {
    if (!job) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const recipientId = job?.hirer?._id || job?.hirer?.id || job?.client?._id || job?.client?.id || job?.hirerId || job?.clientId;
    if (!recipientId) {
      setShareSnackbar('Hirer contact is not available yet');
      return;
    }
    navigate(`/messages?recipient=${recipientId}`);
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (savingBookmark) return;
    setSavingBookmark(true);
    try {
      if (saved) {
        await jobsApi.unsaveJob(id);
        setSaved(false);
        setShareSnackbar('Removed from saved jobs');
      } else {
        await jobsApi.saveJob(id);
        setSaved(true);
        setShareSnackbar('Job saved successfully');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to toggle bookmark:', err);
      setShareSnackbar('Could not update saved jobs. Try again.');
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleShareJob = () => {
    if (!job) return;
    if (navigator.share) {
      // Native Web Share API (mobile / supported browsers)
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title}`,
        url: window.location.href,
      }).catch(() => {
        // User cancelled — not an error
      });
    } else {
      // AUD2-M11 FIX: Copy URL to clipboard and show Snackbar instead of blocking alert()
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => setShareSnackbar('Job link copied to clipboard!'))
        .catch(() => setShareSnackbar(`Share: ${window.location.href}`));
    }
  };

  const handleSignIn = () => {
    navigate('/login', {
      state: { from: location.pathname + location.search },
    });
  };

  if (loading) {
    // Show skeleton placeholders for job details
    return (
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 3, sm: 5 } }}>
        <Skeleton variant="text" width="15%" height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Alert severity="error">{import.meta.env.DEV ? error : 'Failed to load job details. Please try again.'}</Alert>
      </Box>
    );
  }

  // Check for invalid jobId
  if (!id || id === 'undefined' || id === 'null') {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          Invalid job ID. Please select a valid job to view details.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/jobs')}
          sx={{ mt: 2 }}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          Job not found. The job you're looking for doesn't exist or has been
          removed.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/jobs')}
          sx={{ mt: 2 }}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }

  // ─── derived hirer info ───────────────────────────────────────────────
  const hirerData = job?.hirer || job?.client || job?.createdBy || {};
  const hirerId = hirerData?._id || hirerData?.id || job?.hirerId || job?.clientId || null;
  const hirerName = hirerData?.firstName && hirerData?.lastName
    ? `${hirerData.firstName} ${hirerData.lastName}`
    : hirerData?.name || job?.hirerName || (hirerData?.email ? hirerData.email.split('@')[0] : null) || 'Client';
  const hirerRating = typeof hirerData?.rating === 'number' ? hirerData.rating.toFixed(1) : null;
  const hirerReviews = hirerData?.reviewCount ?? hirerData?.reviews ?? 0;
  const hirerLocation = hirerData?.location?.city || hirerData?.location?.region
    || (typeof hirerData?.location === 'string' ? hirerData.location : null) || null;
  const hirerJoined = hirerData?.createdAt
    ? new Date(hirerData.createdAt).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
    : null;
  const hirerJobsPosted = hirerData?.jobsPosted ?? hirerData?.totalJobs ?? job?.hirerJobsPosted ?? null;
  const hirerVerified = Boolean(hirerData?.isVerified || hirerData?.verified || hirerData?.verification?.isVerified);

  const handleOpenClientProfile = () => {
    if (!hirerId) {
      setShareSnackbar('Client profile is not available yet');
      return;
    }

    navigate(`/profile/${hirerId}`, {
      state: { profileData: hirerData, source: 'job-details', jobId: id },
    });
  };

  // ─── budget display ───────────────────────────────────────────────────
  const budgetDisplay = (() => {
    if (!job?.budget && job?.budget !== 0) return 'Budget not specified';
    const currency = 'GH₵';
    if (typeof job.budget === 'object') {
      const { min, max, amount, type } = job.budget;
      const suffix = type || job?.paymentType || 'fixed';
      if (amount) return `${currency} ${Number(amount).toLocaleString()} / ${suffix}`;
      if (min != null && max != null)
        return min === max
          ? `${currency} ${Number(min).toLocaleString()} / ${suffix}`
          : `${currency} ${Number(min).toLocaleString()} – ${Number(max).toLocaleString()} / ${suffix}`;
    }
    return `${currency} ${Number(job.budget).toLocaleString()} / ${job?.paymentType || 'fixed'}`;
  })();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2, sm: 4, md: 5 },
        px: { xs: 0, sm: 1 },
        pb: isMobile ? '90px' : undefined,
        bgcolor: 'background.default',
      }}
    >
      <Helmet><title>{job?.title ? `${job.title} | Kelmah` : 'Job Details | Kelmah'}</title></Helmet>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/jobs')}
            sx={{ mb: 2.5, color: accentColor, fontWeight: 700, '&:hover': { background: accentSoftBg } }}
          >
            Back to Jobs
          </Button>
        </motion.div>

        {/* ─── HERO HEADER BAR ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3, md: 3.5 },
              mb: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {/* Status + category row */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Chip
                label={(job?.status || 'unknown').toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.5,
                  bgcolor: String(job?.status || '').toLowerCase() === 'open' ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
                  color: String(job?.status || '').toLowerCase() === 'open' ? '#4caf50' : '#ff9800',
                  border: '1px solid',
                  borderColor: String(job?.status || '').toLowerCase() === 'open' ? 'rgba(76,175,80,0.4)' : 'rgba(255,152,0,0.4)',
                }}
              />
              {job?.category && (
                <Chip
                  icon={<Category sx={{ fontSize: '14px !important' }} />}
                  label={job.category}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'divider' }}
                />
              )}
            </Box>

            {/* Big bold title */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.55rem', sm: '1.9rem', md: '2.2rem' },
                color: 'text.primary',
                lineHeight: 1.25,
                mb: 2,
              }}
            >
              {job?.title || 'Job Title'}
            </Typography>

            {/* Meta pills row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <MetaPill icon={LocationOn} label={locationLabel} />
              <MetaPill icon={AttachMoney} label={budgetDisplay} />
              <MetaPill icon={CalendarToday} label={`Posted ${job?.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}`} />
              <MetaPill icon={Groups} label={`${job?.proposalCount || 0} Applicants`} />
              {job?.endDate && <MetaPill icon={AccessTime} label={`Deadline ${new Date(job.endDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}`} />}
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
          <Grid item xs={12} lg={8}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Description */}
              <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                <SectionHeading icon={WorkOutline}>Job Description</SectionHeading>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.8,
                    fontWeight: 500,
                    fontSize: { xs: '0.93rem', sm: '1rem' },
                  }}
                >
                  {job?.description || 'No description available.'}
                </Typography>
              </DetailsPaper>

              {/* Required Skills */}
              {skillLabels.length > 0 && (
                <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                  <SectionHeading icon={VerifiedUser}>Required Skills</SectionHeading>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {skillLabels.map((skill, index) => (
                      <SkillChip key={`${skill}-${index}`} label={skill} variant="outlined" />
                    ))}
                  </Box>
                </DetailsPaper>
              )}

              {/* Project Images */}
              {job.images && job.images.length > 0 && (
                <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                  <SectionHeading icon={Visibility}>Project Images</SectionHeading>
                  <Grid container spacing={2}>
                    {job.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={image?.url || image || index}>
                        <Box
                          component="img"
                          src={typeof image === 'string' ? image : image?.url}
                          alt={`Job image ${index + 1}`}
                          sx={{
                            width: '100%', height: 180, objectFit: 'cover',
                            borderRadius: 2, cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'scale(1.03)' },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </DetailsPaper>
              )}

            </motion.div>
          </Grid>

          {/* ─── SIDEBAR ─────────────────────────────────────────────────────── */}
          <Grid item xs={12} lg={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>

              {/* CTA Card */}
              <DetailsPaper elevation={3} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                  {job?.bidding?.bidStatus === 'open' ? 'Place a Bid' : 'Apply for this Job'}
                </Typography>

                {job?.bidding?.bidStatus === 'open' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.3 }}>
                      Budget range
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: accentColor }}>
                      GH₵ {(job.bidding.minBidAmount || job.budget?.min || 0).toLocaleString()} – {(job.bidding.maxBidAmount || job.budget?.max || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {job.bidding.currentBidders || 0} / {job.bidding.maxBidders || 5} bids placed
                    </Typography>
                  </Box>
                )}

                {!job?.bidding?.bidStatus || job.bidding.bidStatus !== 'open' ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.3 }}>Budget</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: accentColor }}>{budgetDisplay}</Typography>
                  </Box>
                ) : null}

                <ActionButton
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
                    if (job?.bidding?.bidStatus === 'open') setBidDialogOpen(true);
                    else handleApplyNow();
                  }}
                  startIcon={<NoteAlt />}
                  sx={{ mb: 1.5, background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000', fontWeight: 700, py: 1.4, fontSize: '1rem' }}
                >
                  {job?.bidding?.bidStatus === 'open' ? 'Place Your Bid' : 'Apply Now'}
                </ActionButton>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={savingBookmark ? <CircularProgress size={16} /> : (saved ? <Bookmark /> : <BookmarkBorder />)}
                    onClick={handleToggleSave}
                    disabled={savingBookmark}
                    sx={{ color: saved ? accentColor : 'text.primary', borderColor: 'divider', fontWeight: 600 }}
                  >
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                  <IconButton
                    onClick={handleShareJob}
                    aria-label="Share job"
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, color: 'text.primary', px: 1.5, '&:hover': { color: accentColor, borderColor: accentColor, bgcolor: accentSoftBg } }}
                  >
                    <Share />
                  </IconButton>
                </Box>

                {!isAuthenticated && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.5, display: 'block', textAlign: 'center' }}>
                    <Box component="span" onClick={handleSignIn} sx={{ color: accentColor, cursor: 'pointer', fontWeight: 700 }}>Sign in</Box>
                    {' '}to apply or save this job
                  </Typography>
                )}
              </DetailsPaper>

              {/* Job Quick-Facts Card */}
              <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                <SectionHeading>Job Details</SectionHeading>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[{
                    icon: AttachMoney, label: 'Budget', value: budgetDisplay,
                  }, {
                    icon: LocationOn, label: 'Location', value: locationLabel,
                  }, {
                    icon: Category, label: 'Category', value: job?.category || '—',
                  }, {
                    icon: AccessTime, label: 'Deadline', value: job?.endDate ? new Date(job.endDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No deadline',
                  }, {
                    icon: CalendarToday, label: 'Posted', value: job?.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
                  }, {
                    icon: Groups, label: 'Applicants', value: `${job?.proposalCount || 0} people applied`,
                  }].map(({ icon: Icon, label, value }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: accentSoftBg, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.3), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon sx={{ fontSize: 17, color: accentColor }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, mt: 0.1 }}>{value}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </DetailsPaper>

              {/* About the Client Card */}
              <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                <SectionHeading icon={Person}>About the Client</SectionHeading>

                {/* Profile row — clickable */}
                <Box
                  onClick={handleOpenClientProfile}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                    borderRadius: 2, cursor: hirerId ? 'pointer' : 'default',
                    border: '1px solid', borderColor: 'divider',
                    mb: 2,
                    transition: 'all 0.2s',
                    '&:hover': hirerId ? { bgcolor: 'action.hover', borderColor: accentColor } : {},
                  }}
                >
                  <Avatar
                    src={hirerData?.avatar || hirerData?.profilePicture}
                    alt={hirerName}
                    sx={{
                      width: 60, height: 60, flexShrink: 0,
                      bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: '1.3rem',
                    }}
                  >
                    {hirerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                        {hirerName}
                      </Typography>
                      {hirerVerified && (
                        <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} titleAccess="Verified Client" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                      <Star sx={{ fontSize: 15, color: '#FFD700' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {hirerRating ?? 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ({hirerReviews} review{hirerReviews !== 1 ? 's' : ''})
                      </Typography>
                    </Box>
                    {hirerId && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                        <OpenInNew sx={{ fontSize: 12, color: accentColor }} />
                        <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700 }}>View Profile</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Client stats */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5 }}>
                  {hirerJobsPosted !== null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Business sx={{ fontSize: 17, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{hirerJobsPosted}</Box>
                        {' '}job{hirerJobsPosted !== 1 ? 's' : ''} posted
                      </Typography>
                    </Box>
                  )}
                  {hirerLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocationOn sx={{ fontSize: 17, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{hirerLocation}</Typography>
                    </Box>
                  )}
                  {hirerJoined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CalendarToday sx={{ fontSize: 17, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Member since {hirerJoined}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Message />}
                    onClick={handleMessageHirer}
                    disabled={!hirerId}
                    sx={{
                      fontWeight: 600, borderColor: 'divider', color: 'text.primary',
                      '&:hover': { borderColor: accentColor, color: accentColor, bgcolor: accentSoftBg },
                    }}
                  >
                    Message Client
                  </Button>
                  {hirerId && (
                    <Button
                      variant="text"
                      fullWidth
                      startIcon={<OpenInNew />}
                      onClick={handleOpenClientProfile}
                      sx={{ fontWeight: 700, color: accentColor, '&:hover': { bgcolor: accentSoftBg } }}
                    >
                      View Client Profile
                    </Button>
                  )}
                </Box>
              </DetailsPaper>

            </motion.div>
          </Grid>
        </Grid>

        {/* Full-width map section for better wide-screen balance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <DetailsPaper elevation={2} sx={{ mb: 3, overflow: 'hidden', p: 0 }}>
            <Box sx={{ p: 2.5, pb: 1.5 }}>
              <SectionHeading icon={LocationOn}>Job Location</SectionHeading>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 240, sm: 300, md: 360 } }}>
              <iframe
                title="Job Location Map"
                src={`${EXTERNAL_SERVICES.GOOGLE_MAPS.EMBED}?q=${encodeURIComponent(locationLabel || 'Ghana')}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
              />
            </Box>
          </DetailsPaper>
        </motion.div>

        {/* Bid submission dialog */}
        {job && (
          <BidSubmissionForm
            open={bidDialogOpen}
            onClose={() => setBidDialogOpen(false)}
            job={job}
          />
        )}
      </Container>

      {/* Sticky bottom CTA bar for mobile */}
      {isMobile && job && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: `${BOTTOM_NAV_HEIGHT}px`, md: 0 },
            left: 0,
            right: 0,
            zIndex: Z_INDEX.stickyCta,
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.97)
              : alpha(theme.palette.background.paper, 0.98),
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.22) : alpha(theme.palette.divider, 0.85)}`,
            px: 2,
            py: 1.5,
            pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={job?.bidding?.bidStatus === 'open' ? () => {
              if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
              setBidDialogOpen(true);
            } : handleApplyNow}
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              fontWeight: 'bold',
              py: 1.2,
              fontSize: '0.95rem',
              minHeight: 48,
              borderRadius: 2,
              '&:hover': { bgcolor: '#B8941F' },
            }}
          >
            {job?.bidding?.bidStatus === 'open' ? 'Place Your Bid' : 'Apply Now'}
          </Button>
          <IconButton
            onClick={handleToggleSave}
            disabled={savingBookmark}
            aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
            sx={{ color: saved ? accentColor : 'text.primary', minWidth: 48, minHeight: 48 }}
          >
            {saved ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
          <IconButton
            onClick={handleShareJob}
            aria-label="Share job"
            sx={{ color: 'text.primary', minWidth: 48, minHeight: 48 }}
          >
            <Share />
          </IconButton>
        </Box>
      )}

      {/* AUD2-M11 FIX: Non-blocking share feedback instead of alert() */}
      <Snackbar
        open={!!shareSnackbar}
        autoHideDuration={3000}
        onClose={() => setShareSnackbar('')}
        message={shareSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default JobDetailsPage;
