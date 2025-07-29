import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
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
  CardActionArea,
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
  useMediaQuery,
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
  DialogActions,
  TextField,
  Fade,
  Grow,
  Slide,
  Zoom,
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
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  BusinessCenter as BusinessCenterIcon,
  LocalOffer as LocalOfferIcon,
  CalendarToday as CalendarTodayIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  GroupWork as GroupWorkIcon,
  Home as HomeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';

// Advanced animations for professional showcase
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-20px) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(33, 150, 243, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(360deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const magneticHover = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(2px, -2px); }
  50% { transform: translate(-2px, 2px); }
  75% { transform: translate(2px, 2px); }
  100% { transform: translate(0, 0); }
`;

// Enhanced styled components for professional presentation
const ProfileHeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 25%,
    ${theme.palette.primary.dark} 50%,
    ${theme.palette.secondary.dark} 75%,
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 20s ease infinite`,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  minHeight: { xs: '70vh', md: '80vh' },
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 30% 70%, ${alpha('#4ECDC4', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 20% 20%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 60%)`,
    animation: `${float} 25s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(from 45deg at 50% 50%, 
      transparent 0deg, 
      ${alpha('#FFD700', 0.15)} 60deg, 
      transparent 120deg,
      ${alpha('#4ECDC4', 0.15)} 180deg,
      transparent 240deg,
      ${alpha('#FF6B6B', 0.15)} 300deg,
      transparent 360deg)`,
    animation: `${sparkle} 40s linear infinite`,
  },
}));

const GlassCard = styled(Card)(({ theme, premium = false, featured = false, elevated = false }) => ({
  background: premium 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#9C27B0', 0.05)})`
    : featured
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.secondary.main, 0.05)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(30px)',
  border: premium 
    ? `3px solid ${alpha('#9C27B0', 0.3)}`
    : featured 
    ? `3px solid ${alpha(theme.palette.secondary.main, 0.3)}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 24,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  ...(elevated && {
    transform: 'translateY(-8px)',
    boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
  }),
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: premium
      ? `0 32px 64px ${alpha('#9C27B0', 0.3)}`
      : featured
      ? `0 32px 64px ${alpha(theme.palette.secondary.main, 0.3)}`
      : `0 28px 56px ${alpha(theme.palette.common.black, 0.15)}`,
    borderColor: premium ? '#9C27B0' : featured ? theme.palette.secondary.main : theme.palette.secondary.light,
    '&::before': {
      opacity: 1,
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: premium
      ? `linear-gradient(90deg, transparent, ${alpha('#9C27B0', 0.1)}, transparent)`
      : featured
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
    transition: 'left 0.8s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme, size = 'large', verified = false, premium = false }) => ({
  width: size === 'large' ? 200 : size === 'medium' ? 120 : 80,
  height: size === 'large' ? 200 : size === 'medium' ? 120 : 80,
  border: verified || premium 
    ? `6px solid ${premium ? '#9C27B0' : theme.palette.success.main}`
    : `4px solid ${theme.palette.background.paper}`,
  boxShadow: verified || premium
    ? `0 20px 40px ${alpha(premium ? '#9C27B0' : theme.palette.success.main, 0.4)}`
    : theme.shadows[20],
  margin: 'auto',
  background: premium 
    ? `linear-gradient(135deg, #9C27B0, #673AB7)`
    : verified
    ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  fontSize: size === 'large' ? '4rem' : size === 'medium' ? '2.5rem' : '1.5rem',
  fontWeight: 700,
  position: 'relative',
  '&::after': verified || premium ? {
    content: premium ? '"👑"' : '"✓"',
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: size === 'large' ? 48 : 32,
    height: size === 'large' ? 48 : 32,
    background: premium ? '#9C27B0' : theme.palette.success.main,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'large' ? '1.5rem' : '1rem',
    color: 'white',
    fontWeight: 900,
    border: `3px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[8],
  } : {},
}));

const SkillChip = styled(Chip)(({ theme, level, expertise, category }) => {
  const getSkillColor = () => {
    switch (level || expertise) {
      case 'expert': return '#E74C3C';
      case 'advanced': return '#F39C12';
      case 'intermediate': return '#3498DB';
      case 'beginner': return '#27AE60';
      default: return theme.palette.secondary.main;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'technical': return '#9B59B6';
      case 'soft': return '#1ABC9C';
      case 'leadership': return '#E67E22';
      case 'certification': return '#34495E';
      default: return theme.palette.primary.main;
    }
  };

  const skillColor = getSkillColor();
  const catColor = getCategoryColor();
  const finalColor = category ? catColor : skillColor;

  return {
    borderRadius: 24,
    fontWeight: 800,
    fontSize: '0.95rem',
    minHeight: 44,
    background: `linear-gradient(135deg, ${alpha(finalColor, 0.15)}, ${alpha(finalColor, 0.25)})`,
    color: finalColor,
    border: `2px solid ${alpha(finalColor, 0.4)}`,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(finalColor, 0.25)}, ${alpha(finalColor, 0.35)})`,
      transform: 'translateY(-4px) scale(1.1)',
      boxShadow: `0 16px 32px ${alpha(finalColor, 0.4)}`,
      borderColor: finalColor,
      '&::before': {
        opacity: 1,
      },
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, ${alpha(finalColor, 0.1)}, ${alpha(finalColor, 0.2)})`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:active': {
      transform: 'translateY(-2px) scale(1.05)',
    },
  };
});

const MetricCard = styled(motion.div)(({ theme, color = theme.palette.primary.main, gradient = false, glowing = false }) => ({
  background: gradient 
    ? `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.2)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${alpha(color, 0.3)}`,
  borderRadius: 20,
  padding: theme.spacing(3),
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 140,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: `0 24px 48px ${alpha(color, 0.3)}`,
    borderColor: color,
    background: gradient 
      ? `linear-gradient(135deg, ${alpha(color, 0.15)}, ${alpha(color, 0.25)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(color, 0.05)})`,
    '&::after': {
      opacity: 1,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100px',
    height: '100px',
    background: `radial-gradient(circle, ${alpha(color, 0.2)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
  ...(glowing && {
    animation: `${pulse} 3s ease-in-out infinite`,
  }),
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', magnetic = false, size = 'medium' }) => ({
  borderRadius: size === 'large' ? 32 : 24,
  padding: size === 'large' 
    ? theme.spacing(2.5, 6) 
    : size === 'small' 
    ? theme.spacing(1, 3) 
    : theme.spacing(1.5, 4),
  fontWeight: 800,
  fontSize: size === 'large' ? '1.2rem' : size === 'small' ? '0.9rem' : '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `2px solid ${theme.palette.secondary.main}` 
    : 'none',
  color: variant === 'contained' ? 'white' : theme.palette.secondary.main,
  boxShadow: variant === 'contained' 
    ? `0 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}` 
    : 'none',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.05)',
    boxShadow: variant === 'contained' 
      ? `0 16px 40px ${alpha(theme.palette.secondary.main, 0.4)}` 
      : `0 12px 32px ${alpha(theme.palette.secondary.main, 0.2)}`,
    background: variant === 'outlined' 
      ? alpha(theme.palette.secondary.main, 0.1) 
      : `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
    '&::before': {
      left: '100%',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.4)}, transparent)`,
    transition: 'left 0.6s',
  },
  '&:active': {
    transform: 'translateY(-3px) scale(1.02)',
  },
  ...(magnetic && {
    '&:hover': {
      animation: `${magneticHover} 0.6s ease-in-out infinite`,
    },
  }),
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    )}
  </div>
);

function WorkerProfile() {
  const { user: authUser } = useAuth();
  const { workerId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);

  const isOwner = authUser?.userId === workerId;

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await workerService.getWorkerById(workerId);
      setProfile(profileRes.data);

      const [
        skillsRes,
        portfolioRes,
        certsRes,
        reviewsRes,
        historyRes,
        availabilityRes,
        statsRes,
      ] = await Promise.all([
          workerService.getWorkerSkills(workerId),
          workerService.getWorkerPortfolio(workerId),
          workerService.getWorkerCertificates(workerId),
          workerService.getWorkerReviews(workerId),
          workerService.getWorkHistory(workerId),
        workerService.getWorkerAvailability(workerId),
        workerService.getWorkerStats(workerId),
      ]);

      setSkills(skillsRes.data || []);
      setPortfolio(portfolioRes.data || []);
      setCertificates(certsRes.data || []);
      setReviews(reviewsRes.data || []);
      setWorkHistory(historyRes.data || []);
      setAvailability(availabilityRes.data || null);
      setStats(statsRes.data || {});
    } catch (err) {
      setError(
        'Failed to load profile data. The worker may not exist or there was a network error.',
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (workerId) {
      fetchAllData();
    }
  }, [workerId, fetchAllData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleContactWorker = () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    navigate(`/messages?recipient=${workerId}`);
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark API call
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.user?.firstName} ${profile?.user?.lastName} - ${profile?.profession}`,
          text: `Check out this skilled ${profile?.profession} on Kelmah`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
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
                key={i}
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
            <Grid item xs={12} md={4} key={i}>
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

  const renderProfileHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard sx={{ mb: 4, overflow: 'visible', position: 'relative' }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
                sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
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
                sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
                }}
              >
              <ShareIcon />
              </IconButton>
            {isOwner && (
              <IconButton
                onClick={() => navigate('/worker/profile/edit')}
          sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover': { bgcolor: theme.palette.background.paper },
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
                src={profile.profile_picture}
                alt={`${profile.user?.firstName} ${profile.user?.lastName}`}
            >
                {profile.user?.firstName?.charAt(0)}
                {profile.user?.lastName?.charAt(0)}
            </ProfileAvatar>
          </Badge>

            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ mt: 2, mb: 1, color: theme.palette.text.primary }}
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
              sx={{ mb: 2 }}
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
                value={profile.average_rating || 0}
                  precision={0.1}
                readOnly
                  size="large"
              />
                <Typography variant="h6" fontWeight={600}>
                  {profile.average_rating?.toFixed(1) || '0.0'}
                </Typography>
              <Typography variant="body1" color="text.secondary">
                ({reviews.length} reviews)
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
                lineHeight: 1.8,
                fontSize: '1.1rem',
              }}
            >
              {profile.bio ||
                'Professional craftsperson dedicated to delivering quality work.'}
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
                  onClick={() =>
                    navigate(`/contracts/create?workerId=${workerId}`)
                  }
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

  const renderMetrics = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
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
              {stats.jobs_completed || 0}
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
              ${profile.hourly_rate || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per Hour
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item xs={6} md={3}>
          <MetricCard>
            <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              {(
                ((stats.jobs_completed || 0) /
                  Math.max(
                    (stats.jobs_completed || 0) + (stats.jobs_cancelled || 0),
                    1,
                  )) *
                100
              ).toFixed(0)}
              %
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </MetricCard>
        </Grid>
      </Grid>
    </motion.div>
  );

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
                <SkillChip key={index} label={skill.name} size="medium" />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Specializations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.specializations?.map((spec, index) => (
              <Chip
                  key={index}
                  label={spec}
                variant="outlined"
                  color="primary"
              />
              )) || [
              <Chip
                  key="general"
                  label="General Construction"
                variant="outlined"
                  color="primary"
                />,
              <Chip
                  key="residential"
                  label="Residential Work"
                variant="outlined"
                  color="primary"
                />,
              ]}
          </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Tools & Equipment
            </Typography>
            <List dense>
              {(
                profile.tools || [
                  'Power Tools',
                  'Hand Tools',
                  'Safety Equipment',
                  'Measuring Tools',
                ]
              ).map((tool, index) => (
                <ListItem key={index}>
                  <ListItemText primary={tool} />
                </ListItem>
              ))}
            </List>
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
          <VisibilityIcon color="primary" />
          Portfolio & Previous Work
        </Typography>

        {portfolio.length > 0 ? (
            <Grid container spacing={2}>
            {portfolio.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image || '/api/placeholder/400/300'}
                    alt={item.title}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
                </Grid>
              ))}
            </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <VisibilityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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

        {reviews.length > 0 ? (
            <List>
            {reviews.slice(0, 5).map((review, index) => (
              <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                    <Avatar>{review.client_name?.charAt(0) || 'C'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {review.client_name || 'Anonymous Client'}
                          </Typography>
                        <Rating value={review.rating} size="small" readOnly />
                        </Box>
                      }
                      secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {review.comment}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.created_at).toLocaleDateString()}
                        </Typography>
                      </>
                      }
                    />
                  </ListItem>
                {index < reviews.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
                </React.Fragment>
              ))}
            </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No reviews yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
              Be the first to work with this professional and leave a review
                        </Typography>
          </Box>
                      )}
                    </CardContent>
    </GlassCard>
  );

  const renderAvailability = () => (
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
              label={availability?.status || 'Available'}
              color={
                availability?.status === 'Available' ? 'success' : 'warning'
              }
              size="large"
              sx={{ mb: 2 }}
            />

            <Typography variant="body1" gutterBottom>
              <strong>Response Time:</strong>{' '}
              {availability?.response_time || 'Within 2 hours'}
            </Typography>
            <Typography variant="body1">
              <strong>Next Available:</strong>{' '}
              {availability?.next_available || 'Immediately'}
            </Typography>
                </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Working Hours
            </Typography>
            <List dense>
              {(
                availability?.working_hours || [
                  'Monday: 8:00 AM - 6:00 PM',
                  'Tuesday: 8:00 AM - 6:00 PM',
                  'Wednesday: 8:00 AM - 6:00 PM',
                  'Thursday: 8:00 AM - 6:00 PM',
                  'Friday: 8:00 AM - 6:00 PM',
                  'Weekend: By appointment',
                ]
              ).map((hours, index) => (
                <ListItem key={index}>
                  <ListItemText primary={hours} />
                </ListItem>
              ))}
            </List>
            </Grid>
        </Grid>
      </CardContent>
    </GlassCard>
  );

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
          Certifications & Credentials
        </Typography>

        {certificates.length > 0 ? (
          <Grid container spacing={2}>
            {certificates.map((cert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <EmojiEventsIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {cert.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cert.issuing_organization}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                      </Typography>
        </Box>
                    {cert.is_verified && <VerifiedIcon color="success" />}
                  </Box>
                </Card>
              </Grid>
            ))}
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

  return (
    <>
      <Helmet>
        <title>{`${profile.user?.firstName} ${profile.user?.lastName} - ${profile.profession} | Kelmah`}</title>
        <meta
          name="description"
          content={`Professional ${profile.profession} available for hire. View portfolio, reviews, and contact ${profile.user?.firstName} for your next project.`}
        />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" href="/" onClick={() => navigate('/')}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link
            color="inherit"
            href="/find-talents"
            onClick={() => navigate('/find-talents')}
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
            <Tab label="Overview" />
            <Tab label="Portfolio" />
            <Tab label="Reviews" />
            <Tab label="Availability" />
            <Tab label="Certifications" />
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
            {tabValue === 0 && (
              <>
                {renderSkillsAndExpertise()}
                {renderAvailability()}
              </>
            )}
            {tabValue === 1 && renderPortfolio()}
            {tabValue === 2 && renderReviews()}
            {tabValue === 3 && renderAvailability()}
            {tabValue === 4 && renderCertifications()}
          </motion.div>
        </AnimatePresence>

        {/* Portfolio Item Dialog */}
        <Dialog
          open={portfolioDialogOpen}
          onClose={() => setPortfolioDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedPortfolioItem && (
            <>
              <DialogTitle>
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
                  <IconButton onClick={() => setPortfolioDialogOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <img
                    src={
                      selectedPortfolioItem.image || '/api/placeholder/600/400'
                    }
                    alt={selectedPortfolioItem.title}
                    style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedPortfolioItem.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPortfolioItem.technologies?.map((tech, index) => (
                    <Chip key={index} label={tech} size="small" />
                  ))}
        </Box>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Floating Action Button for Quick Actions */}
        {!isOwner && (
          <SpeedDial
            ariaLabel="Worker Actions"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
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
              onClick={() => navigate(`/contracts/create?workerId=${workerId}`)}
            />
            <SpeedDialAction
              icon={<ShareIcon />}
              tooltipTitle="Share Profile"
              onClick={handleShare}
            />
          </SpeedDial>
        )}
      </Container>
    </>
  );
}

export default WorkerProfile;
