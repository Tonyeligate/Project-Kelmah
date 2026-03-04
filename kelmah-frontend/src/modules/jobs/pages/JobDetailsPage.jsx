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
  Divider,
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
  Schedule,
  Person,
  Star,
  ArrowBack,
  WorkOutline,
  BookmarkBorder,
  Bookmark,
  Share,
  Message,
  NoteAlt,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled, useTheme } from '@mui/material/styles';
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
  color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : '#8B7500',
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

const ProfileLink = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
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

  useEffect(() => {
    // Validate jobId before fetching
    if (!id || id === 'undefined' || id === 'null') {
      if (import.meta.env.DEV) console.error('❌ Invalid job ID:', id);
      return;
    }

    let cancelled = false;
    // Fetch job details (public endpoint — no auth required for viewing)
    dispatch(fetchJobById(id));
    return () => { cancelled = true; };
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
    const recipientId = job.hirer?._id || job.hirer?.id;
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
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton
            variant="rectangular"
            height={60}
            width="20%"
            sx={{ my: 2 }}
          />
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" width="80%" sx={{ mt: 2 }} />
            </Grid>
          </Grid>
        </Box>
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
        <Alert severity="error">{error}</Alert>
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 3, sm: 5, md: 8 },
        px: { xs: 1.5, sm: 2 },
        pb: isMobile ? '80px' : undefined,
        bgcolor: 'background.default',
      }}
    >
      <Helmet><title>Job Details | Kelmah</title></Helmet>
      <Container maxWidth="lg">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/jobs')}
            sx={{
              mb: 3,
              color: 'primary.main',
              '&:hover': {
                background: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Back to Jobs
          </Button>
        </motion.div>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DetailsPaper elevation={3}>
                {/* Job Header */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={(theme) => ({
                      mb: 2,
                      background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold',
                    })}
                  >
                    {job?.title || 'Job Title'}
                  </Typography>

                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ color: 'primary.main', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {locationLabel}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Category sx={{ color: 'primary.main', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {job?.category || 'Category'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoney sx={{ color: 'primary.main', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {job?.budget && job.budget !== null
                          ? typeof job.budget === 'object'
                            ? job.budget.min === job.budget.max
                              ? `${job.budget.currency === 'GHS' ? 'GH₵' : (job.budget.currency || 'GH₵')} ${job.budget.amount?.toLocaleString() || 0} / ${job.budget.type || 'fixed'}`
                              : `${job.budget.currency === 'GHS' ? 'GH₵' : (job.budget.currency || 'GH₵')} ${job.budget.min?.toLocaleString() || 0} - ${job.budget.max?.toLocaleString() || 0} / ${job.budget.type || 'fixed'}`
                            : `${job?.currency === 'GHS' ? 'GH₵' : (job?.currency || 'GH₵')} ${job.budget?.toLocaleString()} / ${job?.paymentType || 'fixed'}`
                          : 'Budget not specified'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ color: 'primary.main', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        Posted:{' '}
                        {job?.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutline sx={{ color: 'primary.main', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {job?.proposalCount || 0} Applicants
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={job?.status || 'Unknown'}
                    sx={{
                      background:
                        String(job?.status || '').toLowerCase() === 'open'
                          ? 'rgba(76, 175, 80, 0.2)'
                          : 'rgba(255, 152, 0, 0.2)',
                      color: String(job?.status || '').toLowerCase() === 'open' ? 'success.main' : 'warning.main',
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Embedded Map for Job Location - shown after key job context */}
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 200, sm: 250, md: 300 },
                      mt: 3,
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    <iframe
                      title="Job Location"
                      src={`${EXTERNAL_SERVICES.GOOGLE_MAPS.EMBED}?q=${encodeURIComponent(locationLabel || 'Ghana')}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  </Box>
                </Box>

                <Divider
                  sx={{ borderColor: 'divider', my: 3 }}
                />

                {/* Job Description */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      fontWeight: 'medium',
                    }}
                  >
                    Description
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.primary',
                      whiteSpace: 'pre-line',
                      mb: 3,
                    }}
                  >
                    {job?.description || 'No description available'}
                  </Typography>

                  {/* Mobile-only map — moved below description for above-fold */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      mb: 3,
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: { xs: 'block', sm: 'none' },
                    }}
                  >
                    <iframe
                      title="Job Location"
                      src={`${EXTERNAL_SERVICES.GOOGLE_MAPS.EMBED}?q=${encodeURIComponent(locationLabel || 'Ghana')}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'primary.main',
                        mb: 1,
                      }}
                    >
                      Required Skills
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skillLabels.map((skill, index) => (
                        <SkillChip key={skill} label={skill} />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Divider
                  sx={{ borderColor: 'divider', my: 3 }}
                />

                {/* Job Images */}
                {job.images && job.images.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                        fontWeight: 'medium',
                      }}
                    >
                      Project Images
                    </Typography>

                    <Grid container spacing={2}>
                      {job.images.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={image.url || image || index}>
                          <Box
                            component="img"
                            src={image}
                            alt={`Job image ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              transition: 'transform 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.03)',
                              },
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                <Divider
                  sx={{ borderColor: 'divider', my: 3 }}
                />

                {/* Additional Info */}
                <Box>
                  {/* Communication Actions */}
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    sx={{ mr: 2, mt: 2 }}
                    onClick={handleMessageHirer}
                    disabled={!job?.hirer?._id && !job?.hirer?.id}
                  >
                    Message Hirer
                  </Button>
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      fontWeight: 'medium',
                    }}
                  >
                    Deadline
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      Complete by:{' '}
                      {job.endDate
                        ? new Date(job.endDate).toLocaleDateString()
                        : 'No deadline specified'}
                    </Typography>
                  </Box>
                </Box>
              </DetailsPaper>
            </motion.div>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DetailsPaper elevation={3} sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'primary.main',
                    mb: 3,
                    fontWeight: 'medium',
                  }}
                >
                  {job?.bidding?.bidStatus === 'open' ? 'Place a Bid' : 'Apply Now'}
                </Typography>

                {job?.bidding?.bidStatus === 'open' ? (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Budget range: GH₵ {(job.bidding.minBidAmount || job.budget?.min || 0).toLocaleString()} – {(job.bidding.maxBidAmount || job.budget?.max || 0).toLocaleString()}
                      {' · '}{job.bidding.currentBidders || 0}/{job.bidding.maxBidders || 5} bids placed
                    </Typography>
                    <ActionButton
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login', { state: { from: location.pathname } });
                          return;
                        }
                        setBidDialogOpen(true);
                      }}
                      startIcon={<NoteAlt />}
                      sx={{
                        mb: 2,
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        color: '#000',
                      }}
                    >
                      Place Your Bid
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleApplyNow}
                    startIcon={<NoteAlt />}
                    sx={{
                      mb: 2,
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      color: '#000',
                    }}
                  >
                    Apply for this Job
                  </ActionButton>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <IconButton
                    onClick={handleToggleSave}
                    disabled={savingBookmark}
                    aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
                    sx={{
                      color: saved ? 'primary.main' : 'text.secondary',
                      width: 44,
                      height: 44,
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                      },
                    }}
                  >
                    {saved ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>

                  <IconButton
                    onClick={handleShareJob}
                    aria-label="Share job"
                    sx={{
                      color: 'text.secondary',
                      width: 44,
                      height: 44,
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Share />
                  </IconButton>
                </Box>
              </DetailsPaper>

              <DetailsPaper elevation={3}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'primary.main',
                    mb: 3,
                    fontWeight: 'medium',
                  }}
                >
                  About the Client
                </Typography>

                <ProfileLink
                  onClick={() => {
                    const hirerId = job.hirer?._id || job.hirer?.id;
                    if (!hirerId) {
                      setShareSnackbar('Client profile is not available yet');
                      return;
                    }
                    navigate(`/profile/${hirerId}`, {
                      state: { profileData: job.hirer },
                    });
                  }}
                >
                  <Avatar
                    src={job.hirer?.avatar || job.hirer?.profilePicture}
                    alt={job.hirer?.firstName || job.hirer?.name || 'Hirer'}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />

                  <Box>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      {job.hirer?.firstName && job.hirer?.lastName
                        ? `${job.hirer.firstName} ${job.hirer.lastName}`
                        : job.hirer?.name || 'Hirer'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ color: 'primary.main', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: 'text.primary', mr: 1 }}>
                        {typeof job.hirer?.rating === 'number' ? job.hirer.rating.toFixed(1) : 'N/A'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                      >
                        ({job.hirer?.reviews || 0} reviews)
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', mt: 0.5 }}
                    >
                      {job.hirer?.jobsPosted || 0} jobs posted
                    </Typography>
                  </Box>
                </ProfileLink>
              </DetailsPaper>
            </motion.div>
          </Grid>
        </Grid>

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
            bgcolor: 'rgba(18, 18, 18, 0.97)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
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
            sx={{ color: saved ? '#D4AF37' : 'text.secondary', minWidth: 48, minHeight: 48 }}
          >
            {saved ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
          <IconButton
            onClick={handleShareJob}
            aria-label="Share job"
            sx={{ color: 'text.secondary', minWidth: 48, minHeight: 48 }}
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
