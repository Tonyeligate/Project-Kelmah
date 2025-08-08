import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';

const Input = styled('input')({
  display: 'none',
});

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 200,
  height: 200,
  border: `6px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[20],
  margin: 'auto',
  backgroundColor: theme.palette.primary.main,
  fontSize: '4rem',
  fontWeight: 700,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
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
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

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

  const renderMetrics = () => {
    const isActualMobile = useMediaQuery('(max-width: 768px)');
    
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
                    backgroundColor: theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}>
                    Earnings
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    ${stats.total_earnings || '2,400'}
                  </Typography>
                  <Typography sx={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 500 }}>
                    +15%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}>
                    Upcoming Jobs
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {stats.upcoming_jobs || '3'}
                  </Typography>
                  <Typography sx={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 500 }}>
                    +1
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}>
                    Reviews
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                    }}
                  >
                    {stats.average_rating || '4.8'}
                  </Typography>
                  <Typography sx={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 500 }}>
                    +0.2
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Mobile Wallet Section for Owner */}
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
              Wallet & Payments
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#35332c' : '#f5f5f5',
                    borderRadius: '12px',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                          Wallet Balance
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                          }}
                        >
                          ${stats.wallet_balance || '1,200'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                          In Escrow
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#ff9800',
                          }}
                        >
                          ${stats.in_escrow || '800'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                          Pending Payments
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#2196f3',
                          }}
                        >
                          ${stats.pending_payments || '400'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            borderRadius: '16px',
                            px: 2,
                            py: 0.5,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            },
                          }}
                        >
                          Withdraw
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
              <TrendingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
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
          <ViewIcon color="primary" />
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
                  {item.image ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.image}
                      alt={item.title}
                    />
                  ) : null}
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
                      <AwardIcon />
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
                  {selectedPortfolioItem.image ? (
                    <img
                      src={selectedPortfolioItem.image}
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
