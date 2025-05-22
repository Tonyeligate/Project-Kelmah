import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert
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
  NoteAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import JobApplication from '../../components/jobs/JobApplication';

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
  }
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  background: 'rgba(255, 215, 0, 0.2)',
  color: '#FFD700',
  borderColor: 'rgba(255, 215, 0, 0.5)',
  '&:hover': {
    background: 'rgba(255, 215, 0, 0.3)',
  }
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
  }
}));

// Mock data for job details
const MOCK_JOB = {
  id: 1,
  title: 'Bathroom Plumbing Repair',
  description: `I need an experienced plumber to repair a leaking shower and replace bathroom sink fixtures. The shower has been leaking for about a week and the sink faucet needs to be upgraded to a modern design.

Additional tasks may include checking the water pressure throughout the house and providing recommendations for future maintenance.

Please have at least 5 years of experience and bring your own tools. This is a residential job in a single-family home.`,
  location: 'Boston, MA',
  category: 'Plumbing',
  rateType: 'hourly',
  minRate: 40,
  maxRate: 60,
  deadline: '2023-05-15',
  postedDate: '2023-04-22',
  skills: ['Fixture Installation', 'Pipe Repair', 'Leak Detection', 'Water Pressure Regulation'],
  applicants: 12,
  status: 'Open',
  hirer: {
    id: 2,
    name: 'Emily Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    reviews: 24,
    jobsPosted: 18
  },
  images: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
  ]
};

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);

  useEffect(() => {
    // In a real app, fetch job details from API
    // Simulating API call with setTimeout
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        // Mocking API call with setTimeout
        setTimeout(() => {
          setJob(MOCK_JOB);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load job details');
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleApplyNow = () => {
    setApplicationOpen(true);
  };

  const handleCloseApplication = () => {
    setApplicationOpen(false);
  };

  const handleMessageHirer = () => {
    navigate(`/messages?hirerId=${job.hirer.id}`);
  };

  const handleToggleSave = () => {
    setSaved(!saved);
    // In a real app, would call API to save/unsave the job
  };

  const handleShareJob = () => {
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

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#1a1a1a'
      }}>
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#1a1a1a',
        p: 3
      }}>
        <Alert severity="error" sx={{ background: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!job) return null;

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      py: 8, 
      px: 2,
      background: '#1a1a1a'
    }}>
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
              }
            }}
          >
            Back to Jobs
          </Button>
        </motion.div>

        <Grid container spacing={4}>
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
                    sx={{ 
                      mb: 2,
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold'
                    }}
                  >
                    {job.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {job.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Category sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {job.category}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoney sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        ${job.minRate} - ${job.maxRate} / {job.rateType === 'hourly' ? 'hr' : 'fixed'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        Posted: {job.postedDate}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutline sx={{ color: '#FFD700', mr: 0.5 }} />
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {job.applicants} Applicants
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip 
                    label={job.status} 
                    sx={{ 
                      background: job.status === 'Open' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                      color: job.status === 'Open' ? '#4caf50' : '#ff9800',
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
                
                {/* Job Description */}
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#FFD700',
                      mb: 2,
                      fontWeight: 'medium'
                    }}
                  >
                    Description
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#fff',
                      whiteSpace: 'pre-line',
                      mb: 3
                    }}
                  >
                    {job.description}
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#FFD700',
                        mb: 1
                      }}
                    >
                      Required Skills
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {job.skills.map((skill, index) => (
                        <SkillChip key={index} label={skill} />
                      ))}
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
                
                {/* Job Images */}
                {job.images && job.images.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#FFD700',
                        mb: 2,
                        fontWeight: 'medium'
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
                              }
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
                
                {/* Additional Info */}
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#FFD700',
                      mb: 2,
                      fontWeight: 'medium'
                    }}
                  >
                    Deadline
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ color: '#FFD700', mr: 1 }} />
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                      Complete by: {job.deadline}
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
                    fontWeight: 'medium'
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
                      }
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
                        color: '#FFD700'
                      }
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
                    fontWeight: 'medium'
                  }}
                >
                  About the Client
                </Typography>
                
                <ProfileLink onClick={() => navigate(`/profile/${job.hirer.id}`)}>
                  <Avatar
                    src={job.hirer.avatar}
                    alt={job.hirer.name}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                  
                  <Box>
                    <Typography variant="h6" sx={{ color: '#FFD700' }}>
                      {job.hirer.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ color: '#FFD700', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#fff', mr: 1 }}>
                        {job.hirer.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ({job.hirer.reviews} reviews)
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
                      {job.hirer.jobsPosted} jobs posted
                    </Typography>
                  </Box>
                </ProfileLink>
                
                <ActionButton
                  variant="outlined"
                  fullWidth
                  onClick={handleMessageHirer}
                  startIcon={<Message />}
                  sx={{ 
                    mt: 3,
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                    color: '#FFD700',
                    '&:hover': {
                      borderColor: '#FFD700',
                      background: 'rgba(255, 215, 0, 0.1)',
                    }
                  }}
                >
                  Message Client
                </ActionButton>
              </DetailsPaper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Add job application dialog */}
        {job && (
          <JobApplication 
            open={applicationOpen} 
            onClose={handleCloseApplication} 
            jobId={job.id}
            jobTitle={job.title}
          />
        )}
      </Container>
    </Box>
  );
};

export default JobDetailsPage; 