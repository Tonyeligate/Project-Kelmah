import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Snackbar, 
  Alert as MuiAlert, 
  Button, 
  Typography, 
  Box 
} from '@mui/material';

// Custom Alert component with forward ref for Snackbar
const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * Custom Toast notification component
 * Used for displaying notifications, errors, and other important messages
 */
const Toast = ({
  open,
  message,
  severity = 'info',
  duration = 5000,
  onClose,
  action = null,
  title = null,
  vertical = 'bottom',
  horizontal = 'center',
  fullWidth = false,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical, horizontal }}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        '& .MuiPaper-root': {
          width: fullWidth ? '100%' : 'auto',
          maxWidth: fullWidth ? '100%' : 600,
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: '100%',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        {title && (
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 0.5 
            }}
          >
            {title}
          </Typography>
        )}
        
        <Typography variant="body2">{message}</Typography>
        
        {action && (
          <Box 
            sx={{ 
              mt: 1, 
              display: 'flex', 
              justifyContent: 'flex-end',
              width: '100%'
            }}
          >
            {typeof action === 'function' ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={action}
              >
                DISMISS
              </Button>
            ) : action}
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};

Toast.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  action: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  title: PropTypes.string,
  vertical: PropTypes.oneOf(['top', 'bottom']),
  horizontal: PropTypes.oneOf(['left', 'center', 'right']),
  fullWidth: PropTypes.bool,
};

export default Toast; 