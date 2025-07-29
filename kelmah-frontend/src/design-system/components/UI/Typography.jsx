import React from 'react';
import { Typography as MuiTypography } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { TYPOGRAPHY_SCALE, FONT_WEIGHTS, RESPONSIVE_TYPOGRAPHY } from '../../foundations/typography';
import { PRIMARY_COLORS, BRAND_GRADIENTS } from '../../foundations/colors';

/**
 * Typography Component - Enhanced typography with design system integration
 * 
 * Features:
 * - All typography variants from design system
 * - Gradient text support
 * - Responsive typography
 * - Animation support
 * - Accessibility features
 */

const MotionTypography = motion(MuiTypography);

const StyledTypography = styled(MotionTypography, {
  shouldForwardProp: (prop) => !['gradient', 'responsive', 'truncate'].includes(prop),
})(({ theme, gradient, responsive, truncate, color }) => ({
  // Gradient text
  ...(gradient && {
    background: theme.palette.mode === 'dark' ? BRAND_GRADIENTS.gold : BRAND_GRADIENTS.black,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: FONT_WEIGHTS.bold,
  }),
  
  // Custom color support
  ...(color && {
    color: PRIMARY_COLORS[color]?.[500] || theme.palette[color]?.main || color,
  }),
  
  // Responsive behavior
  ...(responsive && RESPONSIVE_TYPOGRAPHY[responsive]),
  
  // Text truncation
  ...(truncate && {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: truncate === 'single' ? 'nowrap' : 'initial',
    ...(truncate === 'multi' && {
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      whiteSpace: 'normal',
    }),
  }),
  
  // Enhanced text rendering
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textRendering: 'optimizeLegibility',
}));

const Typography = ({
  children,
  variant = 'body1',
  component,
  gradient = false,
  responsive,
  truncate,
  color,
  align = 'inherit',
  gutterBottom = false,
  noWrap = false,
  animated = false,
  animationDelay = 0,
  ...props
}) => {
  // Animation variants
  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: animationDelay,
      },
    },
  };

  const typographyProps = {
    variant,
    component: component || getComponentFromVariant(variant),
    gradient,
    responsive,
    truncate,
    color,
    align,
    gutterBottom,
    noWrap: noWrap || truncate === 'single',
    ...(animated && {
      variants: textVariants,
      initial: 'hidden',
      whileInView: 'visible',
      viewport: { once: true },
    }),
    ...props,
  };

  return (
    <StyledTypography {...typographyProps}>
      {children}
    </StyledTypography>
  );
};

// Helper function to determine component based on variant
const getComponentFromVariant = (variant) => {
  const componentMap = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'h6',
    subtitle2: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span',
    button: 'span',
  };
  
  return componentMap[variant] || 'p';
};

Typography.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'subtitle1', 'subtitle2',
    'body1', 'body2',
    'caption', 'overline', 'button'
  ]),
  component: PropTypes.elementType,
  gradient: PropTypes.bool,
  responsive: PropTypes.oneOf(['responsive-display', 'responsive-heading', 'responsive-body']),
  truncate: PropTypes.oneOf(['single', 'multi']),
  color: PropTypes.string,
  align: PropTypes.oneOf(['inherit', 'left', 'center', 'right', 'justify']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
};

// Specialized typography components
export const DisplayText = ({ children, size = 'lg', ...props }) => (
  <Typography
    variant={size === 'xl' ? 'h1' : size === 'lg' ? 'h2' : 'h3'}
    gradient
    responsive="responsive-display"
    animated
    {...props}
  >
    {children}
  </Typography>
);

DisplayText.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

export const HeadingText = ({ children, level = 3, ...props }) => (
  <Typography
    variant={`h${level}`}
    responsive="responsive-heading"
    animated
    {...props}
  >
    {children}
  </Typography>
);

HeadingText.propTypes = {
  children: PropTypes.node.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
};

export const BodyText = ({ children, size = 'md', ...props }) => (
  <Typography
    variant={size === 'lg' ? 'body1' : 'body2'}
    responsive="responsive-body"
    {...props}
  >
    {children}
  </Typography>
);

BodyText.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export const Label = ({ children, size = 'md', weight = 'medium', ...props }) => (
  <Typography
    variant="button"
    sx={{ 
      fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
      fontWeight: FONT_WEIGHTS[weight] || FONT_WEIGHTS.medium,
      textTransform: 'none',
    }}
    {...props}
  >
    {children}
  </Typography>
);

Label.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  weight: PropTypes.oneOf(['light', 'regular', 'medium', 'semibold', 'bold']),
};

export const Caption = ({ children, ...props }) => (
  <Typography
    variant="caption"
    sx={{ opacity: 0.7 }}
    {...props}
  >
    {children}
  </Typography>
);

Caption.propTypes = {
  children: PropTypes.node.isRequired,
};

export const Overline = ({ children, ...props }) => (
  <Typography
    variant="overline"
    sx={{ 
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontWeight: FONT_WEIGHTS.semibold,
    }}
    {...props}
  >
    {children}
  </Typography>
);

Overline.propTypes = {
  children: PropTypes.node.isRequired,
};

export const GradientText = ({ children, ...props }) => (
  <Typography
    gradient
    animated
    {...props}
  >
    {children}
  </Typography>
);

GradientText.propTypes = {
  children: PropTypes.node.isRequired,
};

export const AnimatedText = ({ 
  children, 
  variant = 'body1',
  stagger = false,
  ...props 
}) => {
  if (stagger && typeof children === 'string') {
    const words = children.split(' ');
    return (
      <Typography variant={variant} component="div" {...props}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
          >
            {word}
          </motion.span>
        ))}
      </Typography>
    );
  }

  return (
    <Typography
      variant={variant}
      animated
      {...props}
    >
      {children}
    </Typography>
  );
};

AnimatedText.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  stagger: PropTypes.bool,
};

export default Typography; 