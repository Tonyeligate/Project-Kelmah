/**
 * Theme Utilities
 * Helper functions and utilities for working with the Kelmah design system
 */

import { tokens } from './tokens';

/**
 * Get responsive value based on breakpoints
 * @param {Object} values - Object with breakpoint keys and values
 * @param {string} breakpoint - Current breakpoint
 * @returns {any} Value for the breakpoint
 */
export const getResponsiveValue = (values, breakpoint = 'md') => {
  if (typeof values !== 'object') return values;

  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Find the appropriate value by going down the breakpoint order
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  // Fallback to the first available value
  return Object.values(values)[0];
};

/**
 * Create media query strings
 * @param {string} breakpoint - Breakpoint key
 * @returns {string} Media query string
 */
export const mediaQuery = {
  up: (breakpoint) => `@media (min-width: ${tokens.breakpoints[breakpoint]}px)`,
  down: (breakpoint) =>
    `@media (max-width: ${tokens.breakpoints[breakpoint] - 1}px)`,
  between: (start, end) =>
    `@media (min-width: ${tokens.breakpoints[start]}px) and (max-width: ${tokens.breakpoints[end] - 1}px)`,
};

/**
 * Generate spacing values
 * @param {number|string|Array} value - Spacing value(s)
 * @returns {string} CSS spacing value
 */
export const spacing = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => tokens.spacing[v] || v).join(' ');
  }
  return tokens.spacing[value] || value;
};

/**
 * Get color with optional opacity
 * @param {string} color - Color path (e.g., 'primary.500')
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} CSS color value
 */
export const getColor = (color, opacity = 1) => {
  const colorPath = color.split('.');
  let colorValue = tokens.colors;

  for (const segment of colorPath) {
    colorValue = colorValue[segment];
    if (!colorValue) break;
  }

  if (!colorValue) return color; // Return original if not found

  if (opacity < 1) {
    // Convert hex to rgba if opacity is specified
    const hex = colorValue.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return colorValue;
};

/**
 * Create consistent focus styles
 * @param {string} color - Focus color
 * @returns {Object} Focus style object
 */
export const focusStyles = (color = 'primary.500') => ({
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${getColor(color, 0.2)}`,
  },
  '&:focus-visible': {
    outline: `2px solid ${getColor(color)}`,
    outlineOffset: '2px',
  },
});

/**
 * Create hover elevation effect
 * @param {string} from - Initial shadow level
 * @param {string} to - Hover shadow level
 * @returns {Object} Hover style object
 */
export const hoverElevation = (from = 'base', to = 'md') => ({
  boxShadow: tokens.shadows[from],
  transition: `box-shadow ${tokens.animation.duration.normal} ${tokens.animation.easing.easeInOut}`,
  '&:hover': {
    boxShadow: tokens.shadows[to],
    transform: 'translateY(-1px)',
  },
});

/**
 * Create responsive font sizes
 * @param {Object} sizes - Font size object with breakpoint keys
 * @returns {Object} Responsive font size styles
 */
export const responsiveFont = (sizes) => {
  const styles = {};
  Object.entries(sizes).forEach(([breakpoint, size]) => {
    if (breakpoint === 'base') {
      styles.fontSize = tokens.typography.fontSize[size] || size;
    } else {
      styles[mediaQuery.up(breakpoint)] = {
        fontSize: tokens.typography.fontSize[size] || size,
      };
    }
  });
  return styles;
};

/**
 * Create consistent card styles
 * @param {Object} options - Card style options
 * @returns {Object} Card style object
 */
export const cardStyles = ({
  variant = 'default',
  interactive = false,
  padding = 4,
} = {}) => {
  const base = {
    borderRadius: tokens.components.card.borderRadius,
    padding: spacing(padding),
    backgroundColor: tokens.semantic.background.paper,
  };

  if (variant === 'elevated') {
    base.boxShadow = tokens.shadows.md;
  } else {
    base.boxShadow = tokens.shadows.base;
  }

  if (interactive) {
    return {
      ...base,
      ...hoverElevation('base', 'md'),
      cursor: 'pointer',
      '&:active': {
        transform: 'translateY(0)',
      },
    };
  }

  return base;
};

/**
 * Create consistent button styles
 * @param {Object} options - Button style options
 * @returns {Object} Button style object
 */
export const buttonStyles = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
} = {}) => {
  const base = {
    borderRadius: tokens.components.button.borderRadius,
    fontWeight: tokens.components.button.fontWeight,
    textTransform: 'none',
    transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.easeInOut}`,
    ...focusStyles(`${color}.500`),
  };

  const sizeStyles = {
    small: {
      padding: spacing([1, 3]),
      fontSize: tokens.typography.fontSize.sm,
    },
    medium: {
      padding: spacing([2, 4]),
      fontSize: tokens.typography.fontSize.base,
    },
    large: {
      padding: spacing([3, 6]),
      fontSize: tokens.typography.fontSize.lg,
    },
  };

  const variantStyles = {
    contained: {
      backgroundColor: getColor(`${color}.500`),
      color: tokens.semantic.text.inverse,
      '&:hover': {
        backgroundColor: getColor(`${color}.600`),
      },
    },
    outlined: {
      backgroundColor: 'transparent',
      color: getColor(`${color}.500`),
      border: `1px solid ${getColor(`${color}.500`)}`,
      '&:hover': {
        backgroundColor: getColor(`${color}.50`),
      },
    },
    text: {
      backgroundColor: 'transparent',
      color: getColor(`${color}.500`),
      '&:hover': {
        backgroundColor: getColor(`${color}.50`),
      },
    },
  };

  return {
    ...base,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

/**
 * Ghana-themed component variants
 */
export const ghanaTheme = {
  flag: {
    background: `linear-gradient(to bottom, ${tokens.colors.ghana.red} 33%, ${tokens.colors.ghana.gold} 33% 66%, ${tokens.colors.ghana.green} 66%)`,
  },
  accent: {
    primary: tokens.colors.ghana.green,
    secondary: tokens.colors.ghana.gold,
    tertiary: tokens.colors.ghana.red,
  },
};

// Export all utilities
export const themeUtils = {
  getResponsiveValue,
  mediaQuery,
  spacing,
  getColor,
  focusStyles,
  hoverElevation,
  responsiveFont,
  cardStyles,
  buttonStyles,
  ghanaTheme,
};

export default themeUtils;
