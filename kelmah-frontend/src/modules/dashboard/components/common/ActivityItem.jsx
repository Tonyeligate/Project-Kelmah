import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import {
  AssignmentInd as ApplicationIcon,
  Description as ContractIcon,
  Message as MessageIcon,
  EventBusy as JobExpiredIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';

const iconMap = {
  application: <ApplicationIcon />,
  contract: <ContractIcon />,
  message: <MessageIcon />,
  job_expired: <JobExpiredIcon />,
  payment: <PaymentIcon />,
  default: <NotificationIcon />,
};

const ActivityItem = ({ activity }) => {
  const { type, title, description, time } = activity;
  const icon = iconMap[type] || iconMap.default;

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        backgroundColor: 'background.paper'
      }}
    >
      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{icon}</Avatar>
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
        <Typography variant="caption" color="text.secondary">{time}</Typography>
      </Box>
    </Paper>
  );
};

ActivityItem.propTypes = {
  activity: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActivityItem; 