import React from 'react';
import { Box } from '@mui/material';
import { tokens, themeUtils } from '../theme';

/**
 * Layout Components using design system tokens
 * Provides consistent spacing and layout patterns
 */

/**
 * Stack component for vertical layouts
 */
export const VStack = ({ 
  spacing = 4, 
  align = 'stretch', 
  children, 
  ...props 
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems={align}
    gap={themeUtils.spacing(spacing)}
    {...props}
  >
    {children}
  </Box>
);

/**
 * Stack component for horizontal layouts
 */
export const HStack = ({ 
  spacing = 4, 
  align = 'center', 
  justify = 'flex-start',
  wrap = false,
  children, 
  ...props 
}) => (
  <Box
    display="flex"
    flexDirection="row"
    alignItems={align}
    justifyContent={justify}
    gap={themeUtils.spacing(spacing)}
    flexWrap={wrap ? 'wrap' : 'nowrap'}
    {...props}
  >
    {children}
  </Box>
);

/**
 * Container component with consistent max-width and padding
 */
export const Container = ({ 
  size = 'lg',
  padding = 4,
  centered = true,
  children,
  ...props
}) => {
  const maxWidths = {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  return (
    <Box
      maxWidth={maxWidths[size]}
      width="100%"
      mx={centered ? 'auto' : 0}
      px={themeUtils.spacing(padding)}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * Card wrapper with consistent styling
 */
export const Card = ({ 
  variant = 'default',
  interactive = false,
  padding = 4,
  children,
  ...props
}) => (
  <Box
    sx={{
      ...themeUtils.cardStyles({ variant, interactive, padding }),
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Box>
);

/**
 * Divider with consistent styling
 */
export const Divider = ({ 
  orientation = 'horizontal',
  spacing = 4,
  ...props
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <Box
      sx={{
        backgroundColor: tokens.semantic.border.default,
        ...(isVertical 
          ? {
              width: '1px',
              mx: themeUtils.spacing(spacing),
            }
          : {
              height: '1px',
              my: themeUtils.spacing(spacing),
            }
        ),
      }}
      {...props}
    />
  );
};

/**
 * Responsive grid component
 */
export const Grid = ({
  columns = { xs: 1, sm: 2, md: 3 },
  gap = 4,
  children,
  ...props
}) => (
  <Box
    sx={{
      display: 'grid',
      gap: themeUtils.spacing(gap),
      gridTemplateColumns: {
        xs: `repeat(${columns.xs || 1}, 1fr)`,
        sm: `repeat(${columns.sm || columns.xs || 1}, 1fr)`,
        md: `repeat(${columns.md || columns.sm || columns.xs || 1}, 1fr)`,
        lg: `repeat(${columns.lg || columns.md || columns.sm || columns.xs || 1}, 1fr)`,
        xl: `repeat(${columns.xl || columns.lg || columns.md || columns.sm || columns.xs || 1}, 1fr)`,
      },
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Box>
);

/**
 * Text component with design system typography
 */
export const Text = ({
  variant = 'body1',
  color = 'text.primary',
  children,
  ...props
}) => {
  const variantStyles = {
    h1: { fontSize: tokens.typography.fontSize['4xl'], fontWeight: tokens.typography.fontWeight.bold },
    h2: { fontSize: tokens.typography.fontSize['3xl'], fontWeight: tokens.typography.fontWeight.bold },
    h3: { fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.semiBold },
    h4: { fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.semiBold },
    h5: { fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.medium },
    h6: { fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.medium },
    body1: { fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.regular },
    body2: { fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.regular },
    caption: { fontSize: tokens.typography.fontSize.xs, fontWeight: tokens.typography.fontWeight.regular },
  };

  return (
    <Box
      component="span"
      sx={{
        ...variantStyles[variant],
        color: color.startsWith('text.') ? tokens.semantic[color] : themeUtils.getColor(color),
        fontFamily: tokens.typography.fontFamily.primary,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default {
  VStack,
  HStack,
  Container,
  Card,
  Divider,
  Grid,
  Text,
};