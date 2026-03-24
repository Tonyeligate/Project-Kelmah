import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';"
import workerService from '../services/workerService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Stack,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Skeleton,
  CircularProgress,
  Container,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  EmojiEvents as AwardIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  BusinessCenter as BusinessCenterIcon,
  LocalOffer as PriceIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  GroupWork as CollabIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
  Reviews as ReviewsIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import TextField from '@mui/material/TextField';
import ReviewSystem from '../../../components/reviews/ReviewSystem';
import { BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
import reviewService from '../../reviews/services/reviewService';
import { hasRole } from '../../../utils/userUtils';
import {
  useBreakpointDown,
} from '../../../hooks/useResponsive';
import {
  resolveMediaAssetUrl,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';
import { devError } from '@/modules/common/utils/devLogger';

const Input = styled('input')({
  display: 'none',
});

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 200,
  height: 200,
  [theme.breakpoints.down('md')]: {
    width: 120,
    height: 120,
    fontSize: '2.5rem',
  },
  [theme.breakpoints.down('sm')]: {
    width: 96,
    height: 96,
    fontSize: '2rem',
  },
  border: `6px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[20],
  margin: 'auto',
  backgroundColor: theme.palette.primary.main,
  fontSize: '4rem',
  fontWeight: 700,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: 3,
  },
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[20],
    background: alpha(theme.palette.background.paper, 0.95),
  },
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
  fontWeight: 600,
  maxWidth: '100%',
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 180,
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
  transition: 'all 0.2s ease-in-out',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 16,
  textAlign: 'center',
  padding: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '12px 24px',
  minHeight: 44,
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

const getCanonicalWorkerProfilePath = (workerId) =>
  workerId ? `/workers/${encodeURIComponent(String(workerId))}` : '/find-talents';

const normalizeWorkerSkillList = (skills) =>
  Array.isArray(skills)
    ? skills
      .map((skill) => ({
        name: skill?.name || skill?.skillName || skill?.label || String(skill || '').trim(),
      }))
      .filter((skill) => skill.name)
    : [];

const normalizeAvailabilityHoursMap = (availableHours) => {
  if (Array.isArray(availableHours)) {
    return availableHours.reduce((accumulator, entry) => {
      if (!entry?.day) {
        return accumulator;
      }

      accumulator[String(entry.day).toLowerCase()] = {
        available: entry.available !== false,
        start: entry.start || '08:00',
        end: entry.end || '17:00',
      };

      return accumulator;
    }, {});
  }

  if (availableHours && typeof availableHours === 'object') {
    return availableHours;
  }

  return {};
};

const buildAvailabilityHoursMap = (availability) => {
  const directHours = normalizeAvailabilityHoursMap(availability?.availableHours);
  if (Object.keys(directHours).length > 0) {
    return directHours;
  }

  if (!Array.isArray(availability?.daySlots)) {
    return {};
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return availability.daySlots.reduce((accumulator, slot) => {
    const dayName = typeof slot?.dayOfWeek === 'number' ? days[slot.dayOfWeek] : null;
    const firstSlot = Array.isArray(slot?.slots) ? slot.slots[0] : null;

    if (!dayName || !firstSlot?.start || !firstSlot?.end) {
      return accumulator;
    }

    accumulator[dayName] = {
      available: true,
      start: firstSlot.start,
      end: firstSlot.end,
    };

    return accumulator;
  }, {});
};

const getPortfolioItems = (worker) =>
  Array.isArray(worker?.portfolio?.items) ? worker.portfolio.items : [];

const getCertificateItems = (worker) =>
  Array.isArray(worker?.certifications?.items) ? worker.certifications.items : [];

function WorkerProfile({ workerId: workerIdProp }) {
  const routeParams = useParams();
  const { user: authUser, isAuthenticated } = useSelector((state) => state.auth);
  const resolvedWorkerId =
    workerIdProp ?? routeParams?.workerId ?? authUser?.userId ?? null;

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const isTablet = useBreakpointDown('lg');
  const isActualMobile = isMobile;

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [workHistory, setWorkHistory] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [stats, setStats] = useState({});
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [earnings, setEarnings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);
  const [mobileHeroParallaxOffset, setMobileHeroParallaxOffset] = useState(0);

  const aboutSectionRef = useRef(null);
  const portfolioSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);

  const getPortfolioPreviewImage = useCallback((item) => {
    return (
      resolveMediaAssetUrl([
        item?.image,
        item?.mainImage,
        item?.thumbnailUrl,
        item?.images,
      ]) || null
    );
  }, []);

  const getCertificatePreviewImage = useCallback((certificate) => {
    return (
      resolveMediaAssetUrl(certificate?.metadata?.file, {
        preferThumbnail: true,
      }) ||
      resolveMediaAssetUrl([
        certificate?.thumbnailUrl,
        certificate?.url,
      ]) ||
      null
    );
  }, []);

  const isOwner =
    authUser?.userId && resolvedWorkerId
      ? authUser.userId === resolvedWorkerId
      : false;
  const canHireWorker = hasRole(authUser, ['hirer', 'admin']);

  const scrollToSection = useCallback((sectionRef) => {
    if (sectionRef?.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleHireAction = useCallback(() => {
    if (!authUser) {
      navigate('/login', {
        state: {
          from: `${window.location.pathname}${window.location.search}`,
          message: 'Please sign in as a hirer to hire this worker.',
        },
      });
      return;
    }

    if (!canHireWorker) {
      setFeedbackMessage('Only hirer accounts can create contracts.');
      return;
    }

    navigate(`/contracts/create?workerId=${resolvedWorkerId}`);
  }, [authUser, canHireWorker, navigate, resolvedWorkerId]);

  const fetchAllData = useCallback(async () => {
    if (!resolvedWorkerId) {
      setError('Worker profile could not be found.');
      setLoading(false);
      return;
    }

    setProfile(null);
    setSkills([]);
    setPortfolio([]);
    setCertificates([]);
    setReviews([]);
    setRatingSummary(null);
    setWorkHistory([]);
    setAvailability(null);
    setStats({});
    setProfileCompletion(null);
    setEarnings(null);
    setLoading(true);
    setError(null);

    try {
      const profileRes = await workerService.getWorkerById(resolvedWorkerId);
      const worker =
        profileRes?.data?.data?.worker ||
        profileRes?.data?.worker ||
        profileRes?.data;

      const fallbackRatingSummary = {
        averageRating: Number(worker?.stats?.rating ?? worker?.rating ?? 0),
        totalReviews: Number(worker?.stats?.totalReviews ?? worker?.totalReviews ?? 0),
      };

      const normalizedProfile = worker
        ? {
          ...worker,
          user: worker.user,
          hourly_rate:
            worker.rate?.amount ??
            worker.hourlyRate ??
            worker.rate?.min ??
            worker.rate?.max ??
            0,
          is_verified:
            worker.verification?.isVerified ?? worker.isVerified ?? false,
          profile_picture: worker.profile?.picture ?? worker.profilePicture,
          average_rating: fallbackRatingSummary.averageRating,
          experience_years: Number(worker.experience?.years ?? worker.yearsOfExperience ?? 0),
          is_online: false,
        }
        : null;

      setProfile(normalizedProfile);
      setSkills(normalizeWorkerSkillList(worker?.skills));
      setPortfolio(getPortfolioItems(worker));
      setCertificates(getCertificateItems(worker));
      setAvailability(worker?.availability || null);
      setStats(worker?.stats || {});
      setRatingSummary(fallbackRatingSummary);

      const viewingOwnProfile =
        authUser?.userId && authUser.userId === resolvedWorkerId;

      const results = await Promise.allSettled([
        workerService.getWorkHistory(resolvedWorkerId),
        workerService.getWorkerStats(resolvedWorkerId),
        reviewService.getWorkerRating(resolvedWorkerId),
        reviewService.getWorkerReviews(resolvedWorkerId, {
          page: 1,
          limit: 6,
          status: 'approved',
          sortBy: 'createdAt',
          order: 'desc',
        }),
        viewingOwnProfile
          ? workerService.getWorkerEarnings(resolvedWorkerId)
          : Promise.resolve(null),
      ]);

      const getValue = (result, fallback = null) =>
        result.status === 'fulfilled' ? result.value : fallback;

      const [historyRes, completionRes, ratingRes, reviewListRes, earningsRes] = results.map((result) =>
        getValue(result)
      );

      const historyPayload = historyRes?.data?.data || historyRes?.data || [];
      const normalizedHistory = Array.isArray(historyPayload)
        ? historyPayload
        : Array.isArray(historyPayload?.workHistory)
          ? historyPayload.workHistory
          : [];

      const normalizedReviews = Array.isArray(reviewListRes?.reviews)
        ? reviewListRes.reviews
        : Array.isArray(reviewListRes?.data?.reviews)
          ? reviewListRes.data.reviews
          : Array.isArray(reviewListRes)
            ? reviewListRes
            : [];

      setReviews(normalizedReviews);
      setRatingSummary(ratingRes || fallbackRatingSummary);
      setWorkHistory(normalizedHistory);
      setProfileCompletion(completionRes || null);
      setEarnings(earningsRes?.data?.data || earningsRes?.data || null);
    } catch (err) {
      setError('Could not find this worker. Please try again.');
      devError(err);
    } finally {
      setLoading(false);
    }
  }, [authUser?.userId, resolvedWorkerId]);

  useEffect(() => {
    if (!resolvedWorkerId) {
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);
    setSkills([]);
    setPortfolio([]);
    setCertificates([]);
    setReviews([]);
    setRatingSummary(null);
    setWorkHistory([]);
    setAvailability(null);
    setStats({});
    setProfileCompletion(null);
    setEarnings(null);
    setTabValue(0);
    setShowFullBio(false);

    fetchAllData();

    if (!authUser) {
      setIsBookmarked(false);
      return;
    }

    workerService
      .getBookmarks()
      .then((res) => {
        const ids = res?.data?.data?.workerIds || [];
        setIsBookmarked(ids.includes(resolvedWorkerId));
      })
      .catch((bookmarkError) => {
        if (
          bookmarkError?.response?.status !== 401 &&
          import.meta.env.DEV &&
          import.meta.env.VITE_DEBUG_FRONTEND === 'true'
        ) {
          devError('Failed to load bookmarks', bookmarkError);
        }
      });
  }, [authUser, fetchAllData, resolvedWorkerId, workerIdProp]);

  useEffect(() => {
    if (!isActualMobile) {
      setMobileHeroParallaxOffset(0);
      return;
    }

    let rafId = null;
    const onScroll = () => {
      if (rafId) {
        return;
      }

      rafId = requestAnimationFrame(() => {
        const nextOffset = Math.min(window.scrollY * 0.12, 16);
        setMobileHeroParallaxOffset(nextOffset);
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isActualMobile]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleContactWorker = () => {
    if (!authUser) {
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }
    const recipientId =
      profile?.user?.id ||
      profile?.user?._id ||
      profile?.userId ||
      resolvedWorkerId;

    if (recipientId) {
      navigate(`/messages?recipient=${encodeURIComponent(String(recipientId))}`, {
        state: {
          recipientProfile: {
            id: String(recipientId),
            name:
              profile?.user?.name ||
              [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(' ') ||
              profile?.name ||
              'New conversation',
            profilePicture:
              profile?.profile_picture ||
              profile?.user?.profilePicture ||
              profile?.profilePicture ||
              null,
          },
        },
      });
    }
  };

  const handleBookmarkToggle = async () => {
    if (!resolvedWorkerId) {
      return;
    }
    const nextState = !isBookmarked;
    try {
      setIsBookmarked(nextState);
      if (nextState) {
        await workerService.bookmarkWorker(resolvedWorkerId);
      } else {
        await workerService.removeBookmark(resolvedWorkerId);
      }
      setFeedbackMessage(
        nextState ? 'Worker saved for later' : 'Worker removed from saved',
      );
    } catch (_) {
      setIsBookmarked(!nextState);
      setFeedbackMessage('Unable to update saved worker right now');
    }
  };

  const handleShare = async () => {
    const canonicalUrl = resolvedWorkerId
      ? `${window.location.origin}${getCanonicalWorkerProfilePath(resolvedWorkerId)}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.user?.firstName} ${profile?.user?.lastName} - ${profile?.profession}`,
          text: `Check out this skilled ${profile?.profession} on Kelmah`,
          url: canonicalUrl,
        });
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setFeedbackMessage('Share was not completed. Try again.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(canonicalUrl);
        setFeedbackMessage('Profile link copied');
      } catch {
        setFeedbackMessage('Unable to copy link on this device');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Skeleton
            variant="circular"
            width={200}
            height={200}
            sx={{ mx: 'auto', mb: 2 }}
          />
          <Skeleton
            variant="text"
            width={300}
            height={40}
            sx={{ mx: 'auto', mb: 1 }}
          />
          <Skeleton
            variant="text"
            width={200}
            height={30}
            sx={{ mx: 'auto', mb: 2 }}
          />
          <Box
            sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}
          >
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={`profile-chip-skeleton-${i}`}
                variant="rectangular"
                width={100}
                height={32}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} md={4} key={`profile-card-skeleton-${i}`}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Worker profile not found.
        </Alert>
      </Container>
    );
  }

  const profileAvatarUrl =
    resolveProfileImageUrl({
      profilePicture: profile.profile_picture,
      profileImage: profile.profilePicture,
    }) || null;
  const profileHeroImage =
    resolveMediaAssetUrl([
      profile.bannerImage,
      profile.profile_picture,
      profile.profilePicture,
      portfolio[0],
    ]) || '';

  const renderProfileHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard sx={{ mb: 4, overflow: 'visible', position: 'relative' }}>
        <Box
          sx={{
            background: profileHeroImage
              ? `linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.6) 100%), url(${profileHeroImage})`
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: 200,
            position: 'relative',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 1,
            }}
          >
            <IconButton
              onClick={handleBookmarkToggle}
              aria-label={isBookmarked ? 'Remove from saved' : 'Save worker'}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
                width: 44,
                height: 44,
              }}
            >
              {isBookmarked ? (
                <BookmarkIcon color="primary" />
              ) : (
                <BookmarkBorderIcon />
              )}
            </IconButton>
            <IconButton
              onClick={handleShare}
              aria-label="Share this profile"
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
                width: 44,
                height: 44,
              }}
            >
              <ShareIcon />
            </IconButton>
            {isOwner && (
              <IconButton
                onClick={() => navigate('/worker/profile/edit')}
                aria-label="Edit your profile"
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover': { bgcolor: theme.palette.background.paper },
                  width: 44,
                  height: 44,
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <CardContent sx={{ pt: 0, pb: 4 }}>
          <Box sx={{ textAlign: 'center', mt: -10 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                profile.is_verified ? (
                  <Tooltip title="Verified Professional">
                    <VerifiedIcon
                      sx={{
                        width: 40,
                        height: 40,
                        color: theme.palette.success.main,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                    />
                  </Tooltip>
                ) : null
              }
            >
              <ProfileAvatar
                src={profileAvatarUrl}
                alt={`${profile.user?.firstName} ${profile.user?.lastName}`}
                role="img"
                aria-label={`${profile.user?.firstName || 'Worker'} ${profile.user?.lastName || ''} profile photo`}
              >
                {profile.user?.firstName?.charAt(0)}
                {profile.user?.lastName?.charAt(0)}
              </ProfileAvatar>
            </Badge>

            <Typography
              variant="h3"
              fontWeight={700}
              sx={{
                mt: 2,
                mb: 1,
                color: theme.palette.text.primary,
                fontSize: { xs: '1.65rem', sm: '2rem', md: '2.25rem' },
                lineHeight: 1.22,
                letterSpacing: '-0.01em',
              }}
            >
              {profile.user?.firstName} {profile.user?.lastName}
              {profile.is_online && (
                <Chip
                  label="Online"
                  size="small"
                  color="success"
                  sx={{ ml: 2, fontWeight: 600 }}
                />
              )}
            </Typography>

            <Typography
              variant="h5"
              color="primary"
              gutterBottom
              fontWeight={600}
              sx={{ mb: 2, fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.3rem' }, lineHeight: 1.35 }}
            >
              {profile.profession}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating
                  value={ratingSummary?.averageRating ?? profile.average_rating ?? 0}
                  precision={0.1}
                  readOnly
                  size="large"
                />
                <Typography variant="h6" fontWeight={600}>
                  {(ratingSummary?.averageRating ?? profile.average_rating ?? 0).toFixed(1)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  ({ratingSummary?.totalReviews ?? stats.totalReviews ?? reviews.length} reviews)
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
                lineHeight: 1.72,
                fontSize: { xs: '0.98rem', sm: '1.06rem', md: '1.1rem' },
              }}
            >
              {profile.bio ||
                'Professional craftsperson dedicated to delivering quality work.'}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 3 }}
            >
              <Chip label={`${portfolio.length} portfolio item${portfolio.length === 1 ? '' : 's'}`} variant="outlined" />
              <Chip label={`${certificates.length} certificate${certificates.length === 1 ? '' : 's'}`} variant="outlined" />
              {profileHeroImage ? <Chip label="Visual profile ready" color="success" variant="outlined" /> : null}
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 680, mx: 'auto' }}
            >
              Trust tip: review verified badges, ratings, and recent portfolio examples before confirming a hire.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <AnimatedButton
                variant="contained"
                size="large"
                startIcon={<MessageIcon />}
                onClick={handleContactWorker}
                disabled={isOwner}
              >
                Message Worker
              </AnimatedButton>

              {!isOwner && (
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<BusinessCenterIcon />}
                  onClick={handleHireAction}
                >
                  Hire Now
                </AnimatedButton>
              )}
            </Stack>
          </Box>
        </CardContent>
      </GlassCard>
    </motion.div>
  );

  const renderMetrics = () => {
    const statsData = stats || {};
    const completionData = profileCompletion || {};
    const totalAllTime =
      statsData.totalEarnings || earnings?.totals?.allTime || 0;
    const last30 = earnings?.totals?.last30Days || 0;
    const last7 = earnings?.totals?.last7Days || 0;
    const jobsCompleted =
      statsData.totalJobsCompleted || statsData.jobsCompleted || 0;
    const completionRate =
      completionData.completionPercentage ??
      statsData.completionRate ??
      0;
    const averageRating = Number(statsData.rating ?? ratingSummary?.averageRating ?? 0);
    const averageResponseTime = Number(statsData.averageResponseTime ?? 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Mobile Performance Stats for Owner */}
        {isActualMobile && isOwner && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                letterSpacing: '-0.015em',
                mb: 2,
              }}
            >
              Your Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor:
                      theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography
                    sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}
                  >
                    Earnings (30d)
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    GH₵ {last30}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#4CAF50',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    7d: GH₵ {last7}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor:
                      theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography
                    sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}
                  >
                    Jobs Completed
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {jobsCompleted}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    total completed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor:
                      theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography
                    sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}
                  >
                    Reviews
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {statsData.totalReviews || 0} reviews
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Mobile Earnings Summary for Owner */}
        {isActualMobile && isOwner && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                letterSpacing: '-0.015em',
                mb: 2,
              }}
            >
              Earnings Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor:
                      theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mb: 0.5,
                          }}
                        >
                          All-Time Earnings
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                          }}
                        >
                          GH₵ {totalAllTime}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mb: 0.5,
                          }}
                        >
                          Profile Completion
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#E65100',
                          }}
                        >
                          {completionRate}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mb: 0.5,
                          }}
                        >
                          Avg Response
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#1565C0',
                          }}
                        >
                          {averageResponseTime > 0 ? `${averageResponseTime}h` : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<MoneyIcon />}
                          onClick={() => navigate('/payments')}
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            borderRadius: '16px',
                            px: 2,
                            minHeight: 44,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            },
                          }}
                        >
                          Get Paid
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Regular Professional Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <MetricCard>
              <WorkIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight={700} color="primary">
                {profile.experience_years || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Years Experience
              </Typography>
            </MetricCard>
          </Grid>

          <Grid item xs={6} md={3}>
            <MetricCard>
              <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight={700} color="primary">
                {jobsCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jobs Completed
              </Typography>
            </MetricCard>
          </Grid>

          <Grid item xs={6} md={3}>
            <MetricCard>
              <PriceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight={700} color="primary">
                GH₵ {profile.hourly_rate || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per Hour
              </Typography>
            </MetricCard>
          </Grid>

          <Grid item xs={6} md={3}>
            <MetricCard>
              <TrendingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight={700} color="primary">
                {completionRate}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profile Completion
              </Typography>
            </MetricCard>
          </Grid>
        </Grid>

        {Array.isArray(earnings?.breakdown?.byMonth) &&
          earnings.breakdown.byMonth.length > 0 && (
            <GlassCard sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings (last 12 months)
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-end',
                    height: 120,
                  }}
                >
                  {earnings.breakdown.byMonth.map((m, idx) => {
                    const max =
                      Math.max(
                        ...earnings.breakdown.byMonth.map((x) => x.amount || 0),
                      ) || 1;
                    const h = Math.max(
                      4,
                      Math.round(((m.amount || 0) / max) * 100),
                    );
                    return (
                      <Box
                        key={`${m?.year || 'year'}-${m?.month || 'month'}-${idx}`}
                        sx={{
                          width: 10,
                          height: h,
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 1,
                        }}
                        title={`M${m.month}: GH₵ ${m.amount}`}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </GlassCard>
          )}
      </motion.div>
    );
  };

  const renderSkillsAndExpertise = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <BuildIcon color="primary" />
          Skills & Expertise
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Primary Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {skills.slice(0, 8).map((skill, index) => (
                <SkillChip
                  key={skill.id || skill._id || skill.name || `skill-${index}`}
                  label={skill.name}
                  size="medium"
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              What I Do Best
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.specializations?.length > 0 ? (
                profile.specializations.map((spec, index) => (
                  <Chip
                    key={`${spec}-${index}`}
                    label={spec}
                    variant="outlined"
                    color="primary"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not listed yet
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Tools & Equipment
            </Typography>
            {profile.tools?.length > 0 ? (
              <List dense>
                {profile.tools.map((tool, index) => (
                  <ListItem key={`${tool}-${index}`}>
                    <ListItemText primary={tool} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tools or equipment listed yet
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </GlassCard>
  );

  const renderPortfolio = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ViewIcon color="primary" />
          Portfolio & Previous Work
        </Typography>

        {portfolio.length > 0 ? (
          <Grid container spacing={2}>
            {portfolio.map((item, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={item.id || item._id || item.title || `portfolio-${index}`}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[12],
                    },
                  }}
                  onClick={() => {
                    setSelectedPortfolioItem(item);
                    setPortfolioDialogOpen(true);
                  }}
                >
                  {getPortfolioPreviewImage(item) ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={getPortfolioPreviewImage(item)}
                      alt={item.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
                    />
                  ) : null}
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ViewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No portfolio items available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later to see this worker's completed projects
            </Typography>
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );

  const renderReviews = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <StarIcon color="primary" />
          Client Reviews
        </Typography>
        <ReviewSystem workerId={resolvedWorkerId} showSubmissionForm />
      </CardContent>
    </GlassCard>
  );

  const renderAvailability = () => {
    const availabilityStatus = availability?.status || availability?.availabilityStatus || 'available';
    const availabilityHours = buildAvailabilityHoursMap(availability);
    const averageResponseLabel = stats?.averageResponseTime
      ? `${stats.averageResponseTime}h average`
      : 'Not specified';

    return (
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Typography
            variant="h5"
            fontWeight={700}
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ScheduleIcon color="primary" />
            Availability
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>
              <Chip
                label={availabilityStatus
                  .toString()
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                color={availabilityStatus === 'available' ? 'success' : 'warning'}
                size="large"
                sx={{ mb: 2 }}
              />

              <Typography variant="body1" gutterBottom>
                <strong>Response Time:</strong> {averageResponseLabel}
              </Typography>
              <Typography variant="body1">
                <strong>Next Available:</strong>{' '}
                {availability?.nextAvailable ||
                  (availability?.pausedUntil
                    ? new Date(availability.pausedUntil).toLocaleString()
                    : 'Immediately')}
              </Typography>
              {isOwner && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="medium"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ minHeight: 44 }}
                    onClick={() => {
                      setEditingAvailability(true);
                      setAvailabilityDraft({
                        availabilityStatus,
                        availableHours: availabilityHours,
                        pausedUntil: availability?.pausedUntil || null,
                      });
                    }}
                  >
                    Edit Availability
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Working Hours
              </Typography>
              <List dense>
                {(() => {
                  const days = [
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday',
                  ];
                  const lines = days.map((day) => {
                    const slot = availabilityHours[day];
                    if (!slot) {
                      return `${day[0].toUpperCase()}${day.slice(1)}: Unspecified`;
                    }
                    if (!slot.available) {
                      return `${day[0].toUpperCase()}${day.slice(1)}: Unavailable`;
                    }
                    return `${day[0].toUpperCase()}${day.slice(1)}: ${slot.start} - ${slot.end}`;
                  });
                  return lines.map((text, index) => (
                    <ListItem key={`${text}-${index}`}>
                      <ListItemText primary={text} />
                    </ListItem>
                  ));
                })()}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </GlassCard>
    );
  };

  const renderAvailabilityEditor = () => {
    if (!editingAvailability || !isOwner) return null;
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const draft = availabilityDraft || {
      availabilityStatus: 'available',
      availableHours: {},
    };
    const setDay = (day, patch) => {
      setAvailabilityDraft((prev) => ({
        ...prev,
        availableHours: {
          ...(prev?.availableHours || {}),
          [day]: {
            ...(prev?.availableHours?.[day] || {
              available: false,
              start: '08:00',
              end: '17:00',
            }),
            ...patch,
          },
        },
      }));
    };
    const save = async () => {
      try {
        await workerService.updateWorkerAvailability(resolvedWorkerId, draft);
        setAvailability({
          status: draft.availabilityStatus,
          availabilityStatus: draft.availabilityStatus,
          availableHours: draft.availableHours,
          pausedUntil: draft.pausedUntil || null,
        });
        setEditingAvailability(false);
      } catch {
        // Availability update failed
      }
    };
    return (
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Availability
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              select
              label="Status"
              value={draft.availabilityStatus}
              onChange={(e) =>
                setAvailabilityDraft((p) => ({
                  ...p,
                  availabilityStatus: e.target.value,
                }))
              }
              SelectProps={{ native: true }}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
              <option value="vacation">Vacation</option>
            </TextField>
            <TextField
              label="Paused Until (ISO)"
              placeholder="YYYY-MM-DDTHH:mm:ssZ"
              value={draft.pausedUntil || ''}
              onChange={(e) =>
                setAvailabilityDraft((p) => ({
                  ...p,
                  pausedUntil: e.target.value,
                }))
              }
              sx={{ minWidth: { xs: '100%', sm: 320 }, flex: 1 }}
            />
          </Box>
          <Grid container spacing={2}>
            {days.map((day) => {
              const d = draft.availableHours?.[day] || {
                available: false,
                start: '08:00',
                end: '17:00',
              };
              return (
                <Grid item xs={12} md={6} key={day}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {day[0].toUpperCase() + day.slice(1)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        size="small"
                        variant={d.available ? 'contained' : 'outlined'}
                        sx={{ minHeight: 44 }}
                        onClick={() => setDay(day, { available: !d.available })}>
                        {d.available ? 'Available' : 'Unavailable'}
                      </Button>
                      <TextField
                        size="small"
                        label="Start"
                        placeholder="HH:mm"
                        value={d.start}
                        onChange={(e) => setDay(day, { start: e.target.value })}
                        disabled={!d.available}
                      />
                      <TextField
                        size="small"
                        label="End"
                        placeholder="HH:mm"
                        value={d.end}
                        onChange={(e) => setDay(day, { end: e.target.value })}
                        disabled={!d.available}
                      />
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" startIcon={<CheckIcon />} sx={{ minHeight: 44 }} onClick={save}>
              Save
            </Button>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              sx={{ minHeight: 44 }}
              onClick={() => setEditingAvailability(false)}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
      </GlassCard>
    );
  };

  const renderCertifications = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SchoolIcon color="primary" />
          Certificates & Proof
        </Typography>

        {certificates.length > 0 ? (
          <Grid container spacing={2}>
            {certificates.map((cert, index) => {
              const certificatePreview = getCertificatePreviewImage(cert);

              return (
                <Grid
                  item
                  xs={12}
                  md={6}
                  key={cert.id || cert._id || cert.name || `certificate-${index}`}
                >
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {certificatePreview ? (
                        <Box
                          component="img"
                          src={certificatePreview}
                          alt={cert.name || 'Certificate preview'}
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '1px solid',
                            borderColor: 'divider',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72 }}>
                          <AwardIcon />
                        </Avatar>
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {cert.issuing_organization}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Issued: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                      {cert.is_verified && <VerifiedIcon color="success" />}
                    </Box>
                    {cert.url && (
                      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          component="a"
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          variant="outlined"
                        >
                          View proof
                        </Button>
                      </Box>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No certifications available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional may be working on obtaining certifications
            </Typography>
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );

  const renderMobileProfileLayout = () => {
    const isDark = theme.palette.mode === 'dark';
    const dashboardFontFamily = '"Plus Jakarta Sans", "Manrope", "Segoe UI", sans-serif';
    const accent = theme.palette.secondary.main || '#F5B324';
    const panel = alpha(theme.palette.background.paper, isDark ? 0.94 : 0.97);
    const panelMuted = alpha(theme.palette.background.paper, isDark ? 0.86 : 0.92);
    const textPrimary = theme.palette.text.primary;
    const textMuted = alpha(theme.palette.text.primary, isDark ? 0.72 : 0.66);
    const sectionRadius = 18;
    const compactGap = 1.6;
    const motionEase = 'easeOut';
    const aboutText =
      profile.bio ||
      'I treat every project like a signature piece. Clean finishing, durable materials, and honest timelines.';
    const canTruncate = aboutText.length > 160;
    const aboutPreview =
      canTruncate && !showFullBio
        ? `${aboutText.slice(0, 160).trim()}...`
        : aboutText;
    const compactReviews = reviews.slice(0, 3);
    const primaryActionLabel = isOwner ? 'EDIT PROFILE' : 'HIRE NOW';
    const averageRatingValue = Number(
      ratingSummary?.averageRating ?? profile.average_rating ?? 0,
    );
    const totalReviewsValue = Number(
      ratingSummary?.totalReviews ?? stats.totalReviews ?? reviews.length,
    );
    const completionValue = Number(
      profileCompletion?.completionPercentage ?? stats?.completionRate ?? 0,
    );
    const jobsCompletedValue = Number(
      stats?.totalJobsCompleted ?? stats?.jobsCompleted ?? 0,
    );
    const responseTimeValue = Number(stats?.averageResponseTime ?? 0);
    const availabilityLabel =
      availability?.status || availability?.availabilityStatus || 'available';
    const mobilePortfolioItems = (portfolio.length > 0 ? portfolio : [{ title: 'Project work' }]).slice(0, 6);

    const trustMetricItems = [
      {
        label: 'Rating',
        value: `${averageRatingValue.toFixed(1)} / 5`,
        subLabel: `${totalReviewsValue} reviews`,
        icon: <StarIcon sx={{ fontSize: 18 }} />,
      },
      {
        label: 'Completed',
        value: `${jobsCompletedValue}`,
        subLabel: 'jobs delivered',
        icon: <AssessmentIcon sx={{ fontSize: 18 }} />,
      },
      {
        label: 'Profile',
        value: `${completionValue}%`,
        subLabel: 'completion',
        icon: <CheckIcon sx={{ fontSize: 18 }} />,
      },
      {
        label: 'Response',
        value: responseTimeValue > 0 ? `${responseTimeValue}h` : 'Fast',
        subLabel: 'avg reply time',
        icon: <ScheduleIcon sx={{ fontSize: 18 }} />,
      },
    ];

    const effectiveBottomNavHeight = isAuthenticated ? BOTTOM_NAV_HEIGHT : 0;

    const handleMobilePortfolioScroll = (event) => {
      const target = event.currentTarget;
      const cardSpan = 172;
      const nextIndex = Math.max(
        0,
        Math.min(
          mobilePortfolioItems.length - 1,
          Math.round(target.scrollLeft / cardSpan),
        ),
      );
      if (nextIndex !== activePortfolioIndex) {
        setActivePortfolioIndex(nextIndex);
      }
    };

    return (
      <Box
        sx={{
          pb: { xs: effectiveBottomNavHeight + 116, md: 4 },
          fontFamily: dashboardFontFamily,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: motionEase }}
        >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: sectionRadius,
            background: `linear-gradient(145deg, ${panel} 0%, ${alpha(accent, 0.08)} 100%)`,
            border: `1px solid ${alpha(accent, 0.28)}`,
            boxShadow: `0 12px 32px ${alpha('#000', 0.34)}`,
            position: 'relative',
            overflow: 'hidden',
            transform: `translateY(-${mobileHeroParallaxOffset}px)`,
            transition: 'transform 120ms linear',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(accent, 0.22)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar
              src={profileAvatarUrl}
              sx={{
                width: 66,
                height: 66,
                border: `2px solid ${accent}`,
                boxShadow: `0 0 12px 2px ${alpha(accent, 0.4)}`,
                bgcolor: alpha(accent, 0.22),
              }}
            >
              {profile.user?.firstName?.charAt(0)}
              {profile.user?.lastName?.charAt(0)}
            </Avatar>

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: accent,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                {profile.user?.firstName} {profile.user?.lastName}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: textMuted, fontWeight: 600, mb: 0.6 }}
              >
                {profile.profession || 'Professional Worker'}
              </Typography>

              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 0.8 }}>
                <Chip
                  size="small"
                  icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                  label={profile.is_verified ? 'Verified' : 'Pending verification'}
                  sx={{
                    bgcolor: alpha(accent, 0.14),
                    color: textPrimary,
                    border: `1px solid ${alpha(accent, 0.34)}`,
                    '& .MuiChip-icon': { color: accent },
                  }}
                />
                <Chip
                  size="small"
                  icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                  label={String(availabilityLabel).replace(/\b\w/g, (char) => char.toUpperCase())}
                  sx={{
                    bgcolor: alpha('#25B56B', 0.13),
                    color: textPrimary,
                    border: `1px solid ${alpha('#25B56B', 0.35)}`,
                    '& .MuiChip-icon': { color: '#25B56B' },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={0.8} alignItems="center">
                <Typography
                  variant="body2"
                  sx={{ color: accent, fontWeight: 700 }}
                >
                  {averageRatingValue.toFixed(1)}
                </Typography>
                <Rating
                  size="small"
                  value={averageRatingValue || 0}
                  precision={0.1}
                  readOnly
                />
                <Typography variant="caption" sx={{ color: textMuted }}>
                  ({totalReviewsValue} reviews)
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                onClick={handleBookmarkToggle}
                aria-label={isBookmarked ? 'Remove from saved' : 'Save worker'}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(accent, 0.14),
                  color: accent,
                }}
              >
                {isBookmarked ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
              </IconButton>
              <IconButton
                onClick={handleShare}
                aria-label="Share this profile"
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(accent, 0.14),
                  color: accent,
                }}
              >
                <ShareIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={0.8}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1.4 }}
          >
            {(skills.length > 0 ? skills : [{ name: 'Craftsman' }, { name: 'Furniture' }, { name: 'Finishing' }])
              .slice(0, 3)
              .map((skill, index) => (
                <Chip
                  key={`mobile-chip-${skill.name}-${index}`}
                  label={skill.name}
                  size="small"
                  sx={{
                    bgcolor: alpha(accent, 0.18),
                    color: textPrimary,
                    border: `1px solid ${alpha(accent, 0.45)}`,
                    fontWeight: 600,
                    borderRadius: 999,
                  }}
                />
              ))}
          </Stack>

          <Stack
            direction="row"
            spacing={0.8}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1.2 }}
          >
            {[
              { label: 'About', icon: <InfoIcon sx={{ fontSize: 15 }} />, ref: aboutSectionRef },
              { label: 'Portfolio', icon: <AutoAwesomeIcon sx={{ fontSize: 15 }} />, ref: portfolioSectionRef },
              { label: 'Reviews', icon: <ReviewsIcon sx={{ fontSize: 15 }} />, ref: reviewsSectionRef },
            ].map((jumpItem) => (
              <Chip
                key={jumpItem.label}
                icon={jumpItem.icon}
                label={jumpItem.label}
                onClick={() => scrollToSection(jumpItem.ref)}
                sx={{
                  bgcolor: alpha(accent, 0.1),
                  color: accent,
                  border: `1px solid ${alpha(accent, 0.35)}`,
                  '& .MuiChip-icon': { color: accent },
                  '&:hover': { bgcolor: alpha(accent, 0.2) },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'transform 120ms ease, background-color 180ms ease',
                }}
              />
            ))}
          </Stack>

          <Grid container spacing={1.1} sx={{ mt: 0.45 }}>
            {trustMetricItems.map((metric, index) => (
              <Grid item xs={6} key={`mobile-trust-${metric.label}`}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.04 + index * 0.035, ease: 'easeOut' }}
                >
                  <Box
                    sx={{
                      borderRadius: 2.4,
                      border: `1px solid ${alpha(accent, 0.28)}`,
                      background: `linear-gradient(170deg, ${alpha(accent, 0.17)} 0%, ${alpha('#000', isDark ? 0.18 : 0.03)} 100%)`,
                      px: 1.1,
                      py: 0.95,
                      minHeight: 75,
                    }}
                  >
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.45 }}>
                      <Box sx={{ color: accent, display: 'flex', alignItems: 'center' }}>{metric.icon}</Box>
                      <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
                        {metric.label}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 800, lineHeight: 1.1 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMuted }}>
                      {metric.subLabel}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.03, ease: motionEase }}
        >
        <Paper
          ref={aboutSectionRef}
          elevation={0}
          sx={{
            mt: compactGap,
            p: 1.5,
            borderRadius: sectionRadius,
            background: panelMuted,
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <Typography sx={{ color: accent, fontWeight: 700, mb: 0.7 }}>
            About Me
          </Typography>
          <Typography sx={{ color: textPrimary, fontSize: 14, lineHeight: 1.55 }}>
            {aboutPreview}
          </Typography>
          {canTruncate && (
            <Button
              size="small"
              onClick={() => setShowFullBio((prev) => !prev)}
              sx={{
                mt: 0.8,
                px: 1.2,
                minHeight: 32,
                borderRadius: 999,
                color: '#1A1408',
                backgroundColor: accent,
                '&:hover': {
                  backgroundColor: '#e7b843',
                },
              }}>
              {showFullBio ? 'Show Less' : 'Read More'}
            </Button>
          )}
        </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06, ease: motionEase }}
        >
        <Paper
          ref={portfolioSectionRef}
          elevation={0}
          sx={{
            mt: compactGap,
            p: 1.5,
            borderRadius: sectionRadius,
            background: panelMuted,
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <Typography sx={{ color: accent, fontWeight: 700, mb: 1.1 }}>
            Portfolio
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1.2,
              overflowX: 'auto',
              pb: 0.9,
              scrollSnapType: 'x mandatory',
              scrollPaddingLeft: '4px',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(accent, 0.45),
                borderRadius: 99,
              },
            }}
            onScroll={handleMobilePortfolioScroll}
          >
            {mobilePortfolioItems.map((item, index) => {
              const image = getPortfolioPreviewImage(item);
              const isRealPortfolioItem = Boolean(item?.id || item?._id || item?.description || image);

              return (
                <motion.div
                  key={item.id || item._id || item.title || `mobile-portfolio-${index}`}
                  whileTap={isRealPortfolioItem ? { scale: 0.98 } : undefined}
                >
                  <Card
                    onClick={() => {
                      if (!isRealPortfolioItem) {
                        return;
                      }
                      setSelectedPortfolioItem(item);
                      setPortfolioDialogOpen(true);
                    }}
                    sx={{
                      width: 160,
                      minWidth: 160,
                      height: 144,
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: isRealPortfolioItem ? 'pointer' : 'default',
                      border: `1px solid ${alpha(accent, index === activePortfolioIndex ? 0.9 : 0.45)}`,
                      background: alpha('#000', 0.28),
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      scrollSnapAlign: 'start',
                      boxShadow: index === activePortfolioIndex
                        ? `0 8px 20px ${alpha(accent, 0.24)}`
                        : 'none',
                      '&:active': {
                        transform: isRealPortfolioItem ? 'scale(0.985)' : 'none',
                      },
                      transition: 'transform 120ms ease, box-shadow 200ms ease, border-color 200ms ease',
                    }}
                  >
                    {image ? (
                      <CardMedia component="img" image={image} height="98" alt={item.title || 'Portfolio'} />
                    ) : (
                      <Box
                        sx={{
                          height: 98,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(accent, 0.14),
                        }}
                      >
                        <WorkIcon sx={{ color: accent }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 56,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%)',
                      }}
                    />
                    <CardContent sx={{ p: 0.9, mt: 'auto', zIndex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#FFF6D8',
                          fontWeight: 700,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title || 'Untitled portfolio item'}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </Box>
          {mobilePortfolioItems.length > 1 && (
            <Stack direction="row" spacing={0.7} justifyContent="center" sx={{ mt: 0.3 }}>
              {mobilePortfolioItems.map((item, index) => (
                <Box
                  key={`portfolio-dot-${item.id || item._id || item.title || index}`}
                  sx={{
                    width: index === activePortfolioIndex ? 18 : 7,
                    height: 7,
                    borderRadius: 99,
                    bgcolor: index === activePortfolioIndex ? accent : alpha(accent, 0.35),
                    transition: 'all 0.24s ease',
                  }}
                />
              ))}
            </Stack>
          )}
        </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.09, ease: motionEase }}
        >
        <Paper
          ref={reviewsSectionRef}
          elevation={0}
          sx={{
            mt: compactGap,
            p: 1.5,
            borderRadius: sectionRadius,
            background: panelMuted,
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <Typography sx={{ color: accent, fontWeight: 700, mb: 1.1 }}>
            Reviews
          </Typography>

          {compactReviews.length > 0 ? (
            <Stack spacing={1}>
              {compactReviews.map((review, index) => (
                <Box
                  key={review.id || review._id || `mobile-review-${index}`}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(accent, 0.24)}`,
                    background: alpha('#000', 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mb: 0.5 }}>
                    <Avatar
                      src={review?.reviewer?.avatar || review?.author?.avatar || null}
                      sx={{ width: 28, height: 28 }}
                    >
                      {(review?.reviewer?.name || review?.author?.name || 'R').charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: textPrimary, fontWeight: 700 }}>
                        {review?.reviewer?.name || review?.author?.name || 'Verified Client'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating size="small" readOnly value={Number(review.rating || 0)} precision={0.5} />
                        <Typography variant="caption" sx={{ color: textMuted }}>
                          {Number(review.rating || 0).toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: textMuted,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {review.comment || 'Great workmanship and clear communication.'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: textMuted }}>
              Reviews will appear here as soon as clients submit feedback.
            </Typography>
          )}
        </Paper>
        </motion.div>

        <Box
          sx={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: effectiveBottomNavHeight + 12,
            zIndex: theme.zIndex.modal - 2,
            p: 1,
            borderRadius: 3,
            background: alpha('#0E1014', 0.96),
            border: `1px solid ${alpha(accent, 0.38)}`,
            boxShadow: `0 12px 28px ${alpha('#000', 0.45)}`,
          }}
        >
          <Stack spacing={1}>
            <Button
              fullWidth
              onClick={() => {
                if (isOwner) {
                  navigate('/worker/profile/edit');
                  return;
                }
                handleHireAction();
              }}
              sx={{
                borderRadius: 999,
                minHeight: 44,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: '#1A1408',
                background: `linear-gradient(180deg, ${accent} 0%, #E4B13D 100%)`,
                '&:hover': {
                  background: `linear-gradient(180deg, #F7CF69 0%, ${accent} 100%)`,
                },
                '&:active': {
                  transform: 'translateY(1px) scale(0.995)',
                },
                transition: 'transform 120ms ease, background 180ms ease',
              }}
              aria-label={isOwner ? 'Edit profile' : 'Hire this worker'}>
              {primaryActionLabel}
            </Button>
            <Button
              fullWidth
              onClick={() => {
                if (isOwner) {
                  navigate('/messages');
                  return;
                }
                handleContactWorker();
              }}
              sx={{
                borderRadius: 999,
                minHeight: 44,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: accent,
                border: `1px solid ${accent}`,
                backgroundColor: isDark ? '#000000' : 'background.paper',
                '&:hover': {
                  backgroundColor: alpha(accent, 0.08),
                },
                '&:active': {
                  transform: 'translateY(1px) scale(0.995)',
                },
                transition: 'transform 120ms ease, background-color 180ms ease',
              }}
            >
              MESSAGE
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Helmet>
        <title>{`${profile.user?.firstName} ${profile.user?.lastName} - ${profile.profession} | Kelmah`}</title>
        <meta
          name="description"
          content={`Professional ${profile.profession} available for hire. View portfolio, reviews, and contact ${profile.user?.firstName} for your next project.`}
        />
      </Helmet>

      <Container
        maxWidth={isActualMobile ? 'sm' : 'lg'}
        sx={{
          py: isActualMobile ? 1.5 : 4,
          px: isActualMobile ? 1 : undefined,
        }}
      >
        {isActualMobile ? (
          renderMobileProfileLayout()
        ) : (
          <>
            <Breadcrumbs sx={{ mb: 3 }}>
              <Link color="inherit" component={RouterLink} to="/">
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Link>
              <Link
                color="inherit"
                component={RouterLink}
                to="/find-talents"
              >
                Find Talents
              </Link>
              <Typography color="text.primary">
                {profile.user?.firstName} {profile.user?.lastName}
              </Typography>
            </Breadcrumbs>

            {renderProfileHeader()}
            {renderMetrics()}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant={isMobile ? 'scrollable' : 'fullWidth'}
                scrollButtons="auto"
              >
                <Tab icon={<PersonIcon />} iconPosition="start" label="Overview" />
                <Tab icon={<ViewIcon />} iconPosition="start" label="Portfolio" />
                <Tab icon={<StarIcon />} iconPosition="start" label="Reviews" />
                <Tab icon={<ScheduleIcon />} iconPosition="start" label="Availability" />
                <Tab icon={<SchoolIcon />} iconPosition="start" label="Certificates" />
              </Tabs>
            </Box>

            <AnimatePresence mode="wait">
              <motion.div
                key={tabValue}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {tabValue === 0 && renderSkillsAndExpertise()}
                {tabValue === 1 && renderPortfolio()}
                {tabValue === 2 && renderReviews()}
                {tabValue === 3 && renderAvailability()}
                {tabValue === 4 && renderCertifications()}
              </motion.div>
            </AnimatePresence>

            {renderAvailabilityEditor()}
          </>
        )}

        {/* Portfolio Item Dialog */}
        <Dialog
          open={portfolioDialogOpen}
          onClose={() => setPortfolioDialogOpen(false)}
          maxWidth="md"
          fullWidth
          aria-labelledby="portfolio-item-dialog-title"
        >
          {selectedPortfolioItem && (
            <>
              <DialogTitle id="portfolio-item-dialog-title">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h5" fontWeight={600}>
                    {selectedPortfolioItem.title}
                  </Typography>
                  <IconButton onClick={() => setPortfolioDialogOpen(false)} aria-label="Close portfolio preview dialog">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  {getPortfolioPreviewImage(selectedPortfolioItem) ? (
                    <img
                      src={getPortfolioPreviewImage(selectedPortfolioItem)}
                      alt={selectedPortfolioItem.title}
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  ) : null}
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedPortfolioItem.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPortfolioItem.technologies?.map((tech, index) => (
                    <Chip key={`${tech}-${index}`} label={tech} size="small" />
                  ))}
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Floating Action Button for Quick Actions */}
        {!isOwner && !isActualMobile && (
          <SpeedDial
            ariaLabel="Worker Actions"
            sx={{ position: 'fixed', bottom: { xs: BOTTOM_NAV_HEIGHT + 16, md: 16 }, right: 16 }}
            icon={<SpeedDialIcon />}
          >
            <SpeedDialAction
              icon={<MessageIcon />}
              tooltipTitle="Message Worker"
              onClick={handleContactWorker}
            />
            <SpeedDialAction
              icon={<BusinessCenterIcon />}
              tooltipTitle="Hire Now"
              onClick={handleHireAction}
            />
            <SpeedDialAction
              icon={<ShareIcon />}
              tooltipTitle="Share Profile"
              onClick={handleShare}
            />
          </SpeedDial>
        )}

        <Snackbar
          open={Boolean(feedbackMessage)}
          autoHideDuration={2500}
          onClose={() => setFeedbackMessage('')}
          message={feedbackMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
    </>
  );
}

export default WorkerProfile;


