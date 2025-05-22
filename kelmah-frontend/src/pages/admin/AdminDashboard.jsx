import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Stars as StarsIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Report as ReportIcon,
  Flag as FlagIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

import UserManagement from '../../components/admin/UserManagement';
import SystemSettings from '../../components/admin/SystemSettings';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import ReviewModeration from '../../components/admin/ReviewModeration';
import PaymentOverview from '../../components/admin/PaymentOverview';
import ReportManagement from '../../components/admin/ReportManagement';
import NotificationCenter from '../../components/admin/NotificationCenter';
import DisputeManagement from '../../components/admin/DisputeManagement';
import FraudDetection from '../../components/admin/FraudDetection';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 72,
  textAlign: 'left',
  alignItems: 'flex-start',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  '&.Mui-selected': {
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  }
}));

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={2.5}>
        <Paper sx={{ 
          height: '100%', 
          backgroundColor: '#1a1a1a',
          color: '#fff',
          borderRadius: 2
        }}>
          <Box sx={{ p: 2, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" sx={{ color: '#FFD700' }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Platform Management
            </Typography>
          </Box>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                left: 0,
                right: 'auto',
                width: 3,
                backgroundColor: '#FFD700',
              },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'none',
              }
            }}
          >
            <StyledTab icon={<DashboardIcon sx={{ mr: 1 }} />} iconPosition="start" label="Overview" />
            <StyledTab icon={<PeopleIcon sx={{ mr: 1 }} />} iconPosition="start" label="User Management" />
            <StyledTab icon={<StarsIcon sx={{ mr: 1 }} />} iconPosition="start" label="Review Moderation" />
            <StyledTab icon={<PaymentIcon sx={{ mr: 1 }} />} iconPosition="start" label="Payments" />
            <StyledTab icon={<FlagIcon sx={{ mr: 1 }} />} iconPosition="start" label="Disputes" />
            <StyledTab icon={<SecurityIcon sx={{ mr: 1 }} />} iconPosition="start" label="Fraud Detection" />
            <StyledTab icon={<ReportIcon sx={{ mr: 1 }} />} iconPosition="start" label="Reports" />
            <StyledTab icon={<NotificationsIcon sx={{ mr: 1 }} />} iconPosition="start" label="Notifications" />
            <StyledTab icon={<AssessmentIcon sx={{ mr: 1 }} />} iconPosition="start" label="Analytics" />
            <StyledTab icon={<SettingsIcon sx={{ mr: 1 }} />} iconPosition="start" label="System Settings" />
          </Tabs>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={9.5}>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" sx={{ mb: 3, color: '#FFD700' }}>
            Admin Dashboard Overview
          </Typography>
          {/* Dashboard overview content */}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ReviewModeration />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <PaymentOverview />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <DisputeManagement />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <FraudDetection />
        </TabPanel>
        
        <TabPanel value={tabValue} index={6}>
          <ReportManagement />
        </TabPanel>
        
        <TabPanel value={tabValue} index={7}>
          <NotificationCenter />
        </TabPanel>
        
        <TabPanel value={tabValue} index={8}>
          <AnalyticsDashboard />
        </TabPanel>
        
        <TabPanel value={tabValue} index={9}>
          <SystemSettings />
        </TabPanel>
      </Grid>
    </Grid>
  );
};

export default AdminDashboard; 