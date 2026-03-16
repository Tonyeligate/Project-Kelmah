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
  Stack,
  CircularProgress,
  Alert,
  Skeleton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
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
  MailOutline,
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
import { selectIsAuthenticated } from '../../auth/services/authSlice';
import { secureStorage } from '../../../utils/secureStorage';
import { EXTERNAL_SERVICES } from '../../../config/services';
import jobsApi from '../services/jobsService';
import { Z_INDEX, BOTTOM_NAV_HEIGHT, STICKY_CTA_HEIGHT } from '../../../constants/layout';
import { Helmet } from 'react-helmet-async';
import { hasRole } from '../../../utils/userUtils';
import {
  resolveMediaAssetUrl,
  resolveMediaAssetUrls,
  resolveJobVisualUrl,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';

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

const maskEmail = (value) => {
  const email = toDisplayText(value);
  if (!email || !email.includes('@')) return '';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const visibleLocal = localPart.length <= 2 ? localPart.charAt(0) : localPart.slice(0, 2);
  const maskedTail = '•'.repeat(Math.max(localPart.length - visibleLocal.length, 3));
  return `${visibleLocal}${maskedTail}@${domain}`;
};

const getCompactPaymentSuffix = (value) => {
  const suffix = toDisplayText(value, 'fixed').toLowerCase();

  switch (suffix) {
    case 'hour':
    case 'hourly':
    case 'per hour':
      return '/hr';
    case 'day':
    case 'daily':
    case 'per day':
      return '/day';
    case 'week':
    case 'weekly':
    case 'per week':
      return '/wk';
    case 'month':
    case 'monthly':
    case 'per month':
      return '/mo';
    case 'project':
      return 'proj';
    case 'fixed':
    default:
      return 'fix';
  }
};

const formatCompactMoney = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '';

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(absoluteValue >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
  }

  if (absoluteValue >= 1000) {
    return `${(numericValue / 1000).toFixed(absoluteValue >= 100000 ? 0 : 1).replace(/\.0$/, '')}K`;
  }

  return numericValue.toLocaleString();
};

const getCompactBudgetDisplay = (job, currency = 'GH₵') => {
  if (!job?.budget) return 'TBD';

  const suffix = getCompactPaymentSuffix(job?.budget?.type || job?.paymentType || 'fixed');
  const appendSuffix = (amountLabel) => `${amountLabel}${suffix.startsWith('/') ? suffix : ` ${suffix}`}`;

  if (typeof job.budget === 'object') {
    const { min, max, amount } = job.budget;

    if (amount != null) {
      return appendSuffix(`${currency}${formatCompactMoney(amount)}`);
    }

    if (min != null && max != null) {
      if (Number(min) === Number(max)) {
        return appendSuffix(`${currency}${formatCompactMoney(min)}`);
      }

      return appendSuffix(`${currency}${formatCompactMoney(min)}-${formatCompactMoney(max)}`);
    }
  }

  return appendSuffix(`${currency}${formatCompactMoney(job.budget)}`);
};

const formatReadableDate = (value, options) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-GH', options);
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
  const isCompactMobile = useMediaQuery('(max-width:390px)');
  const location = useLocation();
  const { search } = location;
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const job = useSelector(selectCurrentJob);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const authUser = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isWorkerUser = hasRole(authUser, ['worker', 'admin']);
  const isHirerUser = hasRole(authUser, ['hirer']);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
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
    if (params.get('apply') === 'true' && isAuthenticated && isWorkerUser) {
      navigate(`/jobs/${id}/apply`, { replace: true });
    }
  }, [search, isAuthenticated, isWorkerUser, navigate, id]);

  const handleApplyNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}/apply` } });
      return;
    }
    // Navigate to the dedicated application form page for a consistent UX
    navigate(`/jobs/${id}/apply`);
  };

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isHirerUser) {
      navigate('/hirer/find-talents');
      return;
    }

    if (!isWorkerUser) {
      setShareSnackbar('Switch to a worker account to place a bid on this job.');
      return;
    }

    if (job?.bidding?.bidStatus === 'open') {
      setBidDialogOpen(true);
      return;
    }

    handleApplyNow();
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
    navigate(`/messages?recipient=${recipientId}`, {
      state: {
        recipientProfile: {
          id: String(recipientId),
          name:
            job?.hirer?.name ||
            [job?.hirer?.firstName, job?.hirer?.lastName].filter(Boolean).join(' ') ||
            job?.client?.name ||
            'New conversation',
          profilePicture:
            job?.hirer?.profilePicture ||
            job?.hirer?.avatar ||
            job?.client?.profilePicture ||
            null,
        },
      },
    });
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
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Alert severity="error" role="alert">
          {import.meta.env.DEV ? error : 'Failed to load job details. Please try again.'}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => dispatch(fetchJobById(id))}
        >
          Try Again
        </Button>
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
  const rawHirerReviewCount = [
    hirerData?.reviewCount,
    hirerData?.reviewsCount,
    typeof hirerData?.reviews === 'number' ? hirerData.reviews : null,
  ].find((value) => typeof value === 'number' && Number.isFinite(value));
  const hirerRating = typeof hirerData?.rating === 'number' && Number.isFinite(hirerData.rating) && hirerData.rating > 0
    ? hirerData.rating.toFixed(1)
    : null;
  const hirerReviews = typeof rawHirerReviewCount === 'number' ? rawHirerReviewCount : null;
  const hirerAvatarUrl = resolveProfileImageUrl(hirerData) || null;
  const hirerLocation = hirerData?.location?.city || hirerData?.location?.region
    || (typeof hirerData?.location === 'string' ? hirerData.location : null) || null;
  const hirerJoined = hirerData?.createdAt
    ? new Date(hirerData.createdAt).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
    : null;
  const hirerJobsPosted = hirerData?.jobsPosted ?? hirerData?.totalJobs ?? job?.hirerJobsPosted ?? null;
  const hirerVerified = Boolean(hirerData?.isVerified || hirerData?.verified || hirerData?.verification?.isVerified);
  const clientCompany = toDisplayText(hirerData?.companyName || hirerData?.company || hirerData?.organizationName);
  const clientEmail = toDisplayText(hirerData?.email);
  const maskedClientEmail = maskEmail(clientEmail);

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

  const postedDateLabel = formatReadableDate(job?.createdAt || job?.created_at || job?.postedDate, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const deadlineLabel = formatReadableDate(job?.endDate || job?.deadline, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timelineLabel = job?.duration?.value
    ? `${job.duration.value} ${job.duration.unit}${job.duration.value > 1 ? 's' : ''}`
    : deadlineLabel
      ? `Ends ${deadlineLabel}`
      : 'Flexible timeline';
  const hasClientDetails = Boolean(
    hirerId || hirerName || clientCompany || clientEmail || hirerLocation || hirerJoined || hirerJobsPosted !== null,
  );
  const compactBudgetDisplay = getCompactBudgetDisplay(job);
  const clientJobContext = [
    { label: 'Job budget', value: budgetDisplay },
    { label: 'Applications', value: `${job?.proposalCount || 0} received` },
    { label: 'Views', value: `${job?.viewCount || 0} views` },
    { label: 'Start date', value: formatReadableDate(job?.startDate, { day: 'numeric', month: 'long', year: 'numeric' }) || 'To be agreed' },
  ];
  const jobImageGallery = resolveMediaAssetUrls(
    job?.coverImage,
    job?.coverImageMetadata,
    job?.images,
    job?.attachments,
  );
  const primaryJobImage = resolveJobVisualUrl(job);
  const heroHighlights = [
    {
      label: 'Budget',
      value: budgetDisplay,
      caption: job?.paymentType ? `${job.paymentType} payment` : 'Payment terms available',
      icon: AttachMoney,
    },
    {
      label: 'Timeline',
      value: timelineLabel,
      caption: deadlineLabel ? `Deadline ${deadlineLabel}` : 'No fixed deadline published',
      icon: AccessTime,
    },
    {
      label: 'Applicants',
      value: `${job?.proposalCount || 0}`,
      caption: job?.bidding?.bidStatus === 'open' ? 'Bidding is open now' : 'Applications are open now',
      icon: Groups,
    },
    {
      label: 'Client',
      value: hirerName,
      caption: clientCompany || (hirerVerified ? 'Verified client' : 'Client details available below'),
      icon: Business,
    },
  ];
  const mobilePrimaryActionLabel = isHirerUser
    ? 'Find Talent'
    : job?.bidding?.bidStatus === 'open'
      ? (isCompactMobile ? 'Place Bid' : 'Place Your Bid')
      : 'Apply Now';
  const mobileCtaLabel = isHirerUser
    ? (isCompactMobile ? 'Client' : 'Client action')
    : job?.bidding?.bidStatus === 'open'
      ? (isCompactMobile ? 'Budget' : 'Bid range')
      : (isCompactMobile ? 'Budget' : 'Job budget');
  const mobileCtaValue = isHirerUser
    ? (isCompactMobile ? 'Use talent search.' : 'Use talent search for matching workers.')
    : (isCompactMobile ? compactBudgetDisplay : budgetDisplay);

  const handleOpenClientProfile = () => {
    if (!hasClientDetails) {
      setShareSnackbar('Client details are not available yet');
      return;
    }

    setClientDetailsOpen(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2, sm: 4, md: 5 },
        px: { xs: 0, sm: 1 },
        pb: isMobile ? 0 : undefined,
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
            <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="stretch">
              <Grid item xs={12} md={8}>
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

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.55rem', sm: '1.9rem', md: '2.2rem' },
                    color: 'text.primary',
                    lineHeight: 1.25,
                    mb: 1.4,
                    maxWidth: '18ch',
                  }}
                >
                  {job?.title || 'Job Title'}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    lineHeight: 1.7,
                    mb: 2,
                    maxWidth: { md: '70ch' },
                  }}
                >
                  {job?.description
                    ? `${job.description.slice(0, 200)}${job.description.length > 200 ? '…' : ''}`
                    : 'Review the job overview, scope, and client details below before you place a bid.'}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <MetaPill icon={LocationOn} label={locationLabel} />
                  <MetaPill icon={AttachMoney} label={budgetDisplay} />
                  <MetaPill icon={CalendarToday} label={`Posted ${postedDateLabel || 'Unknown'}`} />
                  <MetaPill icon={Groups} label={`${job?.proposalCount || 0} Applicants`} />
                  {deadlineLabel && <MetaPill icon={AccessTime} label={`Deadline ${deadlineLabel}`} />}
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%' }}>
                  {primaryJobImage ? (
                    <Box
                      sx={{
                        position: 'relative',
                        minHeight: { xs: 200, md: 220 },
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%), url(${primaryJobImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-end',
                        p: 1.5,
                      }}
                    >
                      <Box>
                        <Chip
                          label={jobImageGallery.length > 1 ? `${jobImageGallery.length} project visuals` : 'Project visual'}
                          size="small"
                          sx={{
                            mb: 0.75,
                            bgcolor: alpha(theme.palette.common.black, 0.55),
                            color: theme.palette.common.white,
                            fontWeight: 700,
                          }}
                        />
                        <Typography variant="body2" sx={{ color: theme.palette.common.white, fontWeight: 700, lineHeight: 1.5 }}>
                          See the kind of project context the client shared for this job.
                        </Typography>
                      </Box>
                    </Box>
                  ) : null}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 1.25,
                      height: '100%',
                    }}
                  >
                  {heroHighlights.map(({ label, value, caption, icon: Icon }) => (
                    <Box
                      key={label}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.02)
                          : alpha(theme.palette.primary.main, 0.03),
                        minHeight: { md: 0 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {label}
                        </Typography>
                        <Icon sx={{ fontSize: 17, color: accentColor }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.3 }}>
                        {value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                        {caption}
                      </Typography>
                    </Box>
                  ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
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
              {jobImageGallery.length > 0 && (
                <DetailsPaper elevation={2} sx={{ mb: 3 }}>
                  <SectionHeading icon={Visibility}>Project Images</SectionHeading>
                  <Grid container spacing={2}>
                    {jobImageGallery.map((image, index) => (
                      <Grid item xs={12} sm={6} md={index === 0 ? 8 : 4} key={image || index}>
                        <Box
                          component="img"
                          src={image}
                          alt={`Job image ${index + 1}`}
                          sx={{
                            width: '100%', height: index === 0 ? 220 : 180, objectFit: 'cover',
                            borderRadius: 2, cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.03)',
                              '@media (hover: none)': { transform: 'none' },
                            },
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
              <Box sx={{ position: { lg: 'sticky' }, top: { lg: 96 } }}>

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
                  onClick={handlePrimaryAction}
                  startIcon={<NoteAlt />}
                  sx={{ mb: 1.5, background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000', fontWeight: 700, py: 1.4, fontSize: '1rem' }}
                >
                  {isHirerUser
                    ? 'Find Talent Instead'
                    : job?.bidding?.bidStatus === 'open'
                      ? 'Place Your Bid'
                      : 'Apply Now'}
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
                    <Box
                      component="button"
                      type="button"
                      onClick={handleSignIn}
                      sx={{
                        color: accentColor,
                        cursor: 'pointer',
                        fontWeight: 700,
                        font: 'inherit',
                        background: 'none',
                        border: 0,
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Sign in
                    </Box>
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
                    borderRadius: 2, cursor: hasClientDetails ? 'pointer' : 'default',
                    border: '1px solid', borderColor: 'divider',
                    mb: 2,
                    transition: 'all 0.2s',
                    '&:hover': hasClientDetails ? { bgcolor: 'action.hover', borderColor: accentColor } : {},
                  }}
                >
                  <Avatar
                    src={hirerAvatarUrl}
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
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.35 }}>
                      {clientCompany || 'Client on Kelmah'}
                    </Typography>
                    {hirerRating && hirerReviews ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.45 }}>
                        <Star sx={{ fontSize: 15, color: '#FFD700' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {hirerRating}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ({hirerReviews} review{hirerReviews !== 1 ? 's' : ''})
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.45 }}>
                        No public reviews shared yet
                      </Typography>
                    )}
                    {hasClientDetails && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                        <OpenInNew sx={{ fontSize: 12, color: accentColor }} />
                        <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700 }}>View details</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Client stats */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5 }}>
                  {clientCompany && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Business sx={{ fontSize: 17, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{clientCompany}</Typography>
                    </Box>
                  )}
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
                  {maskedClientEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MailOutline sx={{ fontSize: 17, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Contact: {maskedClientEmail}
                      </Typography>
                    </Box>
                  )}
                  {!clientCompany && !hirerLocation && !hirerJoined && hirerJobsPosted === null && !maskedClientEmail && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      This client has not shared extra public profile details yet. Use the job brief and message flow to confirm fit.
                    </Typography>
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
                  {hasClientDetails && (
                    <Button
                      variant="text"
                      fullWidth
                      startIcon={<OpenInNew />}
                      onClick={handleOpenClientProfile}
                      sx={{ fontWeight: 700, color: accentColor, '&:hover': { bgcolor: accentSoftBg } }}
                    >
                      View Client Details
                    </Button>
                  )}
                </Box>
              </DetailsPaper>
              </Box>

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

        <Dialog
          open={clientDetailsOpen}
          onClose={() => setClientDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="client-details-title"
        >
          <DialogTitle id="client-details-title" sx={{ pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 5 }}>
              <Avatar
                src={hirerAvatarUrl}
                alt={hirerName}
                sx={{ width: 64, height: 64, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}
              >
                {hirerName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {hirerName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.35 }}>
                  {clientCompany || 'Client on Kelmah'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                  <Chip size="small" label={job?.visibility === 'private' ? 'Private listing' : 'Public listing'} />
                  <Chip size="small" label={job?.bidding?.bidStatus === 'open' ? 'Accepting bids' : 'Applications open'} />
                  {hirerVerified && <Chip size="small" color="success" label="Verified client" />}
                </Box>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.25 }}>
              Client snapshot
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              {[
                clientCompany ? { label: 'Business', value: clientCompany } : null,
                hirerLocation ? { label: 'Location', value: hirerLocation } : null,
                hirerJoined ? { label: 'Member since', value: hirerJoined } : null,
                hirerJobsPosted !== null ? { label: 'Jobs posted', value: `${hirerJobsPosted}` } : null,
                maskedClientEmail ? { label: 'Protected contact', value: maskedClientEmail } : null,
              ].filter(Boolean).map((item) => (
                <Grid item xs={12} sm={6} key={item.label}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1.5,
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700, mt: 0.5, lineHeight: 1.4 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ mb: 2.5 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.25 }}>
              From this job posting
            </Typography>
            <Grid container spacing={1.5}>
              {clientJobContext.map((item) => (
                <Grid item xs={12} sm={6} key={item.label}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1.5,
                      height: '100%',
                      bgcolor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.02)
                        : alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700, mt: 0.5, lineHeight: 1.4 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2.5, lineHeight: 1.7 }}>
              To protect privacy, Kelmah keeps direct client contact limited. Start a conversation or submit a bid to continue the engagement professionally.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setClientDetailsOpen(false)} sx={{ fontWeight: 700 }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setClientDetailsOpen(false);
                handleMessageHirer();
              }}
              startIcon={<Message />}
              disabled={!hirerId}
            >
              Message Client
            </Button>
          </DialogActions>
        </Dialog>

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
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: Z_INDEX.stickyCta,
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.97)
              : alpha(theme.palette.background.paper, 0.98),
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.22) : alpha(theme.palette.divider, 0.85)}`,
            px: 1.5,
            py: 1,
            pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 0.75,
            backdropFilter: 'blur(8px)',
            boxShadow: `0 -12px 30px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.35 : 0.12)}`,
          }}
        >
          <Box sx={{ minWidth: 0, pr: 0.25 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.2, letterSpacing: 0.24, lineHeight: 1.2 }}
            >
              {mobileCtaLabel}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 800,
                lineHeight: 1.2,
                fontSize: { xs: '0.9rem', sm: '0.98rem' },
                pr: 0.5,
                whiteSpace: isCompactMobile ? 'nowrap' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {mobileCtaValue}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              onClick={handlePrimaryAction}
              sx={{
                bgcolor: '#D4AF37',
                color: '#000',
                fontWeight: 'bold',
                py: 0.95,
                px: { xs: 1.75, sm: 3 },
                fontSize: { xs: '0.88rem', sm: '0.95rem' },
                minHeight: 42,
                borderRadius: 2,
                minWidth: { xs: 96, sm: 156 },
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#B8941F' },
              }}
            >
              {mobilePrimaryActionLabel}
            </Button>
            <IconButton
              onClick={handleToggleSave}
              disabled={savingBookmark}
              aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
              sx={{ color: saved ? accentColor : 'text.primary', minWidth: 40, minHeight: 40 }}
            >
              {saved ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
            <IconButton
              onClick={handleShareJob}
              aria-label="Share job"
              sx={{ color: 'text.primary', minWidth: 40, minHeight: 40 }}
            >
              <Share />
            </IconButton>
          </Stack>
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

