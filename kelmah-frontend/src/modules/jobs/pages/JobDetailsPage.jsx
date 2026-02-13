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
import { styled } from '@mui/material/styles';
import JobApplication from '../components/job-application/JobApplication';
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

// Styled components
const DetailsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
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
  background: 'rgba(255, 215, 0, 0.2)',
  color: '#FFD700',
  borderColor: 'rgba(255, 215, 0, 0.5)',
  '&:hover': {
    background: 'rgba(255, 215, 0, 0.3)',
  },
}));

const ProfileLink = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
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
  const location = useLocation();
  const { search } = location;
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const job = useSelector(selectCurrentJob);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const locationLabel = getJobLocationLabel(job);
  const skillLabels = normalizeSkillLabels(job?.skills);
  const isAuthenticated = !!secureStorage.getAuthToken();

  useEffect(() => {
    // Validate jobId before fetching
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ Invalid job ID:', id);
      return;
    }

    // Fetch job details (public endpoint — no auth required for viewing)
    dispatch(fetchJobById(id));
  }, [dispatch, id]);

  // Debug logging
  useEffect(() => {
    if (job) {
      console.log('🔍 Job object in JobDetailsPage:', job);
      console.log('🔍 Job budget:', job.budget);
      console.log('🔍 Job budget type:', typeof job.budget);
    }
  }, [job]);

  // Auto-open application dialog if ?apply=true
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('apply') === 'true') {
      setApplicationOpen(true);
    }
  }, [search]);

  const handleApplyNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + '?apply=true' } });
      return;
    }
    setApplicationOpen(true);
  };

  const handleCloseApplication = () => {
    setApplicationOpen(false);
  };

  const handleMessageHirer = () => {
    if (!job) return;
    navigate(`/messages?participantId=${job.hirer?._id || job.hirer?.id}`);
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
      } else {
        await jobsApi.saveJob(id);
        setSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleShareJob = () => {
    if (!job) return;
    // In a real app, would open a share dialog
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title}`,
        url: window.location.href,
      });
    } else {
      alert('Share feature not supported in your browser');
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
        background: '#1a1a1a',
      }}
    >
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
              color: '#FFD700',
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
                  {/* Embedded Map for Job Location */}
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 200, sm: 250, md: 300 },
                      mb: 3,
                      borderRadius: 2,
                      overflow: 'hidden',
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
                      <LocationOn sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {locationLabel}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Category sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {job?.category || 'Category'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoney sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {job?.budget && job.budget !== null
                          ? typeof job.budget === 'object'
                            ? job.budget.min === job.budget.max
                              ? `${job.budget.currency || 'GHS'} ${job.budget.amount?.toLocaleString() || 0} / ${job.budget.type || 'fixed'}`
                              : `${job.budget.currency || 'GHS'} ${job.budget.min?.toLocaleString() || 0} - ${job.budget.max?.toLocaleString() || 0} / ${job.budget.type || 'fixed'}`
                            : `${job?.currency || 'GHS'} ${job.budget?.toLocaleString()} / ${job?.paymentType || 'fixed'}`
                          : 'Budget not specified'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        Posted:{' '}
                        {job?.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutline sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
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
                      color: String(job?.status || '').toLowerCase() === 'open' ? '#4caf50' : '#ff9800',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>

                <Divider
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }}
                />

                {/* Job Description */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#FFD700',
                      mb: 2,
                      fontWeight: 'medium',
                    }}
                  >
                    Description
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#fff',
                      whiteSpace: 'pre-line',
                      mb: 3,
                    }}
                  >
                    {job?.description || 'No description available'}
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#FFD700',
                        mb: 1,
                      }}
                    >
                      Required Skills
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skillLabels.map((skill, index) => (
                        <SkillChip key={index} label={skill} />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Divider
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }}
                />

                {/* Job Images */}
                {job.images && job.images.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#FFD700',
                        mb: 2,
                        fontWeight: 'medium',
                      }}
                    >
                      Project Images
                    </Typography>

                    <Grid container spacing={2}>
                      {job.images.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
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
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }}
                />

                {/* Additional Info */}
                <Box>
                  {/* Communication Actions */}
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    sx={{ mr: 2, mt: 2 }}
                    onClick={handleMessageHirer}
                  >
                    Message Hirer
                  </Button>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#FFD700',
                      mb: 2,
                      fontWeight: 'medium',
                    }}
                  >
                    Deadline
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ color: '#FFD700', mr: 1 }} />
                    <Typography variant="body1" sx={{ color: '#fff' }}>
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
                    color: '#FFD700',
                    mb: 3,
                    fontWeight: 'medium',
                  }}
                >
                  Apply Now
                </Typography>

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

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <IconButton
                    onClick={handleToggleSave}
                    sx={{
                      color: saved ? '#FFD700' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                      },
                    }}
                  >
                    {saved ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>

                  <IconButton
                    onClick={handleShareJob}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                        color: '#FFD700',
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
                    color: '#FFD700',
                    mb: 3,
                    fontWeight: 'medium',
                  }}
                >
                  About the Client
                </Typography>

                <ProfileLink
                  onClick={() =>
                    navigate(`/profile/${job.hirer?._id || job.hirer?.id}`)
                  }
                >
                  <Avatar
                    src={job.hirer?.avatar || job.hirer?.profilePicture}
                    alt={job.hirer?.firstName || job.hirer?.name || 'Hirer'}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />

                  <Box>
                    <Typography variant="h6" sx={{ color: '#FFD700' }}>
                      {job.hirer?.firstName && job.hirer?.lastName
                        ? `${job.hirer.firstName} ${job.hirer.lastName}`
                        : job.hirer?.name || 'Hirer'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ color: '#FFD700', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#fff', mr: 1 }}>
                        {job.hirer?.rating?.toFixed(1) || 'N/A'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        ({job.hirer?.reviews || 0} reviews)
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}
                    >
                      {job.hirer?.jobsPosted || 0} jobs posted
                    </Typography>
                  </Box>
                </ProfileLink>
              </DetailsPaper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Add job application dialog */}
        {job && (
          <JobApplication
            open={applicationOpen}
            onClose={handleCloseApplication}
            jobId={job?.id}
            jobTitle={job?.title}
          />
        )}
      </Container>
    </Box>
  );
};

export default JobDetailsPage;
