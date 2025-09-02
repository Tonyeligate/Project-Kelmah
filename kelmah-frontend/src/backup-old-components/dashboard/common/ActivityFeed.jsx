import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import DashboardCard from './DashboardCard';
import { Link as RouterLink } from 'react-router-dom';
import ActivityItem from './ActivityItem'; // Import the new component

/**
 * Activity feed component for displaying recent activities
 */
const ActivityFeed = ({ activities = [], maxItems = 5 }) => {
  return (
    <DashboardCard
      title={
        <span style={{ color: '#FFD700', fontWeight: 700 }}>
          Recent Activity
        </span>
      }
      action={
        <Button
          component={RouterLink}
          to="/notifications"
          size="small"
          color="primary"
          sx={{
            fontWeight: 700,
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          View All
        </Button>
      }
      sx={{
        height: '100%',
        background: 'rgba(35, 35, 35, 0.8)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              No recent activity
            </Typography>
          </Box>
        ) : (
          activities
            .slice(0, maxItems)
            .map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
        )}
      </Box>
    </DashboardCard>
  );
};

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      cta: PropTypes.shape({
        text: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired,
      }),
    }),
  ),
  maxItems: PropTypes.number,
};

export default ActivityFeed;
