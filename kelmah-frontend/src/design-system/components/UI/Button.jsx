import React from 'react';
import { Button as MuiButton, IconButton as MuiIconButton, Fab as MuiFab } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { PRIMARY_COLORS, BRAND_GRADIENTS } from '../../foundations/colors';
import { SEMANTIC_SPACING, BORDER_RADIUS } from '../../foundations/spacing';
import { TYPOGRAPHY_SCALE, FONT_WEIGHTS } from '../../foundations/typography';

/**
 * Button Component - Enhanced button with consistent styling and animations
 * 
 * Features:
 * - Multiple variants (contained, outlined, text, gradient)
 * - Different sizes (xs, sm, md, lg, xl)
 * - Loading states
 * - Icon support
 * - Smooth animations
 * - Accessibility features
 */

const MotionButton = motion(MuiButton);

const StyledButton = styled(MotionButton, {
  shouldForwardProp: (prop) => !['gradient', 'loading'].includes(prop),
})(({ theme, variant, size, gradient, loading }) => ({
  borderRadius: BORDER_RADIUS.lg,
  textTransform: 'none',
  fontWeight: FONT_WEIGHTS.semibold,
  position: 'relative',
  overflow: 'hidden',
  minHeight: size === 'xs' ? '32px' : size === 'sm' ? '36px' : size === 'lg' ? '52px' : size === 'xl' ? '60px' : '44px',
  
  // Gradient variant
  ...(variant === 'contained' && gradient && {
    background: theme.palette.mode === 'dark' ? BRAND_GRADIENTS.gold : BRAND_GRADIENTS.black,
    backgroundSize: '200% 200%',
    animation: 'gradientShift 3s ease infinite',
    
    '&:hover': {
      backgroundPosition: 'right center',
    },
  }),
  
  // Loading state
  ...(loading && {
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      opacity: 0,
    },
  }),
  
  // Pulse effect on click
  '&:active': {
    transform: 'scale(0.98)',
  },
  
  // Ripple effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.6s, height 0.6s',
  },
  
  '&:active::before': {
    width: '300px',
    height: '300px',
  },
  
  // Accessibility improvements
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  
  // Disabled state
  '&.Mui-disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
}));

const LoadingSpinner = styled('div')(({ theme, size }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: size === 'xs' ? '14px' : size === 'sm' ? '16px' : size === 'lg' ? '22px' : size === 'xl' ? '26px' : '18px',
  height: size === 'xs' ? '14px' : size === 'sm' ? '16px' : size === 'lg' ? '22px' : size === 'xl' ? '26px' : '18px',
  border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
  borderTop: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  
  '@keyframes spin': {
    '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
    '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
  },
}));

// Animation variants
const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

const Button = ({
  children,
  variant = 'contained',
  size = 'md',
  color = 'primary',
  loading = false,
  disabled = false,
  gradient = false,
  startIcon,
  endIcon,
  fullWidth = false,
  onClick,
  href,
  ...props
}) => {
  const handleClick = (e) => {
    if (loading || disabled) return;
    onClick?.(e);
  };

  const buttonProps = {
    variant: gradient ? 'contained' : variant,
    size,
    color,
    disabled: disabled || loading,
    startIcon: loading ? null : startIcon,
    endIcon: loading ? null : endIcon,
    fullWidth,
    onClick: handleClick,
    gradient,
    loading,
    variants: buttonVariants,
    initial: 'initial',
    whileHover: disabled || loading ? undefined : 'hover',
    whileTap: disabled || loading ? undefined : 'tap',
    ...props,
  };

  const buttonContent = (
    <>
      {children}
      {loading && <LoadingSpinner size={size} />}
    </>
  );

  if (href) {
    return (
      <StyledButton
        component="a"
        href={href}
        {...buttonProps}
      >
        {buttonContent}
      </StyledButton>
    );
  }

  return (
    <StyledButton {...buttonProps}>
      {buttonContent}
    </StyledButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  gradient: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  href: PropTypes.string,
};

// Specialized button variants
export const PrimaryButton = (props) => (
  <Button variant="contained" gradient {...props} />
);

export const SecondaryButton = (props) => (
  <Button variant="outlined" {...props} />
);

export const TextButton = (props) => (
  <Button variant="text" {...props} />
);

export const IconButton = ({ 
  children, 
  size = 'md', 
  color = 'primary',
  loading = false,
  disabled = false,
  ...props 
}) => {
  const iconSizes = {
    xs: 'small',
    sm: 'small',
    md: 'medium',
    lg: 'large',
    xl: 'large',
  };

  return (
    <MuiIconButton
      size={iconSizes[size]}
      color={color}
      disabled={disabled || loading}
      sx={{
        borderRadius: BORDER_RADIUS.md,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.1)',
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
      {...props}
    >
      {loading ? <LoadingSpinner size={size} /> : children}
    </MuiIconButton>
  );
};

IconButton.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export const FloatingActionButton = ({ 
  children, 
  size = 'large',
  color = 'primary',
  ...props 
}) => (
  <MuiFab
    size={size}
    color={color}
    sx={{
      background: BRAND_GRADIENTS.gold,
      '&:hover': {
        background: BRAND_GRADIENTS.goldLight,
        transform: 'scale(1.1)',
      },
      transition: 'all 0.3s ease-in-out',
    }}
    {...props}
  >
    {children}
  </MuiFab>
);

FloatingActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
};

// Button group component
export const ButtonGroup = ({ children, gap = 'sm', direction = 'row', ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: direction,
      gap: SEMANTIC_SPACING.component[gap],
      alignItems: 'center',
    }}
    {...props}
  >
    {children}
  </div>
);

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  direction: PropTypes.oneOf(['row', 'column']),
};

export default Button; 