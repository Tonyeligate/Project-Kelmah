import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';"
import workerService from '../services/workerService';
import {
  Box,
  Typography,
  Button,
  Rating,
  Avatar,
  Alert,
  Chip,
  IconButton,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  WorkOutline as WorkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { STICKY_CTA_HEIGHT, Z_INDEX } from '../../../constants/layout';
import reviewService from '../../reviews/services/reviewService';
import useOnlineStatus from '../../../hooks/useOnlineStatus';
import useNetworkSpeed from '../../../hooks/useNetworkSpeed';
import {
  resolveMediaAssetUrl,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';
import { devError } from '@/modules/common/utils/devLogger';

const formatGhanaCurrencyLabel = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'GH₵0.00';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount);
};

const getCanonicalWorkerProfilePath = (workerId) =>
  workerId
    ? `/workers/${encodeURIComponent(String(workerId))}`
    : '/find-talents';

const normalizeWorkerSkillList = (skills) =>
  Array.isArray(skills)
    ? skills
        .map((skill) => ({
          name:
            skill?.name ||
            skill?.skillName ||
            skill?.label ||
            String(skill || '').trim(),
        }))
        .filter((skill) => skill.name)
    : [];

const getPortfolioItems = (worker) =>
  Array.isArray(worker?.portfolio?.items) ? worker.portfolio.items : [];

const resolveCurrentUserId = (user) =>
  user?.id ||
  user?._id ||
  user?.userId ||
  user?._raw?.id ||
  user?._raw?._id ||
  user?._raw?.userId ||
  null;

const AUDIT_PROFILE_WORKER_ID = 'ui-audit-worker-1';
const AUDIT_PROFILE_AVATAR_URL = new URL(
  '../../../assets/cartoon-worker.jpeg',
  import.meta.url,
).href;
const AUDIT_PROFILE_PORTFOLIO_IMAGES = [
  new URL('../../../assets/images/carpentry.jpg', import.meta.url).href,
  new URL('../../../assets/images/construction.jpg', import.meta.url).href,
  new URL('../../../assets/images/electrical.jpg', import.meta.url).href,
];

const buildAuditWorkerProfileSeed = () => {
  const portfolio = AUDIT_PROFILE_PORTFOLIO_IMAGES.map((imageUrl, index) => ({
    id: `audit-portfolio-${index + 1}`,
    title:
      index === 0
        ? 'Signature Cabinet Work'
        : index === 1
          ? 'Precision Furniture Making'
          : 'Roofing Detail',
    description:
      index === 0
        ? 'Custom cabinet storage and warm timber finish.'
        : index === 1
          ? 'Clean joinery and aligned finish work.'
          : 'Strong roof framing and finishing alignment.',
    image: imageUrl,
  }));

  return {
    profile: {
      id: AUDIT_PROFILE_WORKER_ID,
      user: {
        id: AUDIT_PROFILE_WORKER_ID,
        firstName: 'Kwado',
        lastName: 'Asamoah',
        name: 'Kwado Asamoah',
        profilePicture: AUDIT_PROFILE_AVATAR_URL,
      },
      name: 'Kwado Asamoah',
      title: 'Master Carpenter & Builder',
      profession: 'Master Carpenter & Builder',
      bio: 'To be the best in the most honest way is to be reliable, focused and clean with every job. I keep work simple, strong, and precise for every client.',
      hourly_rate: 250,
      is_verified: true,
      profile_picture: AUDIT_PROFILE_AVATAR_URL,
      profilePicture: AUDIT_PROFILE_AVATAR_URL,
      bannerImage: AUDIT_PROFILE_PORTFOLIO_IMAGES[0],
      experience_years: 11,
      is_online: true,
    },
    skills: [
      { name: 'Carpentry' },
      { name: 'Furniture Making' },
      { name: 'Roofing' },
      { name: 'Joinery' },
    ],
    portfolio,
    reviews: [
      {
        id: 'audit-review-1',
        rating: 5,
        comment: 'The work was clean, on time, and very detailed.',
        reviewer: { name: 'Ama Mensah', avatar: AUDIT_PROFILE_AVATAR_URL },
      },
      {
        id: 'audit-review-2',
        rating: 4.8,
        comment: 'Very reliable and easy to communicate with.',
        reviewer: { name: 'Kwesi Boateng', avatar: AUDIT_PROFILE_AVATAR_URL },
      },
      {
        id: 'audit-review-3',
        rating: 4.9,
        comment: 'Great finish work and strong attention to detail.',
        reviewer: { name: 'Sarah Owusu', avatar: AUDIT_PROFILE_AVATAR_URL },
      },
    ],
    ratingSummary: { averageRating: 4.9, totalReviews: 157 },
    availability: { status: 'available' },
    stats: { totalReviews: 157 },
  };
};

function WorkerProfile({ workerId: workerIdProp }) {
  const routeParams = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  const authUserId = resolveCurrentUserId(authUser);
  const resolvedWorkerId =
    workerIdProp ?? routeParams?.workerId ?? authUserId ?? null;
  const isAuditWorkerProfile =
    String(resolvedWorkerId) === AUDIT_PROFILE_WORKER_ID;
  const auditSeed = isAuditWorkerProfile ? buildAuditWorkerProfileSeed() : null;

  const navigate = useNavigate();
  const { isOnline, wasOffline } = useOnlineStatus();
  const { isSlow, effectiveType, downlink, rtt, saveData } = useNetworkSpeed();
  const lowBandwidthModeActive = isOnline && (isSlow || saveData);
  const shouldRenderPortfolioPreviews = isOnline && !lowBandwidthModeActive;
  const networkSnapshotLabel = useMemo(() => {
    const effectiveTypeLabel =
      effectiveType && effectiveType !== 'unknown'
        ? String(effectiveType).toUpperCase()
        : 'unknown link';
    const downlinkLabel = Number.isFinite(downlink)
      ? `${downlink.toFixed(1)} Mbps`
      : 'downlink n/a';
    const latencyLabel = Number.isFinite(rtt) ? `${rtt} ms RTT` : 'latency n/a';

    return `${effectiveTypeLabel} • ${downlinkLabel} • ${latencyLabel}`;
  }, [downlink, effectiveType, rtt]);
  const workerProfileNetworkBanner = useMemo(() => {
    if (!isOnline) {
      return {
        severity: 'error',
        title: 'Offline mode',
        detail:
          'You are offline. Worker details remain visible, and photos will resume loading after internet returns.',
      };
    }

    if (lowBandwidthModeActive) {
      return {
        severity: 'warning',
        title: saveData
          ? 'Data saver mode detected'
          : 'Low bandwidth mode active',
        detail: `Network is constrained (${networkSnapshotLabel}). Portfolio previews are reduced to keep profile loading stable.`,
      };
    }

    if (wasOffline) {
      return {
        severity: 'success',
        title: 'Connection restored',
        detail:
          'You are back online. Full profile previews and refresh actions are available again.',
      };
    }

    return null;
  }, [
    isOnline,
    lowBandwidthModeActive,
    networkSnapshotLabel,
    saveData,
    wasOffline,
  ]);

  const [profile, setProfile] = useState(auditSeed?.profile || null);
  const [skills, setSkills] = useState(auditSeed?.skills || []);
  const [portfolio, setPortfolio] = useState(auditSeed?.portfolio || []);
  const [reviews, setReviews] = useState(auditSeed?.reviews || []);
  const [ratingSummary, setRatingSummary] = useState(
    auditSeed?.ratingSummary || null,
  );
  const [availability, setAvailability] = useState(
    auditSeed?.availability || null,
  );
  const [stats, setStats] = useState(auditSeed?.stats || {});
  const [loading, setLoading] = useState(!isAuditWorkerProfile);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);

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

  const isOwner =
    authUserId && resolvedWorkerId
      ? String(authUserId) === String(resolvedWorkerId)
      : false;
  const portfolioPreviewItems = useMemo(() => {
    const baseItems = Array.isArray(portfolio) ? portfolio.slice(0, 3) : [];
    const mapped = baseItems.map((item) => ({ ...item, isPlaceholder: false }));
    const fallbacks = [
      {
        id: 'portfolio-fallback-1',
        title: 'Signature Finish',
        isPlaceholder: true,
      },
      { id: 'portfolio-fallback-2', title: 'Detail Work', isPlaceholder: true },
      {
        id: 'portfolio-fallback-3',
        title: 'Workshop Build',
        isPlaceholder: true,
      },
    ];

    return [...mapped, ...fallbacks].slice(0, 3);
  }, [portfolio]);

  const fetchAllData = useCallback(async () => {
    if (!resolvedWorkerId) {
      setError('Worker profile could not be found.');
      setLoading(false);
      return;
    }

    if (isAuditWorkerProfile) {
      const nextSeed = buildAuditWorkerProfileSeed();
      setProfile(nextSeed.profile);
      setSkills(nextSeed.skills);
      setPortfolio(nextSeed.portfolio);
      setReviews(nextSeed.reviews);
      setRatingSummary(nextSeed.ratingSummary);
      setAvailability(nextSeed.availability);
      setStats(nextSeed.stats);
      setLoading(false);
      setError(null);
      return;
    }

    setProfile(null);
    setSkills([]);
    setPortfolio([]);
    setReviews([]);
    setRatingSummary(null);
    setAvailability(null);
    setStats({});
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
        totalReviews: Number(
          worker?.stats?.totalReviews ?? worker?.totalReviews ?? 0,
        ),
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
            experience_years: Number(
              worker.experience?.years ?? worker.yearsOfExperience ?? 0,
            ),
            is_online: false,
          }
        : null;

      setProfile(normalizedProfile);
      setSkills(normalizeWorkerSkillList(worker?.skills));
      setPortfolio(getPortfolioItems(worker));
      setAvailability(worker?.availability || null);
      setStats(worker?.stats || {});
      setRatingSummary(fallbackRatingSummary);

      let profileDetailsThrottled = false;
      const runOptionalProfileRequest = async (requestFactory) => {
        if (profileDetailsThrottled) {
          return null;
        }

        try {
          return await requestFactory();
        } catch (requestError) {
          if (requestError?.response?.status === 429) {
            profileDetailsThrottled = true;
            setFeedbackMessage(
              'Some profile details are temporarily limited. Please try again shortly.',
            );
          }

          return null;
        }
      };

      // Load secondary sections sequentially to avoid request bursts that trip gateway throttling.
      const ratingRes = await runOptionalProfileRequest(() =>
        reviewService.getWorkerRating(resolvedWorkerId),
      );
      const reviewListRes = await runOptionalProfileRequest(() =>
        reviewService.getWorkerReviews(resolvedWorkerId, {
          page: 1,
          limit: 6,
          status: 'approved',
          sortBy: 'createdAt',
          order: 'desc',
        }),
      );

      const normalizedReviews = Array.isArray(reviewListRes?.reviews)
        ? reviewListRes.reviews
        : Array.isArray(reviewListRes?.data?.reviews)
          ? reviewListRes.data.reviews
          : Array.isArray(reviewListRes)
            ? reviewListRes
            : [];

      setReviews(normalizedReviews);
      setRatingSummary(ratingRes || fallbackRatingSummary);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError('Worker profile not found.');
      } else if (status === 429) {
        setError(
          'This profile is temporarily rate-limited. Please wait a few seconds and try again.',
        );
      } else {
        setError('Could not load this worker profile. Please try again.');
      }
      devError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuditWorkerProfile, resolvedWorkerId]);

  useEffect(() => {
    if (!resolvedWorkerId) {
      return;
    }

    if (isAuditWorkerProfile) {
      setError(null);
      setLoading(false);
      setShowFullBio(false);
      setActivePortfolioIndex(0);
      setSelectedPortfolioItem(null);
      setPortfolioDialogOpen(false);
      setIsBookmarked(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);
    setSkills([]);
    setPortfolio([]);
    setReviews([]);
    setRatingSummary(null);
    setAvailability(null);
    setStats({});
    setShowFullBio(false);
    setActivePortfolioIndex(0);
    setSelectedPortfolioItem(null);
    setPortfolioDialogOpen(false);

    fetchAllData();

    if (!authUserId) {
      setIsBookmarked(false);
      return;
    }

    workerService
      .getBookmarks()
      .then((res) => {
        const ids = res?.data?.data?.workerIds || [];
        setIsBookmarked(
          ids.map((id) => String(id)).includes(String(resolvedWorkerId)),
        );
      })
      .catch((bookmarkError) => {
        if (bookmarkError?.response?.status !== 401) {
          devError('Failed to load bookmarks', bookmarkError);
        }
      });
  }, [authUserId, fetchAllData, isAuditWorkerProfile, resolvedWorkerId]);

  const handleContactWorker = () => {
    if (!authUser) {
      navigate('/login', {
        state: { from: window.location.pathname + window.location.search },
      });
      return;
    }

    const recipientId =
      profile?.user?.id ||
      profile?.user?._id ||
      profile?.userId ||
      resolvedWorkerId;

    if (recipientId) {
      navigate(
        `/messages?recipient=${encodeURIComponent(String(recipientId))}`,
        {
          state: {
            recipientProfile: {
              id: String(recipientId),
              name:
                profile?.user?.name ||
                [profile?.user?.firstName, profile?.user?.lastName]
                  .filter(Boolean)
                  .join(' ') ||
                profile?.name ||
                'New conversation',
              profilePicture:
                profile?.profile_picture ||
                profile?.user?.profilePicture ||
                profile?.profilePicture ||
                null,
            },
          },
        },
      );
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
    } catch {
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

  // Bottom padding now only accounts for the sticky CTA — no bottom nav offset needed.
  const shellSx = {
    width: '100%',
    color: 'var(--wp-text)',
    fontFamily: '"Manrope", "Poppins", "Work Sans", sans-serif',
    px: { xs: 1.25, sm: 3, md: 4 },
    pt: { xs: 1.5, md: 3 },
    pb: { xs: STICKY_CTA_HEIGHT + 28, md: 6 },
  };

  if (loading) {
    return (
      <Box sx={shellSx}>
        <Box
          sx={{
            maxWidth: 960,
            mx: 'auto',
            display: 'grid',
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box
            sx={{
              p: { xs: 2.5, md: 2.5 },
              borderRadius: 16,
              background: 'rgba(26, 26, 31, 0.92)',
              border: '1px solid var(--wp-stroke)',
              boxShadow: 'var(--wp-shadow)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Skeleton
                variant="circular"
                width={96}
                height={96}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="70%"
                  height={36}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
                />
                <Skeleton
                  variant="text"
                  width="45%"
                  height={24}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  {[...Array(4)].map((_, index) => (
                    <Skeleton
                      key={`luxe-chip-skeleton-${index}`}
                      variant="rectangular"
                      width={88}
                      height={28}
                      sx={{
                        borderRadius: 999,
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={shellSx}>
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              backgroundColor: 'rgba(26, 26, 31, 0.92)',
              color: 'var(--wp-text)',
              border: '1px solid var(--wp-stroke)',
            }}
          >
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={shellSx}>
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
              backgroundColor: 'rgba(26, 26, 31, 0.92)',
              color: 'var(--wp-text)',
              border: '1px solid var(--wp-stroke)',
            }}
          >
            Worker profile not found.
          </Alert>
        </Box>
      </Box>
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
  const selectedPortfolioPreviewImage = selectedPortfolioItem
    ? getPortfolioPreviewImage(selectedPortfolioItem)
    : null;

  const displayName =
    [profile.user?.firstName, profile.user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    profile.name ||
    'Kelmah Pro';
  const roleLabel = profile.profession || profile.title || 'Skilled Worker';
  const ratingValue =
    Number(ratingSummary?.averageRating ?? profile.average_rating ?? 0) || 0;
  const reviewsCount = Number(
    ratingSummary?.totalReviews ?? stats.totalReviews ?? reviews.length,
  );
  const rateLabel = formatGhanaCurrencyLabel(profile.hourly_rate || 0);
  const availabilityStatus = String(
    availability?.status || availability?.availabilityStatus || 'available',
  ).toLowerCase();
  const availabilityLabelMap = {
    available: 'Available now',
    busy: 'Busy',
    unavailable: 'Unavailable',
    vacation: 'On break',
  };
  const availabilityLabel =
    availabilityLabelMap[availabilityStatus] || 'Availability TBD';
  const aboutText =
    profile.bio ||
    'Professional craftsperson focused on dependable timelines, careful finishes, and clean job sites.';
  const canTruncate = aboutText.length > 180;
  const aboutPreview =
    canTruncate && !showFullBio
      ? `${aboutText.slice(0, 180).trim()}...`
      : aboutText;
  const avatarInitials =
    [profile.user?.firstName, profile.user?.lastName]
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2) ||
    displayName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2);

  const skillItems = (
    skills.length > 0
      ? skills
      : [
          { name: 'Custom Builds' },
          { name: 'Fine Finishing' },
          { name: 'Installations' },
          { name: 'Repairs' },
        ]
  ).slice(0, 6);

  const reviewItems = reviews.slice(0, 3);

  const primaryCtaLabel = isOwner ? 'EDIT PROFILE' : 'HIRE NOW';
  const secondaryCtaLabel = isOwner ? 'MESSAGES' : 'MESSAGE';

  const handlePrimaryCta = () => {
    if (isOwner) {
      navigate('/worker/profile/edit');
      return;
    }

    handleContactWorker();
  };

  const handleSecondaryCta = () => {
    if (isOwner) {
      navigate('/messages');
      return;
    }

    handleContactWorker();
  };

  const handlePortfolioScroll = (event) => {
    if (!event?.currentTarget || portfolioPreviewItems.length === 0) {
      return;
    }

    const cardSpan = 176;
    const nextIndex = Math.max(
      0,
      Math.min(
        portfolioPreviewItems.length - 1,
        Math.round(event.currentTarget.scrollLeft / cardSpan),
      ),
    );
    if (nextIndex !== activePortfolioIndex) {
      setActivePortfolioIndex(nextIndex);
    }
  };

  const sectionColumn = { xs: '1 / -1', md: '2 / span 10', lg: '3 / span 8' };
  const baseCardSx = {
    gridColumn: sectionColumn,
    background: 'var(--wp-surface)',
    border: '1px solid var(--wp-stroke)',
    borderRadius: 16,
    boxShadow: 'var(--wp-shadow)',
    p: { xs: 2, sm: 2.5, md: 2.5 },
  };
  const heroChipSx = {
    height: { xs: 24, md: 28 },
    borderRadius: 999,
    background: 'rgba(15, 15, 18, 0.72)',
    border: '1px solid var(--wp-stroke)',
    color: 'var(--wp-text)',
    fontWeight: 600,
    fontSize: { xs: '0.82rem', md: '0.9rem' },
    '& .MuiChip-label': { px: { xs: 1.15, md: 1.25 } },
  };
  const skillChipSx = {
    height: { xs: 24, md: 28 },
    borderRadius: 999,
    background:
      'linear-gradient(180deg, rgba(255, 211, 77, 0.98) 0%, rgba(216, 176, 75, 0.98) 100%)',
    border: '1px solid rgba(255, 211, 77, 0.85)',
    color: '#101116',
    fontWeight: 700,
    fontSize: { xs: '0.82rem', md: '0.9rem' },
    letterSpacing: '0.01em',
    '& .MuiChip-label': { px: { xs: 1.15, md: 1.25 } },
  };
  const primaryCtaSx = {
    minHeight: { xs: 42, md: 56 },
    borderRadius: { xs: 999, md: 12 },
    fontWeight: 700,
    letterSpacing: { xs: '0.08em', md: '0.12em' },
    textTransform: 'none',
    fontSize: { xs: '0.78rem', md: '0.95rem' },
    color: '#101116',
    background: 'linear-gradient(180deg, var(--wp-gold) 0%, #d8b04b 100%)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
    '&:hover': {
      background: 'linear-gradient(180deg, #f7d277 0%, var(--wp-gold) 100%)',
    },
  };
  const secondaryCtaSx = {
    minHeight: { xs: 40, md: 56 },
    borderRadius: { xs: 999, md: 12 },
    fontWeight: 700,
    letterSpacing: { xs: '0.08em', md: '0.12em' },
    textTransform: 'none',
    fontSize: { xs: '0.72rem', md: '0.95rem' },
    color: 'var(--wp-gold)',
    border: '1px solid rgba(255, 211, 77, 0.7)',
    backgroundColor: 'rgba(12, 12, 15, 0.9)',
    '&:hover': {
      backgroundColor: 'rgba(22, 22, 26, 0.95)',
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${displayName} - ${roleLabel} | Kelmah`}</title>
        <meta
          name="description"
          content={`Professional ${roleLabel} available for hire. View portfolio, reviews, and contact ${displayName} for your next project.`}
        />
      </Helmet>

      <Box sx={shellSx}>
        <Box component="style">
          {`
@keyframes wpFadeUp {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.wp-reveal {
  animation: wpFadeUp 0.6s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .wp-reveal {
    animation: none;
  }
}
          `}
        </Box>

        {workerProfileNetworkBanner && (
          <Alert
            severity={workerProfileNetworkBanner.severity}
            sx={{
              mb: 2,
              borderRadius: 3,
              backgroundColor: 'rgba(20, 20, 24, 0.92)',
              color: 'var(--wp-text)',
              border: '1px solid var(--wp-stroke)',
            }}
            action={
              <Button
                size="small"
                onClick={() => {
                  fetchAllData();
                }}
                disabled={loading || !isOnline}
                sx={{
                  minHeight: 32,
                  borderRadius: 2,
                  border: '1px solid var(--wp-gold-soft)',
                  color: 'var(--wp-gold)',
                  textTransform: 'none',
                }}
              >
                {loading
                  ? 'Syncing...'
                  : isOnline
                    ? 'Refresh profile'
                    : 'Retry online'}
              </Button>
            }
          >
            <Typography variant="body2" fontWeight={700}>
              {workerProfileNetworkBanner.title}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              {workerProfileNetworkBanner.detail}
            </Typography>
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(8, minmax(0, 1fr))',
              md: 'repeat(12, minmax(0, 1fr))',
            },
            columnGap: { xs: 0, sm: '16px', md: '20px', lg: '24px' },
            rowGap: { xs: '12px', md: '24px' },
            maxWidth: { xs: '100%', sm: 480, md: 1280 },
            mx: 'auto',
            minWidth: 0,
          }}
        >
          {/* ── Profile hero card ── */}
          <Box
            className="wp-reveal"
            style={{ animationDelay: '0.04s' }}
            sx={{
              ...baseCardSx,
              p: { xs: 2, sm: 2.5, md: 2.5 },
              borderRadius: { xs: 18, md: 16 },
              backgroundImage: profileHeroImage
                ? `linear-gradient(160deg, rgba(12,12,14,0.94) 0%, rgba(27,27,30,0.88) 55%, rgba(14,14,16,0.96) 100%), url(${profileHeroImage})`
                : 'linear-gradient(160deg, #222530 0%, #1A1D26 60%, #101116 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 0%, rgba(255, 211, 77, 0.2) 0%, transparent 58%)',
                opacity: 0.6,
                pointerEvents: 'none',
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 12, md: 16 },
                  right: { xs: 12, md: 16 },
                  display: 'flex',
                  gap: 1,
                }}
              >
                <IconButton
                  onClick={handleBookmarkToggle}
                  aria-label={
                    isBookmarked ? 'Remove from saved' : 'Save worker'
                  }
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    border: '1px solid var(--wp-stroke)',
                    backgroundColor: 'rgba(14, 14, 18, 0.7)',
                    color: 'var(--wp-gold)',
                    '&:hover': { backgroundColor: 'rgba(24, 24, 28, 0.85)' },
                    '&:focus-visible': {
                      outline: '3px solid var(--wp-gold)',
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isBookmarked ? (
                    <BookmarkIcon sx={{ color: 'var(--wp-gold)' }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ color: 'var(--wp-gold)' }} />
                  )}
                </IconButton>
                <IconButton
                  onClick={handleShare}
                  aria-label="Share this profile"
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    border: '1px solid var(--wp-stroke)',
                    backgroundColor: 'rgba(14, 14, 18, 0.7)',
                    color: 'var(--wp-gold)',
                    '&:hover': { backgroundColor: 'rgba(24, 24, 28, 0.85)' },
                    '&:focus-visible': {
                      outline: '3px solid var(--wp-gold)',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <ShareIcon sx={{ color: 'var(--wp-gold)' }} />
                </IconButton>
                {isOwner && (
                  <IconButton
                    onClick={() => navigate('/worker/profile/edit')}
                    aria-label="Edit your profile"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '14px',
                      border: '1px solid var(--wp-stroke)',
                      backgroundColor: 'rgba(14, 14, 18, 0.7)',
                      color: 'var(--wp-gold)',
                      '&:hover': {
                        backgroundColor: 'rgba(24, 24, 28, 0.85)',
                      },
                      '&:focus-visible': {
                        outline: '3px solid var(--wp-gold)',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <EditIcon sx={{ color: 'var(--wp-gold)' }} />
                  </IconButton>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: { xs: 1.5, sm: 3 },
                  alignItems: 'center',
                  // Reserve space on the right for the absolute bookmark/share/edit buttons.
                  // At xs: 2 buttons × 40px + 8px gap + 12px card-edge = ~100px; 3 buttons = ~140px.
                  pr: { xs: isOwner ? '140px' : '100px', sm: 8 },
                }}
              >
                <Box
                  sx={{
                    p: { xs: '3px', md: '4px' },
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, var(--wp-gold), #d8b04b)',
                    boxShadow:
                      '0 0 0 1px rgba(255, 211, 77, 0.45), 0 14px 28px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  <Avatar
                    src={profileAvatarUrl}
                    alt={`${displayName} profile photo`}
                    role="img"
                    aria-label={`${displayName} profile photo`}
                    sx={{
                      width: { xs: 64, sm: 88, md: 112 },
                      height: { xs: 64, sm: 88, md: 112 },
                      bgcolor: '#1f1f24',
                      border: '2px solid rgba(18, 18, 20, 0.9)',
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', sm: '1.6rem', md: '2rem' },
                    }}
                  >
                    {avatarInitials}
                  </Avatar>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component="h1"
                    sx={{
                      fontFamily:
                        '"Poppins", "Manrope", "Work Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.75rem', md: '2.25rem' },
                      lineHeight: { xs: 1.15, md: 1.15 },
                      color: 'var(--wp-text)',
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'var(--wp-gold)',
                      fontWeight: 600,
                      fontSize: { xs: '0.95rem', sm: '0.95rem', md: '1.15rem' },
                      letterSpacing: '0.02em',
                      mt: 0.5,
                    }}
                  >
                    {roleLabel}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ mt: 0.75 }}
                  >
                    <Rating
                      value={ratingValue}
                      precision={0.1}
                      readOnly
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': { color: 'var(--wp-gold)' },
                        '& .MuiRating-iconEmpty': {
                          color: 'rgba(216, 176, 75, 0.35)',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: 'var(--wp-text)',
                        fontSize: {
                          xs: '0.95rem',
                          sm: '0.95rem',
                          md: '1.05rem',
                        },
                      }}
                    >
                      {ratingValue.toFixed(1)}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'var(--wp-muted)',
                        fontSize: {
                          xs: '0.85rem',
                          sm: '0.85rem',
                          md: '0.95rem',
                        },
                      }}
                    >
                      ({reviewsCount} reviews)
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--wp-muted)',
                      display: 'block',
                      mt: 0.25,
                      fontSize: { xs: '0.85rem', sm: '0.85rem', md: '0.95rem' },
                    }}
                  >
                    From {rateLabel} / hr
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 1, maxWidth: '100%' }}
                  >
                    {profile.is_verified && (
                      <Chip
                        icon={<VerifiedIcon sx={{ color: 'var(--wp-gold)' }} />}
                        label="Verified"
                        sx={heroChipSx}
                      />
                    )}
                    <Chip label={availabilityLabel} sx={heroChipSx} />
                  </Stack>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: { xs: 2, sm: 2.5 },
                  // Small inset prevents chips from touching the card edge
                  // (which would clip them under overflow:hidden + border-radius)
                  mx: '4px',
                }}
              >
                {skillItems.map((skill, index) => (
                  <Chip
                    key={
                      skill.id || skill._id || skill.name || `skill-${index}`
                    }
                    label={skill.name}
                    sx={skillChipSx}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* ── About Me card ── */}
          <Box
            className="wp-reveal"
            style={{ animationDelay: '0.12s' }}
            sx={baseCardSx}
          >
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Poppins", "Manrope", "Work Sans", sans-serif',
                fontWeight: 700,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                color: 'var(--wp-text)',
                mb: 1,
              }}
            >
              About Me
            </Typography>
            <Typography
              sx={{
                color: 'var(--wp-muted)',
                fontSize: { xs: '0.9rem', md: '0.95rem' },
                lineHeight: 1.6,
              }}
            >
              {aboutPreview}
            </Typography>
            {canTruncate && (
              <Box
                sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}
              >
                <Button
                  size="small"
                  onClick={() => setShowFullBio((prev) => !prev)}
                  sx={{
                    minHeight: 32,
                    px: 2.5,
                    borderRadius: 999,
                    color: '#1b1b1e',
                    backgroundColor: 'var(--wp-gold)',
                    border: '1px solid rgba(242, 193, 79, 0.9)',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: '#f6cf6c',
                    },
                  }}
                >
                  {showFullBio ? 'Show Less' : 'Read More'}
                </Button>
              </Box>
            )}
          </Box>

          {/* ── Portfolio card ── */}
          <Box
            className="wp-reveal"
            style={{ animationDelay: '0.18s' }}
            sx={baseCardSx}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Poppins", "Manrope", "Work Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  color: 'var(--wp-text)',
                }}
              >
                Portfolio
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--wp-muted)' }}>
                {portfolio.length} item{portfolio.length === 1 ? '' : 's'}
              </Typography>
            </Box>
            {lowBandwidthModeActive && (
              <Typography
                variant="caption"
                sx={{ color: 'var(--wp-muted)', display: 'block', mb: 1 }}
              >
                Low bandwidth mode is pausing previews to keep the page fast.
              </Typography>
            )}
            <Box
              sx={{
                display: { xs: 'flex', md: 'grid' },
                gridTemplateColumns: { md: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 1.5, md: 2 },
                overflowX: { xs: 'auto', md: 'visible' },
                pb: { xs: 1, md: 0 },
                scrollSnapType: { xs: 'x mandatory', md: 'none' },
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(242, 193, 79, 0.5)',
                  borderRadius: 99,
                },
              }}
              onScroll={handlePortfolioScroll}
            >
              {portfolioPreviewItems.map((item, index) => {
                const previewImage = getPortfolioPreviewImage(item);
                const canShowImage =
                  shouldRenderPortfolioPreviews && previewImage;
                const isPlaceholder = item.isPlaceholder;
                return (
                  <Box
                    key={
                      item.id || item._id || item.title || `portfolio-${index}`
                    }
                    component="button"
                    type="button"
                    disabled={isPlaceholder}
                    onClick={() => {
                      if (isPlaceholder) {
                        return;
                      }
                      setSelectedPortfolioItem(item);
                      setPortfolioDialogOpen(true);
                    }}
                    sx={{
                      position: 'relative',
                      textAlign: 'left',
                      border: '1px solid rgba(242, 193, 79, 0.75)',
                      borderRadius: 16,
                      background: 'rgba(12, 12, 15, 0.92)',
                      color: 'inherit',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'stretch',
                      overflow: 'hidden',
                      cursor: isPlaceholder ? 'default' : 'pointer',
                      minWidth: { xs: 88, sm: 160, md: 'auto' },
                      aspectRatio: '1 / 1',
                      scrollSnapAlign: 'start',
                      transition:
                        'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': isPlaceholder
                        ? undefined
                        : {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                            borderColor: 'var(--wp-gold)',
                          },
                      '&:disabled': {
                        opacity: 0.7,
                      },
                    }}
                  >
                    {canShowImage ? (
                      <Box
                        component="img"
                        src={previewImage}
                        alt={item.title || 'Portfolio preview'}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          background: 'rgba(216, 176, 75, 0.08)',
                          color: 'var(--wp-gold)',
                        }}
                      >
                        <WorkIcon sx={{ fontSize: 28 }} />
                        {lowBandwidthModeActive && previewImage ? (
                          <Typography
                            variant="caption"
                            sx={{ color: 'var(--wp-muted)' }}
                          >
                            Preview paused
                          </Typography>
                        ) : null}
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        p: 1.25,
                        background:
                          'linear-gradient(180deg, rgba(12,12,14,0) 0%, rgba(12,12,14,0.78) 100%)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'var(--wp-text)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title || 'Portfolio highlight'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {portfolioPreviewItems.map((item, index) => (
                <Box
                  key={`portfolio-indicator-${item.id || item.title || index}`}
                  sx={{
                    width: index === activePortfolioIndex ? 36 : 12,
                    height: 2,
                    borderRadius: 999,
                    backgroundColor:
                      index === activePortfolioIndex
                        ? 'var(--wp-gold)'
                        : 'rgba(216, 176, 75, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* ── Reviews card ── */}
          <Box
            className="wp-reveal"
            style={{ animationDelay: '0.24s' }}
            sx={baseCardSx}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Poppins", "Manrope", "Work Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  color: 'var(--wp-text)',
                }}
              >
                Reviews
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--wp-muted)' }}>
                {reviewsCount} total
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              {reviewItems.length > 0 ? (
                reviewItems.map((review, index) => {
                  const reviewRating = Number(review.rating || 0) || 0;
                  const reviewerName =
                    review?.reviewer?.name ||
                    review?.author?.name ||
                    'Verified Client';
                  return (
                    <Box
                      key={review.id || review._id || `review-${index}`}
                      sx={{
                        p: 2,
                        borderRadius: 12,
                        border: '1px solid var(--wp-stroke)',
                        background: 'rgba(14, 14, 18, 0.85)',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mb: 1,
                        }}
                      >
                        <Avatar
                          src={
                            review?.reviewer?.avatar ||
                            review?.author?.avatar ||
                            null
                          }
                          sx={{ width: 36, height: 36 }}
                        >
                          {reviewerName.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="h3"
                            sx={{
                              color: 'var(--wp-text)',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                            }}
                          >
                            {reviewerName}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Rating
                              size="small"
                              readOnly
                              value={reviewRating}
                              precision={0.5}
                              sx={{
                                '& .MuiRating-iconFilled': {
                                  color: 'var(--wp-gold)',
                                },
                                '& .MuiRating-iconEmpty': {
                                  color: 'rgba(216, 176, 75, 0.35)',
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: 'var(--wp-muted)' }}
                            >
                              {reviewRating.toFixed(1)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          color: 'var(--wp-muted)',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {review.comment ||
                          'Great workmanship and clear communication.'}
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <Typography sx={{ color: 'var(--wp-muted)' }}>
                  Reviews will appear here once clients share feedback.
                </Typography>
              )}
            </Stack>
          </Box>

          {/* ── Desktop inline CTA card ── */}
          <Box
            className="wp-reveal"
            style={{ animationDelay: '0.3s' }}
            sx={{
              ...baseCardSx,
              display: { xs: 'none', md: 'block' },
              background:
                'linear-gradient(160deg, rgba(20, 20, 24, 0.96) 0%, rgba(14, 14, 18, 0.98) 100%)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { md: 'row' },
                gap: 2,
              }}
            >
              <Button fullWidth onClick={handlePrimaryCta} sx={primaryCtaSx}>
                {primaryCtaLabel}
              </Button>
              <Button
                fullWidth
                onClick={handleSecondaryCta}
                sx={secondaryCtaSx}
              >
                {secondaryCtaLabel}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* ── Mobile sticky CTA — sits flush at screen bottom with safe-area padding ── */}
        <Box
          sx={{
            position: 'fixed',
            left: { xs: '50%', md: 0 },
            right: { xs: 'auto', md: 0 },
            bottom: 0,
            display: { xs: 'flex', md: 'none' },
            width: { xs: 'calc(100% - 24px)', md: 'auto' },
            maxWidth: { xs: 260, md: 'none' },
            transform: { xs: 'translateX(-50%)', md: 'none' },
            gap: 1,
            px: 1.5,
            pt: 1,
            // Respect iOS home-indicator safe area; fall back to 8px on Android/web
            pb: 'max(env(safe-area-inset-bottom, 0px), 8px)',
            minHeight: STICKY_CTA_HEIGHT,
            alignItems: 'stretch',
            flexDirection: 'column',
            backgroundColor: 'rgba(14, 14, 18, 0.96)',
            borderTop: '1px solid var(--wp-stroke)',
            borderRadius: '18px 18px 0 0',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 -12px 24px rgba(0, 0, 0, 0.4)',
            zIndex: Z_INDEX.stickyCta,
          }}
        >
          <Button
            onClick={handlePrimaryCta}
            sx={{
              ...primaryCtaSx,
              width: '100%',
              minWidth: 0,
              letterSpacing: { xs: '0.08em', md: '0.12em' },
            }}
          >
            {primaryCtaLabel}
          </Button>
          <Button
            onClick={handleSecondaryCta}
            sx={{
              ...secondaryCtaSx,
              width: '100%',
              minWidth: 0,
              letterSpacing: { xs: '0.08em', md: '0.12em' },
            }}
          >
            {secondaryCtaLabel}
          </Button>
        </Box>

        {/* ── Portfolio detail dialog ── */}
        <Dialog
          open={portfolioDialogOpen}
          onClose={() => setPortfolioDialogOpen(false)}
          maxWidth="md"
          fullWidth
          aria-labelledby="portfolio-item-dialog-title"
          PaperProps={{
            sx: {
              backgroundColor: '#111114',
              color: 'var(--wp-text)',
              borderRadius: 3,
              border: '1px solid var(--wp-stroke)',
            },
          }}
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
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{
                      fontFamily:
                        '"Poppins", "Manrope", "Work Sans", sans-serif',
                    }}
                  >
                    {selectedPortfolioItem.title}
                  </Typography>
                  <IconButton
                    onClick={() => setPortfolioDialogOpen(false)}
                    aria-label="Close portfolio preview dialog"
                    sx={{
                      color: 'var(--wp-gold)',
                      '&:focus-visible': {
                        outline: '3px solid var(--wp-gold)',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  {selectedPortfolioPreviewImage &&
                  shouldRenderPortfolioPreviews ? (
                    <Box
                      component="img"
                      src={selectedPortfolioPreviewImage}
                      alt={selectedPortfolioItem.title}
                      sx={{ width: '100%', height: 'auto', borderRadius: 2 }}
                    />
                  ) : selectedPortfolioPreviewImage ? (
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(26, 26, 31, 0.92)',
                        color: 'var(--wp-text)',
                        border: '1px solid var(--wp-stroke)',
                      }}
                    >
                      Image preview is paused while low-bandwidth mode is
                      active.
                    </Alert>
                  ) : null}
                </Box>
                <Typography sx={{ mb: 2, color: 'var(--wp-muted)' }}>
                  {selectedPortfolioItem.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPortfolioItem.technologies?.map((tech, index) => (
                    <Chip
                      key={`${tech}-${index}`}
                      label={tech}
                      size="small"
                      sx={skillChipSx}
                    />
                  ))}
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>

        <Snackbar
          open={Boolean(feedbackMessage)}
          autoHideDuration={2500}
          onClose={() => setFeedbackMessage('')}
          message={feedbackMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </>
  );
}

WorkerProfile.propTypes = {
  workerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default WorkerProfile;
