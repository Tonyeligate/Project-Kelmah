import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tabs, Tab, Badge } from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import ActivityFeed from '../common/ActivityFeed';
import { styled } from '@mui/material/styles';

const StyledTabs = styled(Tabs)({
  borderBottom: '1px solid #333',
  '& .MuiTabs-indicator': {
    backgroundColor: '#FFD700', // Gold color for the indicator
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  [theme.breakpoints.up('sm')]: {
    minWidth: 0,
  },
  fontWeight: theme.typography.fontWeightRegular,
  marginRight: theme.spacing(1),
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '1rem', // Increased font size
  padding: '12px 16px', // Increased padding
  '&:hover': {
    color: '#FFD700',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: '#FFD700',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-hub-tabpanel-${index}`}
      aria-labelledby={`activity-hub-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const ActivityHub = ({ activities, applications, messages }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <DashboardCard title="Activity Hub" sx={{ p: 0 }}>
      <Box sx={{ width: '100%' }}>
        <StyledTabs value={value} onChange={handleChange} aria-label="Activity Hub Tabs">
          <StyledTab label="Recent Activity" />
          <StyledTab 
            label={
              <Badge badgeContent={applications?.length || 0} color="error">
                Applications
              </Badge>
            } 
          />
          <StyledTab 
            label={
              <Badge badgeContent={messages?.length || 0} color="error">
                Messages
              </Badge>
            } 
          />
        </StyledTabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ActivityFeed activities={activities} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        {/* Placeholder for Applications List */}
        <Typography>You have {applications?.length || 0} application updates.</Typography>
      </TabPanel>
      <TabPanel value={value} index={2}>
        {/* Placeholder for Messages List */}
        <Typography>You have {messages?.length || 0} new messages.</Typography>
      </TabPanel>
    </DashboardCard>
  );
};

ActivityHub.propTypes = {
    activities: PropTypes.array,
    applications: PropTypes.array,
    messages: PropTypes.array,
};

export default ActivityHub; 