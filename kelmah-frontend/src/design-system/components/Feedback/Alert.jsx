import React, { useState, useEffect } from 'react';
import {
  Alert as MuiAlert,
  AlertTitle,
  Snackbar,
  IconButton,
  Box,
  Collapse,
  Fade,
  Slide,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { BORDER_RADIUS, SEMANTIC_SPACING } from '../../foundations/spacing';
import { PRIMARY_COLORS, SEMANTIC_COLORS } from '../../foundations/colors';
import { FONT_WEIGHTS } from '../../foundations/typography';

/**
 * Alert Component - Enhanced alert system with animations and variants
 * 
 * Features:
 * - Multiple severity levels (success, error, warning, info)
 * - Custom icons and actions
 * - Auto-dismiss functionality
 * - Toast notifications
 * - Smooth animations
 * - Customizable positioning
 */

const StyledAlert = styled(motion.div)(({ theme, severity, variant = 'filled' }) => {
  const severityColors = {
    success: SEMANTIC_COLORS.success,
    error: SEMANTIC_COLORS.error,
    warning: SEMANTIC_COLORS.warning,
    info: SEMANTIC_COLORS.info,
  };

  const colors = severityColors[severity] || severityColors.info;

  return {
    borderRadius: BORDER_RADIUS.lg,
    padding: SEMANTIC_SPACING.card.padding.md,
    marginBottom: SEMANTIC_SPACING.component.md,
    position: 'relative',
    overflow: 'hidden',
    
    ...(variant === 'filled' && {
      backgroundColor: colors[500],
      color: '#FFFFFF',
      boxShadow: `0 4px 20px ${colors[500]}30`,
    }),
    
    ...(variant === 'outlined' && {
      backgroundColor: theme.palette.background.paper,
      color: colors[theme.palette.mode === 'dark' ? 400 : 700],
      border: `2px solid ${colors[500]}`,
    }),
    
    ...(variant === 'soft' && {
      backgroundColor: `${colors[500]}15`,
      color: colors[theme.palette.mode === 'dark' ? 400 : 700],
      border: `1px solid ${colors[500]}30`,
    }),
    
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
      backgroundColor: colors[500],
      borderRadius: '2px 0 0 2px',
    },
  };
});

const AlertIcon = styled(Box)(({ theme, severity }) => ({
  marginRight: SEMANTIC_SPACING.component.sm,
  display: 'flex',
  alignItems: 'flex-start',
  paddingTop: '2px',
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

const AlertContent = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const AlertActions = styled(Box)(({ theme }) => ({
  marginLeft: SEMANTIC_SPACING.component.sm,
  display: 'flex',
  alignItems: 'flex-start',
  gap: SEMANTIC_SPACING.component.xs,
}));

const Alert = ({
  severity = 'info',
  variant = 'filled',
  title,
  children,
  icon,
  action,
  onClose,
  closable = true,
  autoHideDuration,
  sx,
  ...props
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (autoHideDuration && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    if (icon) return icon;
    
    const iconMap = {
      success: <SuccessIcon />,
      error: <ErrorIcon />,
      warning: <WarningIcon />,
      info: <InfoIcon />,
    };
    
    return iconMap[severity];
  };

  const alertVariants = {
    initial: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <StyledAlert
          severity={severity}
          variant={variant}
          variants={alertVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            ...sx,
          }}
          {...props}
        >
          <AlertIcon severity={severity}>
            {getIcon()}
          </AlertIcon>
          
          <AlertContent>
            {title && (
              <Box
                sx={{
                  fontWeight: FONT_WEIGHTS.semibold,
                  marginBottom: children ? SEMANTIC_SPACING.component.xs : 0,
                  fontSize: '0.875rem',
                }}
              >
                {title}
              </Box>
            )}
            {children && (
              <Box sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                {children}
              </Box>
            )}
          </AlertContent>
          
          <AlertActions>
            {action}
            {closable && (
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{
                  color: 'inherit',
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </AlertActions>
        </StyledAlert>
      )}
    </AnimatePresence>
  );
};

Alert.propTypes = {
  severity: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  variant: PropTypes.oneOf(['filled', 'outlined', 'soft']),
  title: PropTypes.string,
  children: PropTypes.node,
  icon: PropTypes.node,
  action: PropTypes.node,
  onClose: PropTypes.func,
  closable: PropTypes.bool,
  autoHideDuration: PropTypes.number,
  sx: PropTypes.object,
};

// Toast Component for notifications
export const Toast = ({
  open,
  onClose,
  message,
  severity = 'info',
  autoHideDuration = 6000,
  position = { vertical: 'top', horizontal: 'right' },
  transition = 'slide',
  ...props
}) => {
  const TransitionComponent = transition === 'slide' ? Slide : Fade;
  
  const transitionProps = transition === 'slide' 
    ? { direction: position.horizontal === 'right' ? 'left' : 'right' }
    : {};

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={TransitionComponent}
      TransitionProps={transitionProps}
      sx={{
        '& .MuiSnackbarContent-root': {
          padding: 0,
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        variant="filled"
        sx={{
          minWidth: '300px',
          margin: 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        {...props}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

Toast.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  autoHideDuration: PropTypes.number,
  position: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'center', 'right']),
  }),
  transition: PropTypes.oneOf(['slide', 'fade']),
};

// Alert variants for common use cases
export const SuccessAlert = (props) => (
  <Alert severity="success" {...props} />
);

export const ErrorAlert = (props) => (
  <Alert severity="error" {...props} />
);

export const WarningAlert = (props) => (
  <Alert severity="warning" {...props} />
);

export const InfoAlert = (props) => (
  <Alert severity="info" {...props} />
);

// Inline alert for forms
export const InlineAlert = ({ 
  severity = 'error', 
  children, 
  show = true,
  ...props 
}) => (
  <Collapse in={show}>
    <Alert
      severity={severity}
      variant="soft"
      closable={false}
      sx={{
        marginTop: SEMANTIC_SPACING.component.xs,
        marginBottom: 0,
        fontSize: '0.75rem',
        padding: SEMANTIC_SPACING.component.sm,
      }}
      {...props}
    >
      {children}
    </Alert>
  </Collapse>
);

InlineAlert.propTypes = {
  severity: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  children: PropTypes.node.isRequired,
  show: PropTypes.bool,
};

// Banner alert for important notifications
export const BannerAlert = ({ 
  severity = 'info', 
  children, 
  persistent = false,
  ...props 
}) => (
  <Alert
    severity={severity}
    variant="filled"
    closable={!persistent}
    sx={{
      borderRadius: 0,
      margin: 0,
      marginBottom: SEMANTIC_SPACING.layout.sm,
      '&::before': { display: 'none' },
    }}
    {...props}
  >
    {children}
  </Alert>
);

BannerAlert.propTypes = {
  severity: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  children: PropTypes.node.isRequired,
  persistent: PropTypes.bool,
};

// Toast notification hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, severity = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity,
      ...options,
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, options.autoHideDuration || 6000);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, options) => showToast(message, 'success', options);
  const showError = (message, options) => showToast(message, 'error', options);
  const showWarning = (message, options) => showToast(message, 'warning', options);
  const showInfo = (message, options) => showToast(message, 'info', options);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Toast container component
export const ToastContainer = ({ toasts = [], onRemove, position = { vertical: 'top', horizontal: 'right' } }) => (
  <Box
    sx={{
      position: 'fixed',
      zIndex: 9999,
      ...(position.vertical === 'top' ? { top: 24 } : { bottom: 24 }),
      ...(position.horizontal === 'right' ? { right: 24 } : 
          position.horizontal === 'left' ? { left: 24 } : 
          { left: '50%', transform: 'translateX(-50%)' }),
      display: 'flex',
      flexDirection: 'column',
      gap: SEMANTIC_SPACING.component.sm,
      maxWidth: '400px',
      width: '100%',
    }}
  >
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: position.horizontal === 'right' ? 300 : -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: position.horizontal === 'right' ? 300 : -300 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => onRemove(toast.id)}
            variant="filled"
            sx={{
              margin: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            {toast.message}
          </Alert>
        </motion.div>
      ))}
    </AnimatePresence>
  </Box>
);

ToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  position: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'center', 'right']),
  }),
};

export default Alert; 