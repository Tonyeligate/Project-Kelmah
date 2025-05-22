import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * A card component for displaying summary statistics in the worker dashboard
 */
const WorkerSummaryCard = ({ title, value, icon, color }) => {
  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: color ? `${color}20` : 'primary.light',
              color: color || 'primary.main',
              width: 56, 
              height: 56 
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

WorkerSummaryCard.propTypes = {
  /**
   * The title of the summary card
   */
  title: PropTypes.string.isRequired,
  /**
   * The main value to display
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /**
   * Icon component to display
   */
  icon: PropTypes.node,
  /**
   * Color for the icon background
   */
  color: PropTypes.string
};

export default WorkerSummaryCard; 