import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Rating } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const ReviewRating = ({
  label,
  value,
  onChange,
  size = 'medium',
  readOnly = false,
  precision = 0.5,
  showValue = false
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <Typography 
          component="legend" 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Rating
          name={`rating-${label ? label.toLowerCase().replace(/\s+/g, '-') : 'value'}`}
          value={value || 0}
          onChange={onChange}
          readOnly={readOnly}
          precision={precision}
          size={size}
          emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize={size} />}
        />
        {showValue && (
          <Typography variant="body2" sx={{ ml: 1 }}>
            {value?.toFixed(1) || '0.0'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

ReviewRating.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  readOnly: PropTypes.bool,
  precision: PropTypes.number,
  showValue: PropTypes.bool
};

export default ReviewRating;
