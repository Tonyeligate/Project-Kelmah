import React from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, Typography, Button, Card, CardContent, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardCard from '../common/DashboardCard';
import StatisticsCard from '../common/StatisticsCard';
import QuickActions from '../common/QuickActions';
import ActivityFeed from '../common/ActivityFeed';

/**
 * Hirer-specific dashboard displaying relevant information and actions
 */
const HirerDashboard = ({ user }) => {
  // Hirer dashboard statistics
  const statistics = [
    { title: 'Active Jobs', value: user.stats?.activeJobs || '0', color: '#4CAF50' },
    { title: 'Pending Applications', value: user.stats?.pendingApplications || '0', color: '#FF9800' },
    { title: 'Active Contracts', value: user.stats?.activeContracts || '0', color: '#2196F3' },
    { title: 'Total Spent', value: `$${user.stats?.totalSpent || '0'}`, color: '#9C27B0' },
  ];
  
  // Mock recent activities
  const recentActivities = user.recentActivity || [];
  
  // Quick action buttons
  const quickActions = [
    { 
      title: 'Post a Job', 
      description: 'Create a new job posting',
      icon: 'add_circle',
      path: '/jobs/post',
      color: '#4CAF50'
    },
    { 
      title: 'Manage Jobs', 
      description: 'View and manage your jobs',
      icon: 'work',
      path: '/hirer/jobs',
      color: '#2196F3' 
    },
    { 
      title: 'Review Applications', 
      description: 'Check applicants for your jobs',
      icon: 'assignment',
      path: '/hirer/applications',
      color: '#FF9800'
    },
    { 
      title: 'Manage Contracts', 
      description: 'View active contracts',
      icon: 'description',
      path: '/contracts',
      color: '#9C27B0'
    },
  ];
  
  // Mock active jobs
  const activeJobs = [
    {
      id: 1,
      title: 'Bathroom Renovation',
      location: 'Chicago, IL',
      applicants: 8,
      posted: '5 days ago',
      expires: 'in 25 days'
    },
    {
      id: 2,
      title: 'Electrical Installation',
      location: 'Seattle, WA',
      applicants: 12,
      posted: '3 days ago',
      expires: 'in 27 days'
    },
    {
      id: 3,
      title: 'Kitchen Remodeling',
      location: 'Austin, TX',
      applicants: 5,
      posted: '1 day ago',
      expires: 'in 29 days'
    }
  ];
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {statistics.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <StatisticsCard 
                  title={stat.title}
                  value={stat.value}
                  color={stat.color}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <QuickActions actions={quickActions} />
        </Grid>
        
        {/* Active Jobs */}
        <Grid item xs={12} md={8}>
          <DashboardCard
            title="Active Jobs"
            action={
              <Button 
                component={RouterLink} 
                to="/hirer/jobs" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            }
          >
            <Box sx={{ p: 1 }}>
              {/* If there are no active jobs */}
              {!activeJobs.length && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    You have no active job postings.
                  </Typography>
                  <Button 
                    component={RouterLink} 
                    to="/jobs/post"
                    variant="contained" 
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Post a Job
                  </Button>
                </Box>
              )}
              
              {/* List active jobs */}
              {activeJobs.length > 0 && (
                <Box>
                  {activeJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <Box sx={{ py: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {job.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {job.location} • {job.applicants} applicants
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                          Posted {job.posted} • Expires {job.expires}
                        </Typography>
                      </Box>
                      {index < activeJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Box>
          </DashboardCard>
        </Grid>
        
        {/* Recent Activity Feed */}
        <Grid item xs={12} md={4}>
          <ActivityFeed activities={recentActivities} />
        </Grid>
        
        {/* Talent Search */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(35, 35, 35, 0.8)',
            backdropFilter: 'blur(10px)',
            borderLeft: '4px solid #4CAF50',
            borderRadius: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Find Skilled Workers
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Search our database of verified professionals for your next project.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/find-talent" 
                variant="contained" 
                color="primary"
                sx={{ mt: 1 }}
              >
                Find Talent
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Complete Profile */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(35, 35, 35, 0.8)',
            backdropFilter: 'blur(10px)',
            borderLeft: '4px solid #2196F3',
            borderRadius: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Verify Your Business
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Complete business verification to attract more qualified workers and build trust.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/settings/verification" 
                variant="contained" 
                color="primary"
                sx={{ mt: 1 }}
              >
                Verify Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

HirerDashboard.propTypes = {
  user: PropTypes.object.isRequired,
};

export default HirerDashboard; 

