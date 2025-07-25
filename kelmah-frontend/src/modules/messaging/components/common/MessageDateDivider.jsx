import React from 'react';
import PropTypes from 'prop-types';
import { Divider, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * A component that displays a date divider between groups of messages
 */
const MessageDateDivider = ({ date }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        my: 2,
        px: 2,
      }}
    >
      <Divider sx={{ flexGrow: 1, mr: 2 }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(4px)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {date}
      </Typography>
      <Divider sx={{ flexGrow: 1, ml: 2 }} />
    </Box>
  );
};

MessageDateDivider.propTypes = {
  date: PropTypes.string.isRequired,
};

export default MessageDateDivider;
