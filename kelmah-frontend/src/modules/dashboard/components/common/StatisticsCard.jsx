import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, Typography, Tooltip, CardActionArea } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Card component for displaying statistics with colored accents and trend indicators
 */
const StatisticsCard = ({ title, value, color, icon, trend, trendLabel, linkTo }) => {
  const isTrendPositive = trend && trend.startsWith('+');
  
  const CardContent = (
    <Card
      sx={{
        p: 3,
        background: 'rgba(35, 35, 35, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderLeft: `4px solid ${color || '#FFD700'}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          background: 'rgba(35, 35, 35, 0.9)',
          borderColor: 'rgba(255, 215, 0, 0.5)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              mb: 1,
              color: '#fff',
              letterSpacing: 0.5
            }}
          >
            {value}
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'text.secondary',
              opacity: 0.9,
              fontWeight: 'bold'
            }}
          >
            {title}
          </Typography>
          
          {trend && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mt: 1,
                color: isTrendPositive ? '#4caf50' : '#f44336'
              }}
            >
              {isTrendPositive ? (
                <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              ) : (
                <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              )}
              <Tooltip title={trendLabel || ''}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {trend}
                </Typography>
              </Tooltip>
            </Box>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              color: color || '#FFD700',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `${color}15`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                background: `${color}25`,
              }
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Card>
  );

  if (linkTo) {
    return (
      <CardActionArea component={RouterLink} to={linkTo} sx={{ borderRadius: 2 }}>
        {CardContent}
      </CardActionArea>
    );
  }

  return CardContent;
};

StatisticsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  icon: PropTypes.node,
  trend: PropTypes.string,
  trendLabel: PropTypes.string,
  linkTo: PropTypes.string,
};

export default StatisticsCard; 