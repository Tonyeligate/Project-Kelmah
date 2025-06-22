import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent, Divider } from '@mui/material';

/**
 * Reusable card component for dashboard sections with consistent styling
 */
const DashboardCard = ({ 
  title, 
  subheader, 
  action, 
  children, 
  elevation = 1,
  sx = {}
}) => {
  return (
    <Card 
      elevation={elevation} 
      sx={{ 
        height: '100%',
        background: 'rgba(35, 35, 35, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          borderColor: 'rgba(255, 215, 0, 0.5)',
        },
        ...sx
      }}
    >
      <CardHeader 
        title={title}
        subheader={subheader}
        action={action}
        titleTypographyProps={{ 
          variant: 'h6', 
          fontWeight: 700,
          color: '#fff',
          letterSpacing: 0.5
        }}
        subheaderTypographyProps={{ 
          variant: 'body2', 
          color: 'textSecondary',
          opacity: 0.8
        }}
        sx={{ 
          pb: 1,
          px: 3,
          pt: 2
        }}
      />
      <Divider sx={{ opacity: 0.1 }} />
      <CardContent sx={{ p: 3 }}>
        {children}
      </CardContent>
    </Card>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.node.isRequired,
  subheader: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  elevation: PropTypes.number,
  sx: PropTypes.object,
};

export default DashboardCard; 