import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert, 
  IconButton, 
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  LinearProgress,
  Rating,
  useTheme,
  useMediaQuery,
  CardActionArea,
  alpha,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  Assignment as ProposalIcon,
  Assessment as ProgressIcon,
  Star as ReviewIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import { 
  fetchHirerProfile, 
  fetchHirerJobs, 
  fetchJobApplications, 
  selectHirerProfile, 
  selectHirerJobs, 
  selectHirerLoading, 
  selectHirerError 
} from '../../store/slices/hirerSlice';

// Import all hirer components
import HirerJobManagement from '../../components/hirer/HirerJobManagement';
import PaymentRelease from '../../components/hirer/PaymentRelease';
import ProposalReview from '../../components/hirer/ProposalReview';
import JobProgressTracker from '../../components/hirer/JobProgressTracker';
import WorkerReview from '../../components/hirer/WorkerReview';
import WorkerSearch from '../../components/hirer/WorkerSearch';

// Custom styled components
const StyledTab = ({ icon, label, ...props }) => (
  <Tab
    icon={icon}
    label={label}
    sx={{
      minHeight: 72,
      color: '#999',
      '&.Mui-selected': {
        color: '#FFD700',
        fontWeight: 600,
      },
      '& .MuiTab-iconWrapper': {
        marginBottom: 0.5,
      },
      textTransform: 'none',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    }}
    {...props}
  />
);

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hirer-dashboard-tabpanel-${index}`}
      aria-labelledby={`hirer-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Enhanced dashboard card component
const DashboardCard = ({ 
  icon, 
  iconColor, 
  title, 
  value, 
  secondaryLabel,
  secondaryValue,
  secondaryComponent,
  actionText, 
  actionIcon, 
  actionHandler,
  actionColor = 'primary',
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'visible',
        borderRadius: 3,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
        },
        ...props.sx
      }}
      {...props}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: -20, 
          left: 20, 
          width: 60, 
          height: 60, 
          borderRadius: '50%',
          bgcolor: iconColor || 'primary.main', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
          border: '4px solid #1a1a1a',
          zIndex: 1
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ pt: 6, pb: 3, px: 3 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          {value}
        </Typography>
        
        {(secondaryLabel || secondaryComponent) && (
          <Box sx={{ mt: 2, mb: 2 }}>
            {secondaryLabel && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {secondaryLabel}
              </Typography>
            )}
            {secondaryComponent || (
              <Typography variant="h6" fontWeight={600}>
                {secondaryValue}
              </Typography>
            )}
          </Box>
        )}
        
        {actionText && (
          <Button 
            variant="outlined" 
            color={actionColor}
            endIcon={actionIcon || <ArrowForwardIcon />}
            onClick={actionHandler}
            sx={{ 
              mt: 2, 
              width: '100%', 
              borderRadius: 2,
              py: 1,
              borderWidth: '2px',
              '&:hover': {
                borderWidth: '2px',
                bgcolor: `rgba(${actionColor === 'primary' ? '255,215,0' : 
                  actionColor === 'success' ? '76,175,80' :
                  actionColor === 'secondary' ? '156,39,176' : 
                  actionColor === 'info' ? '33,150,243' : '255,215,0'},0.05)`
              }
            }}
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const ActionButton = ({ icon, color, label, onClick, ...props }) => (
  <Button 
    fullWidth
    variant="contained"
    color={color}
    startIcon={icon}
    onClick={onClick}
    sx={{ 
      py: 1.8,
      fontSize: '1rem',
      fontWeight: 600,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      borderRadius: 2,
      '&:hover': {
        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)'
      },
      transition: 'all 0.3s ease',
      ...(color === 'primary' && {
        background: 'linear-gradient(45deg, #FFD700, #DAA520)',
        '&:hover': {
          background: 'linear-gradient(45deg, #DAA520, #FFD700)',
          boxShadow: '0 6px 15px rgba(218,165,32,0.4)',
          transform: 'translateY(-2px)'
        },
      }),
      ...props.sx
    }}
    {...props}
  >
    {label}
  </Button>
);

const StyledPaper = ({ children, elevation = 3, ...props }) => (
  <Paper 
    elevation={elevation} 
    sx={{ 
      borderRadius: 3, 
      overflow: 'hidden',
      ...props.sx 
    }}
    {...props}
  >
    {children}
  </Paper>
);

const HirerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get data from Redux store using selectors
  const user = useSelector(state => state.auth.user);
  const hirerProfile = useSelector(state => state.hirer.profile);
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const applications = useSelector(state => state.hirer.applications);
  const payments = useSelector(state => state.hirer.payments);
  const loading = useSelector(selectHirerLoading('profile'));
  const storeError = useSelector(selectHirerError('profile'));
  const unreadNotifications = useSelector(state => state.notifications.unreadCount || 0);
  
  // Fetch hirer data on component mount
  useEffect(() => {
    const fetchHirerData = async () => {
      try {
        setError(null);
        // Fetch hirer profile and jobs
        await Promise.all([
          dispatch(fetchHirerProfile()).unwrap(),
          dispatch(fetchHirerJobs('active')).unwrap(),
          dispatch(fetchHirerJobs('completed')).unwrap()
        ]);
        
        // Fetch applications for each active job
        if (activeJobs) {
          const applicationPromises = activeJobs.map(job => 
            dispatch(fetchJobApplications({ jobId: job.id, status: 'pending' })).unwrap()
          );
          await Promise.all(applicationPromises);
        }
      } catch (err) {
        console.error('Error fetching hirer data:', err);
        setError('Failed to load hirer data. Please try again.');
      }
    };
    
    fetchHirerData();
  }, [dispatch, activeJobs]);
  
  // Handler for refreshing data
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchHirerProfile()).unwrap(),
        dispatch(fetchHirerJobs('active')).unwrap(),
        dispatch(fetchHirerJobs('completed')).unwrap()
      ]);
      
      // Refresh applications for each active job
      if (activeJobs) {
        const applicationPromises = activeJobs.map(job => 
          dispatch(fetchJobApplications({ jobId: job.id, status: 'pending' })).unwrap()
        );
        await Promise.all(applicationPromises);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Calculate total pending proposals
  const totalPendingProposals = Object.values(applications).reduce((total, jobApplications) => {
    return total + (jobApplications.pending?.length || 0);
  }, 0);
  
  // Dashboard summary data
  const summaryData = {
    activeJobs: activeJobs?.length || 0,
    pendingProposals: totalPendingProposals,
    completedJobs: completedJobs?.length || 0,
    totalSpent: hirerProfile?.totalSpent || 0,
    pendingPayments: payments?.pending?.length || 0,
    activeWorkers: hirerProfile?.activeWorkers || []
  };
  
  // Dashboard overview component
  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Welcome banner with stats */}
      <Grid item xs={12}>
        <Paper 
          elevation={4}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.8) 100%)',
            borderRadius: 4,
            mb: 4,
            border: '1px solid rgba(255,215,0,0.2)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,215,0,0.07) 0%, transparent 60%)',
              zIndex: 0
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' }, 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: 2
            }}>
              <Box>
                <Typography 
                  variant="h3" 
                  gutterBottom 
                  fontWeight={700} 
                  sx={{ 
                    color: '#FFD700',
                    textShadow: '0px 2px 4px rgba(0,0,0,0.4)',
                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
                  }}
                >
                  Welcome back, {hirerProfile?.firstName || user?.firstName || 'Hirer'}!
                </Typography>
                <Typography 
                  variant="h6" 
                  color="white" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 400,
                    maxWidth: '90%',
                    lineHeight: 1.5
                  }}
                >
                  Manage your jobs, review proposals, and track progress
                </Typography>
              </Box>
              
              {/* Stats summary */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2} 
                sx={{ 
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  width: { xs: '100%', md: 'auto' },
                  mt: { xs: 2, md: 0 }
                }}
              >
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    px: 3, 
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    minWidth: 120,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="#FFD700">
                    {summaryData.activeJobs}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Active Jobs
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    px: 3, 
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: 120,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="white">
                    {summaryData.activeWorkers?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Active Workers
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    px: 3, 
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(76,175,80,0.05)',
                    border: '1px solid rgba(76,175,80,0.3)',
                    minWidth: 120,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="#4CAF50">
                    ${summaryData.totalSpent?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Total Spent
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Summary cards */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={3}>
          {/* Active Jobs Card */}
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<WorkIcon sx={{ fontSize: 30, color: 'primary.contrastText' }} />}
              iconColor="primary.main"
              title="Active Jobs"
              value={summaryData.activeJobs}
              secondaryLabel="Pending applications"
              secondaryComponent={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {summaryData.pendingProposals}
                  </Typography>
                  <Chip 
                    label="Waiting for review" 
                    size="small" 
                    color="warning" 
                    sx={{ borderRadius: 1.5 }}
                  />
                </Box>
              }
              actionText="Manage Jobs"
              actionHandler={() => setTabValue(1)}
            />
          </Grid>

          {/* Completed Jobs Card */}
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<CheckCircleIcon sx={{ fontSize: 30, color: 'success.contrastText' }} />}
              iconColor="success.main"
              title="Completed Jobs"
              value={completedJobs?.length || 0}
              secondaryLabel="Success rate"
              secondaryComponent={
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={hirerProfile?.completionRate || 100} 
                      color="success"
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'rgba(76,175,80,0.1)'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {hirerProfile?.completionRate || 100}%
                  </Typography>
                </Box>
              }
              actionText="View History"
              actionColor="success"
              actionHandler={() => setTabValue(2)}
            />
          </Grid>

          {/* Worker Management Card */}
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<PeopleIcon sx={{ fontSize: 30, color: 'secondary.contrastText' }} />}
              iconColor="secondary.main"
              title="Worker Management"
              value={hirerProfile?.activeWorkers?.length || 0}
              secondaryLabel="Average worker rating"
              secondaryComponent={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating 
                    value={hirerProfile?.averageWorkerRating || 0} 
                    readOnly 
                    precision={0.5} 
                    size="medium"
                    sx={{ color: '#FFD700' }}
                  />
                  <Typography variant="body1" fontWeight={600} sx={{ ml: 1 }}>
                    {hirerProfile?.averageWorkerRating?.toFixed(1) || 0}
                  </Typography>
                </Box>
              }
              actionText="Manage Workers"
              actionColor="secondary"
              actionHandler={() => setTabValue(3)}
            />
          </Grid>

          {/* Financial Overview Card */}
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<PaymentIcon sx={{ fontSize: 30, color: 'white' }} />}
              iconColor="info.main"
              title="Financial Overview"
              value={
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box component="span" sx={{ fontSize: '1.5rem', mr: 0.5 }}>$</Box>
                  {hirerProfile?.totalSpent?.toLocaleString() || 0}
                </Box>
              }
              secondaryLabel="Current budget"
              secondaryValue={
                <Typography variant="h6" fontWeight={600} color="info.main">
                  ${hirerProfile?.currentBudget?.toLocaleString() || 0} available
                </Typography>
              }
              actionText="Financial Reports"
              actionColor="info"
              actionHandler={() => setTabValue(4)}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Recent activity and notifications */}
      <Grid item xs={12} md={4}>
        <StyledPaper elevation={3} sx={{ height: '100%' }}>
          <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              bgcolor: 'background.dark',
              color: 'white',
              py: 2,
              px: 3,
              background: 'linear-gradient(90deg, #1a1a1a 0%, #222222 100%)',
              borderBottom: '1px solid rgba(255,215,0,0.2)'
            }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Activity
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {hirerProfile?.recentActivity && hirerProfile.recentActivity.length > 0 ? (
                  hirerProfile.recentActivity.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          px: 3, 
                          py: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,215,0,0.03)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: 
                              activity.type === 'job_posted' ? 'primary.main' :
                              activity.type === 'worker_hired' ? 'secondary.main' :
                              activity.type === 'payment' ? 'success.main' :
                              'info.main',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}>
                            {activity.type === 'job_posted' ? (
                              <WorkIcon />
                            ) : activity.type === 'worker_hired' ? (
                              <PeopleIcon />
                            ) : activity.type === 'payment' ? (
                              <PaymentIcon />
                            ) : (
                              <NotificationsIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" fontWeight={600}>
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                sx={{ display: 'block', mt: 0.5, mb: 0.5 }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.description}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                              >
                                {new Date(activity.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < hirerProfile.recentActivity.slice(0, 5).length - 1 && (
                        <Divider component="li" sx={{ opacity: 0.6 }} />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem sx={{ px: 3, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2, opacity: 0.4 }} />
                    <ListItemText
                      primary={
                        <Typography align="center" variant="subtitle1" color="text.secondary" gutterBottom>
                          No recent activity
                        </Typography>
                      }
                      secondary={
                        <Typography align="center" variant="body2" color="text.disabled">
                          Your activities will appear here
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <Button 
                startIcon={<NotificationsIcon />}
                onClick={() => navigate('/notifications')}
                variant="text"
                color="primary"
                sx={{
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(255,215,0,0.05)'
                  }
                }}
              >
                View All Notifications
                {unreadNotifications > 0 && (
                  <Badge 
                    color="error" 
                    badgeContent={unreadNotifications} 
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
            </Box>
          </CardContent>
        </StyledPaper>
      </Grid>

      {/* Quick actions */}
      <Grid item xs={12}>
        <StyledPaper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={3}>
              <ActionButton 
                icon={<AddIcon />} 
                color="primary" 
                label="Post New Job"
                onClick={() => navigate('/jobs/post')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ActionButton 
                icon={<PeopleIcon />} 
                color="secondary" 
                label="Find Talent"
                onClick={() => navigate('/talent/search')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ActionButton 
                icon={<MessageIcon />} 
                color="info" 
                label="Messages"
                onClick={() => navigate('/messages')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ActionButton 
                icon={<PaymentIcon />} 
                color="success" 
                label="Payments"
                onClick={() => navigate('/payments')}
              />
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>
    </Grid>
  );
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <CircularProgress sx={{ mb: 2, color: '#FFD700' }} />
        <Typography variant="body1" color="text.secondary">
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Helmet>
        <title>Hirer Dashboard | Kelmah</title>
      </Helmet>
      
      {/* Dashboard header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap'
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#1a1a1a'
            }}
          >
            {user && `Welcome, ${user.firstName || user.name || 'Hirer'}`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your jobs, review proposals, and track progress
          </Typography>
        </Box>
        
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.03)',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.05)',
              }
            }}
          >
            <RefreshIcon 
              sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }} 
            />
          </IconButton>
        </Tooltip>
      </Box>
      
      {(error || storeError) && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#f44336',
            }
          }} 
          onClose={() => setError(null)}
        >
          {error || storeError}
        </Alert>
      )}
      
      {/* Main dashboard tabs */}
      <StyledPaper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="hirer dashboard tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <StyledTab icon={<DashboardIcon />} label="Overview" />
          <StyledTab icon={<WorkIcon />} label="Jobs" />
          <StyledTab icon={<ProposalIcon />} label="Proposals" />
          <StyledTab icon={<PaymentIcon />} label="Payments" />
          <StyledTab icon={<ProgressIcon />} label="Progress" />
          <StyledTab icon={<ReviewIcon />} label="Reviews" />
        </Tabs>
      </StyledPaper>
      
      {/* Dashboard overview */}
      <TabPanel value={tabValue} index={0}>
        {renderDashboardOverview()}
      </TabPanel>
      
      {/* Jobs management */}
      <TabPanel value={tabValue} index={1}>
        <HirerJobManagement />
      </TabPanel>
      
      {/* Proposal review */}
      <TabPanel value={tabValue} index={2}>
        <ProposalReview />
      </TabPanel>
      
      {/* Payment release */}
      <TabPanel value={tabValue} index={3}>
        <PaymentRelease />
      </TabPanel>
      
      {/* Job progress tracking */}
      <TabPanel value={tabValue} index={4}>
        <JobProgressTracker />
      </TabPanel>
      
      {/* Worker reviews */}
      <TabPanel value={tabValue} index={5}>
        <WorkerReview />
      </TabPanel>
    </Container>
  );
};

export default HirerDashboardPage; 