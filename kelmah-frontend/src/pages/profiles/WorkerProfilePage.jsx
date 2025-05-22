import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Avatar,
  Button,
  Paper,
  Chip,
  Rating,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  VerifiedUser,
  LocationOn,
  WorkOutline,
  School,
  Description,
  Star,
  Phone,
  Email,
  ChatBubbleOutline,
  KeyboardArrowRight,
  CheckCircle,
  Schedule,
  Payment,
  Bookmark,
  BookmarkBorder
} from '@mui/icons-material';
import { workerService } from '../../api/workerService';
import ReviewList from '../../components/reviews/ReviewList';

// Styled components
const ProfileContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const ProfileHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  background: '#1a1a1a',
  color: 'white',
  position: 'relative',
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: '3px solid #D4AF37',
  [theme.breakpoints.down('sm')]: {
    width: 100,
    height: 100,
    margin: '0 auto 16px',
  },
}));

const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
}));

const MainInfoGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
  },
}));

const GoldButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#D4AF37',
  color: '#1a1a1a',
  '&:hover': {
    backgroundColor: '#B8860B',
  },
}));

const OutlinedGoldButton = styled(Button)(({ theme }) => ({
  borderColor: '#D4AF37',
  color: '#D4AF37',
  '&:hover': {
    borderColor: '#B8860B',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: '#1a1a1a',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2c2c2c',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  '&.Mui-selected': {
    color: '#D4AF37',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: '#D4AF37',
  },
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2),
  color: '#D4AF37',
}));

const ReviewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const LoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(8),
}));

const ErrorBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.error.main,
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const WorkerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchWorkerProfile = async () => {
      setLoading(true);
      try {
        const data = await workerService.getWorkerById(id);
        setWorker(data);
        
        // Also fetch reviews
        const reviewsData = await workerService.getWorkerReviews(id);
        setReviews(reviewsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching worker profile:', err);
        setError('Failed to load worker profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerProfile();
    
    // Check if this worker is saved in localStorage
    const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
    setIsSaved(savedWorkers.includes(Number(id)));
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleContact = () => {
    navigate(`/messages/create/${id}`);
  };

  const handleHire = () => {
    navigate(`/hire/${id}`);
  };

  const toggleSave = () => {
    const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
    
    if (isSaved) {
      const updatedSavedWorkers = savedWorkers.filter(workerId => workerId !== Number(id));
      localStorage.setItem('savedWorkers', JSON.stringify(updatedSavedWorkers));
    } else {
      savedWorkers.push(Number(id));
      localStorage.setItem('savedWorkers', JSON.stringify(savedWorkers));
    }
    
    setIsSaved(!isSaved);
  };

  if (loading) {
    return (
      <LoadingBox>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </LoadingBox>
    );
  }

  if (error || !worker) {
    return (
      <ProfileContainer maxWidth="lg">
        <ErrorBox>
          <Typography variant="h6" gutterBottom>
            {error || 'Worker not found'}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/workers')}
            sx={{ mt: 2, borderColor: '#D4AF37', color: '#D4AF37' }}
          >
            Back to Workers
          </Button>
        </ErrorBox>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer maxWidth="lg">
      <ProfileHeader elevation={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3} md={2}>
            <ProfileAvatar src={worker.avatar} alt={worker.name} />
          </Grid>
          
          <MainInfoGrid item xs={12} sm={6} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="h4" component="h1" sx={{ mr: 1, fontWeight: 'bold' }}>
                {worker.name}
              </Typography>
              {worker.verified && (
                <VerifiedUser sx={{ color: '#4CAF50' }} />
              )}
            </Box>
            
            <Typography variant="h6" gutterBottom color="rgba(255, 255, 255, 0.7)">
              {worker.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: { xs: 1, sm: 0 } }}>
                <LocationOn sx={{ fontSize: 18, mr: 0.5, color: '#D4AF37' }} />
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
                  {worker.location}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ fontSize: 18, mr: 0.5, color: '#D4AF37' }} />
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating 
                    value={worker.rating} 
                    readOnly 
                    size="small" 
                    sx={{ mr: 1, color: '#D4AF37' }}
                  />
                  <span>({worker.reviewCount} reviews)</span>
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip 
                label={`$${worker.hourlyRate}/hr`} 
                sx={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                  color: '#D4AF37',
                  fontWeight: 'bold'
                }} 
              />
              <Chip 
                label={`${worker.completedJobs} Jobs`} 
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} 
              />
              <Chip 
                label={`${worker.experience} Years Experience`} 
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} 
              />
            </Box>
          </MainInfoGrid>
          
          <Grid item xs={12} sm={3} md={3} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <GoldButton
              variant="contained"
              fullWidth
              startIcon={<ChatBubbleOutline />}
              onClick={handleContact}
            >
              Contact
            </GoldButton>
            
            <OutlinedGoldButton
              variant="outlined"
              fullWidth
              startIcon={<WorkOutline />}
              onClick={handleHire}
            >
              Hire Me
            </OutlinedGoldButton>
            
            <IconButton 
              onClick={toggleSave}
              sx={{ 
                alignSelf: 'flex-end',
                color: isSaved ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                position: 'absolute',
                top: 16,
                right: 16
              }}
            >
              {isSaved ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
          </Grid>
        </Grid>
      </ProfileHeader>
      
      <Box sx={{ mb: 3 }}>
        <StyledTabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          aria-label="worker profile tabs"
        >
          <StyledTab label="About" />
          <StyledTab label="Services" />
          <StyledTab label="Portfolio" />
          <StyledTab label="Reviews" />
        </StyledTabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <ProfilePaper elevation={1}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                About Me
              </Typography>
              <Typography variant="body1" paragraph>
                {worker.bio || `Hi, I'm ${worker.name}, a professional ${worker.title} with over ${worker.experience} years of experience in the field. I specialize in providing high-quality services to both residential and commercial clients in the ${worker.location} area. My goal is to deliver exceptional results that exceed my clients' expectations.`}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {`Throughout my career, I have successfully completed ${worker.completedJobs}+ projects, ranging from small repairs to large-scale installations. I take pride in my work and ensure that every job is done with attention to detail and professionalism.`}
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
                Skills & Expertise
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                {worker.skills.map((skill, index) => (
                  <SkillChip key={index} label={skill} />
                ))}
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
                Work Experience
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <WorkOutline sx={{ color: '#D4AF37' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${worker.title} | Self-Employed`}
                    secondary={`${new Date().getFullYear() - worker.experience} - Present (${worker.experience} years)`}
                  />
                </ListItem>
                {/* Could add more work experiences here if available in the data */}
              </List>
            </ProfilePaper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ProfilePaper elevation={1}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Info
              </Typography>
              
              <InfoItem>
                <IconWrapper>
                  <Payment />
                </IconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hourly Rate
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    ${worker.hourlyRate}/hr
                  </Typography>
                </Box>
              </InfoItem>
              
              <InfoItem>
                <IconWrapper>
                  <CheckCircle />
                </IconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed Jobs
                  </Typography>
                  <Typography variant="body1">
                    {worker.completedJobs}
                  </Typography>
                </Box>
              </InfoItem>
              
              <InfoItem>
                <IconWrapper>
                  <Schedule />
                </IconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Experience
                  </Typography>
                  <Typography variant="body1">
                    {worker.experience} years
                  </Typography>
                </Box>
              </InfoItem>
              
              <InfoItem>
                <IconWrapper>
                  <LocationOn />
                </IconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {worker.location}
                  </Typography>
                </Box>
              </InfoItem>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Availability
              </Typography>
              <Typography variant="body1">
                Available for new projects
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Usually responds within 24 hours
              </Typography>
            </ProfilePaper>
            
            {/* Additional paper for verification badges if needed */}
            <ProfilePaper elevation={1}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Verifications
              </Typography>
              
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Identity Verified"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Background Check"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Professional License"
                  />
                </ListItem>
              </List>
            </ProfilePaper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <ProfilePaper elevation={1}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Services Offered
          </Typography>
          
          <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {worker.category === 'Plumbing' ? 'Pipe Installation' : 
                        worker.category === 'Electrical' ? 'Wiring Service' :
                        worker.category === 'Carpentry' ? 'Custom Furniture' : 'Standard Service'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {`Professional ${worker.category.toLowerCase()} service with quality materials and workmanship.`}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
                        ${Math.round(worker.hourlyRate * (item === 1 ? 1 : item === 2 ? 1.5 : 2))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item === 1 ? 'Basic' : item === 2 ? 'Standard' : 'Premium'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </ProfilePaper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <ProfilePaper elevation={1}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Previous work samples and projects
          </Typography>
          
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Box 
                  sx={{ 
                    height: 200, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      '& .overlay': {
                        opacity: 1
                      }
                    }
                  }}
                >
                  <Box 
                    component="img"
                    src={`https://source.unsplash.com/random/300x200?${worker.category.toLowerCase()},${item}`}
                    alt={`Portfolio item ${item}`}
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                  <Box 
                    className="overlay"
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      color: 'white',
                      p: 2
                    }}
                  >
                    <Typography variant="body1" align="center">
                      {`${worker.category} Project ${item}`}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </ProfilePaper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <ProfilePaper elevation={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Client Reviews ({worker.reviewCount})
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="text" 
                endIcon={<KeyboardArrowRight />}
                onClick={() => navigate(`/workers/${worker.id}/reviews`)}
                sx={{ color: '#D4AF37' }}
              >
                See All Reviews
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mr: 2 }}>
              {worker.rating.toFixed(1)}
            </Typography>
            <Box>
              <Rating value={worker.rating} readOnly precision={0.5} sx={{ color: '#D4AF37' }} />
              <Typography variant="body2" color="text.secondary">
                Based on {worker.reviewCount} reviews
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews.slice(0, 3)} />
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No reviews yet
            </Typography>
          )}
        </ProfilePaper>
      </TabPanel>
    </ProfileContainer>
  );
};

export default WorkerProfilePage; 