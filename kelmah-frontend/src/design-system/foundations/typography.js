/**
 * Kelmah Design System - Typography Foundations
 * Professional typography system for Ghana's Skilled Trades Platform
 */

// Font families
export const FONT_FAMILIES = {
  // Primary font for body text and UI elements
  primary: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
  
  // Display font for headings and brand elements
  display: '"Montserrat", "Inter", "Segoe UI", "Roboto", sans-serif',
  
  // Monospace font for code and technical content
  mono: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace',
};

// Font weights
export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Font sizes (in rem)
export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem',    // 128px
};

// Line heights
export const LINE_HEIGHTS = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Letter spacing
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Typography scale for consistent text hierarchy
export const TYPOGRAPHY_SCALE = {
  // Display text - for hero sections and major headings
  'display-2xl': {
    fontSize: FONT_SIZES['8xl'],
    lineHeight: LINE_HEIGHTS.none,
    letterSpacing: LETTER_SPACING.tighter,
    fontWeight: FONT_WEIGHTS.black,
    fontFamily: FONT_FAMILIES.display,
  },
  'display-xl': {
    fontSize: FONT_SIZES['7xl'],
    lineHeight: LINE_HEIGHTS.none,
    letterSpacing: LETTER_SPACING.tighter,
    fontWeight: FONT_WEIGHTS.extrabold,
    fontFamily: FONT_FAMILIES.display,
  },
  'display-lg': {
    fontSize: FONT_SIZES['6xl'],
    lineHeight: LINE_HEIGHTS.none,
    letterSpacing: LETTER_SPACING.tight,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.display,
  },
  'display-md': {
    fontSize: FONT_SIZES['5xl'],
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.display,
  },
  'display-sm': {
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },
  'display-xs': {
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },

  // Headings - for section titles and content hierarchy
  'heading-xl': {
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.display,
  },
  'heading-lg': {
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },
  'heading-md': {
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },
  'heading-sm': {
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },
  'heading-xs': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
  },

  // Body text - for content and descriptions
  'body-xl': {
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.relaxed,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },
  'body-lg': {
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.relaxed,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },
  'body-md': {
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },
  'body-sm': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },
  'body-xs': {
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },

  // Labels and UI text
  'label-lg': {
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },
  'label-md': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },
  'label-sm': {
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },

  // Captions and small text
  'caption-lg': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },
  'caption-md': {
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
  },

  // Overlines and tags
  'overline-lg': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wider,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
    textTransform: 'uppercase',
  },
  'overline-md': {
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.widest,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
    textTransform: 'uppercase',
  },
};

// Responsive typography utilities
export const RESPONSIVE_TYPOGRAPHY = {
  // Mobile-first responsive headings
  'responsive-display': {
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS.tight,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.display,
    '@media (min-width: 640px)': {
      fontSize: FONT_SIZES['4xl'],
    },
    '@media (min-width: 768px)': {
      fontSize: FONT_SIZES['5xl'],
    },
    '@media (min-width: 1024px)': {
      fontSize: FONT_SIZES['6xl'],
    },
  },
  'responsive-heading': {
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.snug,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.display,
    '@media (min-width: 640px)': {
      fontSize: FONT_SIZES['2xl'],
    },
    '@media (min-width: 768px)': {
      fontSize: FONT_SIZES['3xl'],
    },
  },
  'responsive-body': {
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.primary,
    '@media (min-width: 640px)': {
      fontSize: FONT_SIZES.base,
    },
    '@media (min-width: 768px)': {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.relaxed,
    },
  },
};

// Typography utilities
export const getTypographyStyle = (variant) => {
  return TYPOGRAPHY_SCALE[variant] || TYPOGRAPHY_SCALE['body-md'];
};

export const createTextStyle = (options = {}) => {
  const {
    size = FONT_SIZES.base,
    weight = FONT_WEIGHTS.regular,
    lineHeight = LINE_HEIGHTS.normal,
    letterSpacing = LETTER_SPACING.normal,
    family = FONT_FAMILIES.primary,
    transform,
  } = options;

  return {
    fontSize: size,
    fontWeight: weight,
    lineHeight,
    letterSpacing,
    fontFamily: family,
    ...(transform && { textTransform: transform }),
  };
};

export default {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  LETTER_SPACING,
  TYPOGRAPHY_SCALE,
  RESPONSIVE_TYPOGRAPHY,
  getTypographyStyle,
  createTextStyle,
}; 