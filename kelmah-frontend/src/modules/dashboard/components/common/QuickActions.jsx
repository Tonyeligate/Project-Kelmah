import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  Box,
  Badge,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardCard from './DashboardCard';

/**
 * QuickActions component to display action buttons in the dashboard
 */
const QuickActions = ({ actions = [] }) => {
  const [actionStates, setActionStates] = useState(
    actions.map(() => ({ loading: false })),
  );
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleActionClick = (index, event) => {
    // Prevent default navigation for RouterLink
    event.preventDefault();

    // Set loading state
    const newActionStates = [...actionStates];
    newActionStates[index] = { loading: true };
    setActionStates(newActionStates);

    // Simulate loading/processing with 500-800ms delay
    setTimeout(
      () => {
        // Reset loading state
        newActionStates[index] = { loading: false };
        setActionStates(newActionStates);

        // Show feedback (simulating successful navigation)
        setFeedback({
          open: true,
          message: `Navigating to ${actions[index].title}...`,
          severity: 'info',
        });

        // Actually navigate after feedback is shown
        setTimeout(() => {
          window.location.href = actions[index].path;
        }, 1000);
      },
      500 + Math.random() * 300,
    );
  };

  const handleCloseFeedback = () => {
    setFeedback({ ...feedback, open: false });
  };

  return (
    <DashboardCard title="Quick Actions">
      <Grid container spacing={2} sx={{ p: 2, textAlign: 'center' }}>
        {actions.map((action, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Tooltip title={action.description || action.title} arrow>
              <Box
                component={RouterLink}
                to={action.path}
                onClick={(e) => handleActionClick(index, e)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: 'text.primary',
                  p: 2,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: 'none',
                  },
                  opacity: actionStates[index].loading ? 0.7 : 1,
                }}
              >
                <Badge badgeContent={action.badgeContent} color="error">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      mb: 1,
                      backgroundColor: `${action.color}30`, // Faded background from theme
                      color: action.color,
                      position: 'relative',
                    }}
                  >
                    {actionStates[index].loading ? (
                      <CircularProgress
                        size={30}
                        sx={{
                          position: 'absolute',
                          color: action.color,
                        }}
                      />
                    ) : (
                      action.icon
                    )}
                  </Box>
                </Badge>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    opacity: actionStates[index].loading ? 0.7 : 1,
                  }}
                >
                  {action.title}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={feedback.open}
        autoHideDuration={2000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </DashboardCard>
  );
};

QuickActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.element.isRequired,
      path: PropTypes.string.isRequired,
      color: PropTypes.string,
      badgeContent: PropTypes.number,
    }),
  ).isRequired,
};

export default QuickActions;
