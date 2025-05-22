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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  School as SkillsIcon,
  Assignment as ApplicationIcon,
  Event as CalendarIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Description as ContractIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import { 
  fetchWorkerProfile, 
  fetchWorkerJobs, 
  fetchWorkerApplications, 
  fetchWorkerEarnings, 
  fetchWorkerSkills 
} from '../../store/slices/workerSlice';

// Import all worker components
import JobManagement from '../../components/worker/JobManagement';
import AvailabilityCalendar from '../../components/worker/AvailabilityCalendar';
import EarningsTracker from '../../components/worker/EarningsTracker';
import JobApplication from '../../components/worker/JobApplication';
import SkillsAssessment from '../../components/worker/SkillsAssessment';
import DocumentVerification from '../../components/worker/DocumentVerification';

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`worker-dashboard-tabpanel-${index}`}
      aria-labelledby={`worker-dashboard-tab-${index}`}
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

const WorkerDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get data from Redux store
  const user = useSelector(state => state.auth.user);
  const workerProfile = useSelector(state => state.worker.profile);
  const workerJobs = useSelector(state => state.worker.jobs);
  const workerSkills = useSelector(state => state.worker.skills);
  const workerApplications = useSelector(state => state.worker.applications);
  const workerEarnings = useSelector(state => state.worker.earnings);
  const loading = useSelector(state => state.worker.loading.dashboard);
  const storeError = useSelector(state => state.worker.error.dashboard);
  const unreadNotifications = useSelector(state => state.notifications.unreadCount || 0);
  
  // Fetch worker data on component mount
  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setError(null);
        // Fetch worker profile, jobs, applications, earnings, and skills data
        await Promise.all([
          dispatch(fetchWorkerProfile()).unwrap(),
          dispatch(fetchWorkerJobs('active')).unwrap(),
          dispatch(fetchWorkerApplications('pending')).unwrap(),
          dispatch(fetchWorkerEarnings()).unwrap(),
          dispatch(fetchWorkerSkills()).unwrap()
        ]);
      } catch (err) {
        console.error('Error fetching worker data:', err);
        setError('Failed to load worker data. Please try again.');
      }
    };
    
    fetchWorkerData();
  }, [dispatch]);
  
  // Handler for refreshing data
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchWorkerProfile()).unwrap(),
        dispatch(fetchWorkerJobs('active')).unwrap(),
        dispatch(fetchWorkerApplications('pending')).unwrap(),
        dispatch(fetchWorkerEarnings()).unwrap(),
        dispatch(fetchWorkerSkills()).unwrap()
      ]);
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
  
  // Dashboard summary data
  const summaryData = {
    activeJobs: workerJobs?.active?.length || 0,
    pendingApplications: workerApplications?.pending?.length || 0,
    completedJobs: workerJobs?.completed?.length || 0,
    totalEarnings: workerEarnings?.total || 0,
    pendingPayments: workerEarnings?.pending?.length || 0,
    upcomingDeadlines: workerJobs?.upcomingDeadlines || [],
    completionRate: workerProfile?.metrics?.completionRate || 0,
    verificationStatus: workerProfile?.verificationStatus || 'unverified',
    skillsCompleted: workerSkills?.verified?.length || 0,
    totalSkills: (workerSkills?.verified?.length || 0) + (workerSkills?.unverified?.length || 0),
    recentActivity: workerProfile?.recentActivity || [],
    rating: workerProfile?.metrics?.rating || 0,
    responseRate: workerProfile?.metrics?.responseRate || 0
  };
  
  // Render dashboard overview
  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Stats overview */}
      <Grid item xs={12}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: 4,
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                Hello, {user?.firstName || 'Talent'}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Here's what's happening with your work today
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="h5" color="primary" fontWeight={700}>
                  {summaryData.completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Rate
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="h5" color="secondary" fontWeight={700}>
                  {summaryData.rating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="h5" color="success.main" fontWeight={700}>
                  ${summaryData.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Earnings
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Summary cards - first row */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={3}>
          {/* Active Jobs Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: 20, 
                  width: 56, 
                  height: 56, 
                  borderRadius: 3,
                  bgcolor: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <WorkIcon sx={{ fontSize: 28, color: 'primary.contrastText' }} />
              </Box>
              <CardContent sx={{ pt: 5, pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Active Jobs
                  </Typography>
                  <Chip 
                    label={summaryData.activeJobs > 0 ? "In Progress" : "Available"} 
                    color={summaryData.activeJobs > 0 ? "primary" : "default"}
                    size="small"
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                  {summaryData.activeJobs}
                </Typography>
                {summaryData.activeJobs > 0 && (
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Next deadline
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ color: 'warning.main', mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {summaryData.upcomingDeadlines && summaryData.upcomingDeadlines.length > 0 
                          ? new Date(summaryData.upcomingDeadlines[0].date).toLocaleDateString()
                          : 'No upcoming deadlines'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <Button 
                  variant="outlined" 
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setTabValue(1)}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Manage Jobs
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Applications Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: 20, 
                  width: 56, 
                  height: 56, 
                  borderRadius: 3,
                  bgcolor: 'secondary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <ApplicationIcon sx={{ fontSize: 28, color: 'secondary.contrastText' }} />
              </Box>
              <CardContent sx={{ pt: 5, pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Applications
                  </Typography>
                  {summaryData.pendingApplications > 0 && (
                    <Chip 
                      label="Pending" 
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                  {summaryData.pendingApplications}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Response rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={summaryData.responseRate} 
                        color="secondary"
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {summaryData.responseRate}%
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setTabValue(3)}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  View Applications
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Earnings Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: 20, 
                  width: 56, 
                  height: 56, 
                  borderRadius: 3,
                  bgcolor: 'success.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <PaymentIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <CardContent sx={{ pt: 5, pb: 2 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Earnings
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                  <Box component="span" sx={{ fontSize: '1rem', mr: 0.5 }}>$</Box>
                  {summaryData.totalEarnings.toLocaleString()}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending payments
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color={summaryData.pendingPayments > 0 ? "warning.main" : "text.secondary"}>
                    {summaryData.pendingPayments > 0 
                      ? `$${(summaryData.pendingPayments * 100).toLocaleString()} pending`
                      : "No pending payments"}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="success"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setTabValue(2)}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Track Earnings
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Skills Card */}
          <Grid item xs={12} sm={6}>
            <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: 20, 
                  width: 56, 
                  height: 56, 
                  borderRadius: 3,
                  bgcolor: 'info.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <SkillsIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <CardContent sx={{ pt: 5, pb: 2 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Skills & Verification
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ mr: 1 }}>
                    {summaryData.skillsCompleted}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    /{summaryData.totalSkills}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verification status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip 
                      label={
                        summaryData.verificationStatus === 'verified' 
                          ? 'Verified' 
                          : summaryData.verificationStatus === 'pending' 
                          ? 'Pending'
                          : 'Unverified'
                      } 
                      color={
                        summaryData.verificationStatus === 'verified' 
                          ? 'success' 
                          : summaryData.verificationStatus === 'pending' 
                          ? 'warning'
                          : 'default'
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                <Button 
                  variant="outlined" 
                  color="info"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setTabValue(4)}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Manage Skills
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Recent activity and notifications */}
      <Grid item xs={12} md={4}>
        <Card elevation={2} sx={{ height: '100%' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ 
              bgcolor: 'background.dark',
              color: 'white',
              py: 2,
              px: 3,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Activity
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {summaryData.recentActivity && summaryData.recentActivity.length > 0 ? (
                summaryData.recentActivity.slice(0, 5).map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.color || 'primary.main' }}>
                          {activity.icon === 'work' ? (
                            <WorkIcon />
                          ) : activity.icon === 'payment' ? (
                            <PaymentIcon />
                          ) : activity.icon === 'application' ? (
                            <ApplicationIcon />
                          ) : (
                            <SkillsIcon />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={activity.title}
                        secondary={
                          <React.Fragment>
                            <Typography
                              sx={{ display: 'block' }}
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
                              {new Date(activity.date).toLocaleDateString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < summaryData.recentActivity.slice(0, 5).length - 1 && (
q                    )}o

                  </React.Fragment>
                ))
              ) : (
                <ListItem sx={{ px: 3, py: 2 }}>
                  <ListItemText
                    primary="No recent activity"
                    secondary="Your activities will appear here"
                  />
                </ListItem>
              )}
            </List>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                startIcon={<NotificationsIcon />}
                onClick={() => navigate('/notifications')}
                variant="text"
                color="primary"
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
        </Card>
      </Grid>

      {/* Quick actions */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Button 
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/jobs/search')}
                sx={{ py: 1.5 }}
              >
                Find Jobs
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button 
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<ApplicationIcon />}
                onClick={() => navigate('/jobs/applications')}
                sx={{ py: 1.5 }}
              >
                My Applications
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button 
                fullWidth
                variant="contained"
                color="info"
                startIcon={<SkillsIcon />}
                onClick={() => navigate('/profile/skills')}
                sx={{ py: 1.5 }}
              >
                Update Skills
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button 
                fullWidth
                variant="contained"
                color="success"
                startIcon={<ContractIcon />}
                onClick={() => navigate('/contracts')}
                sx={{ py: 1.5 }}
              >
                Contracts
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Helmet>
        <title>Worker Dashboard | Kelmah</title>
      </Helmet>
      
      {/* Dashboard header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {user && `Welcome, ${user.firstName || user.name || 'Worker'}`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your jobs, track earnings, and enhance your skills
          </Typography>
        </Box>
        
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>
      
      {(error || storeError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error || storeError}
        </Alert>
      )}
      
      {/* Main dashboard tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="worker dashboard tabs"
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<WorkIcon />} label="My Jobs" />
          <Tab icon={<PaymentIcon />} label="Earnings" />
          <Tab icon={<ApplicationIcon />} label="Applications" />
          <Tab icon={<SkillsIcon />} label="Skills" />
          <Tab icon={<ContractIcon />} label="Documents" />
          <Tab icon={<CalendarIcon />} label="Availability" />
        </Tabs>
      </Paper>
      
      {/* Dashboard overview */}
      <TabPanel value={tabValue} index={0}>
        {renderDashboardOverview()}
      </TabPanel>
      
      {/* Jobs management */}
      <TabPanel value={tabValue} index={1}>
        <JobManagement />
      </TabPanel>
      
      {/* Earnings tracker */}
      <TabPanel value={tabValue} index={2}>
        <EarningsTracker />
      </TabPanel>
      
      {/* Applications */}
      <TabPanel value={tabValue} index={3}>
        <JobApplication />
      </TabPanel>
      
      {/* Skills assessment */}
      <TabPanel value={tabValue} index={4}>
        <SkillsAssessment />
      </TabPanel>
      
      {/* Document verification */}
      <TabPanel value={tabValue} index={5}>
        <DocumentVerification />
      </TabPanel>
      
      {/* Availability calendar */}
      <TabPanel value={tabValue} index={6}>
        <AvailabilityCalendar />
      </TabPanel>
    </Container>
  );
};

export default WorkerDashboardPage; 