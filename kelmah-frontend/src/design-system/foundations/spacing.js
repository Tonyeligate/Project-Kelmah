/**
 * Kelmah Design System - Spacing Foundations
 * Consistent spacing system for layout, padding, margins, and positioning
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

// Spacing scale based on 4px grid system
export const SPACING = {
  0: '0px',
  px: '1px',
  0.5: `${BASE_UNIT * 0.5}px`, // 2px
  1: `${BASE_UNIT * 1}px`,     // 4px
  1.5: `${BASE_UNIT * 1.5}px`, // 6px
  2: `${BASE_UNIT * 2}px`,     // 8px
  2.5: `${BASE_UNIT * 2.5}px`, // 10px
  3: `${BASE_UNIT * 3}px`,     // 12px
  3.5: `${BASE_UNIT * 3.5}px`, // 14px
  4: `${BASE_UNIT * 4}px`,     // 16px
  5: `${BASE_UNIT * 5}px`,     // 20px
  6: `${BASE_UNIT * 6}px`,     // 24px
  7: `${BASE_UNIT * 7}px`,     // 28px
  8: `${BASE_UNIT * 8}px`,     // 32px
  9: `${BASE_UNIT * 9}px`,     // 36px
  10: `${BASE_UNIT * 10}px`,   // 40px
  11: `${BASE_UNIT * 11}px`,   // 44px
  12: `${BASE_UNIT * 12}px`,   // 48px
  14: `${BASE_UNIT * 14}px`,   // 56px
  16: `${BASE_UNIT * 16}px`,   // 64px
  18: `${BASE_UNIT * 18}px`,   // 72px
  20: `${BASE_UNIT * 20}px`,   // 80px
  24: `${BASE_UNIT * 24}px`,   // 96px
  28: `${BASE_UNIT * 28}px`,   // 112px
  32: `${BASE_UNIT * 32}px`,   // 128px
  36: `${BASE_UNIT * 36}px`,   // 144px
  40: `${BASE_UNIT * 40}px`,   // 160px
  44: `${BASE_UNIT * 44}px`,   // 176px
  48: `${BASE_UNIT * 48}px`,   // 192px
  52: `${BASE_UNIT * 52}px`,   // 208px
  56: `${BASE_UNIT * 56}px`,   // 224px
  60: `${BASE_UNIT * 60}px`,   // 240px
  64: `${BASE_UNIT * 64}px`,   // 256px
  72: `${BASE_UNIT * 72}px`,   // 288px
  80: `${BASE_UNIT * 80}px`,   // 320px
  96: `${BASE_UNIT * 96}px`,   // 384px
};

// Semantic spacing for common use cases
export const SEMANTIC_SPACING = {
  // Component internal spacing
  component: {
    xs: SPACING[1],   // 4px - Very tight spacing within components
    sm: SPACING[2],   // 8px - Tight spacing within components
    md: SPACING[4],   // 16px - Default component spacing
    lg: SPACING[6],   // 24px - Loose spacing within components
    xl: SPACING[8],   // 32px - Very loose spacing within components
  },
  
  // Layout spacing between components
  layout: {
    xs: SPACING[4],   // 16px - Tight layout spacing
    sm: SPACING[6],   // 24px - Small layout spacing
    md: SPACING[8],   // 32px - Default layout spacing
    lg: SPACING[12],  // 48px - Large layout spacing
    xl: SPACING[16],  // 64px - Extra large layout spacing
    '2xl': SPACING[24], // 96px - Section spacing
    '3xl': SPACING[32], // 128px - Page section spacing
  },
  
  // Container padding
  container: {
    xs: SPACING[4],   // 16px - Mobile container padding
    sm: SPACING[6],   // 24px - Small screen container padding
    md: SPACING[8],   // 32px - Medium screen container padding
    lg: SPACING[12],  // 48px - Large screen container padding
    xl: SPACING[16],  // 64px - Extra large screen container padding
  },
  
  // Form spacing
  form: {
    field: SPACING[4],     // 16px - Between form fields
    group: SPACING[6],     // 24px - Between form groups
    section: SPACING[8],   // 32px - Between form sections
    button: SPACING[3],    // 12px - Around form buttons
  },
  
  // Card and panel spacing
  card: {
    padding: {
      xs: SPACING[3],  // 12px - Compact card padding
      sm: SPACING[4],  // 16px - Small card padding
      md: SPACING[6],  // 24px - Default card padding
      lg: SPACING[8],  // 32px - Large card padding
    },
    gap: {
      xs: SPACING[2],  // 8px - Tight card spacing
      sm: SPACING[4],  // 16px - Default card spacing
      md: SPACING[6],  // 24px - Loose card spacing
    },
  },
  
  // Header and navigation spacing
  header: {
    height: SPACING[16],     // 64px - Standard header height
    padding: SPACING[4],     // 16px - Header padding
    gap: SPACING[6],         // 24px - Between header elements
  },
  
  // Button spacing
  button: {
    padding: {
      xs: `${SPACING[2]} ${SPACING[3]}`,  // 8px 12px - Small button
      sm: `${SPACING[2.5]} ${SPACING[4]}`, // 10px 16px - Default button
      md: `${SPACING[3]} ${SPACING[6]}`,   // 12px 24px - Medium button
      lg: `${SPACING[4]} ${SPACING[8]}`,   // 16px 32px - Large button
    },
    gap: SPACING[2],  // 8px - Between button elements
  },
};

// Responsive spacing utilities
export const RESPONSIVE_SPACING = {
  // Mobile-first responsive spacing
  responsive: {
    xs: {
      mobile: SPACING[2],    // 8px on mobile
      tablet: SPACING[4],    // 16px on tablet
      desktop: SPACING[6],   // 24px on desktop
    },
    sm: {
      mobile: SPACING[4],    // 16px on mobile
      tablet: SPACING[6],    // 24px on tablet
      desktop: SPACING[8],   // 32px on desktop
    },
    md: {
      mobile: SPACING[6],    // 24px on mobile
      tablet: SPACING[8],    // 32px on tablet
      desktop: SPACING[12],  // 48px on desktop
    },
    lg: {
      mobile: SPACING[8],    // 32px on mobile
      tablet: SPACING[12],   // 48px on tablet
      desktop: SPACING[16],  // 64px on desktop
    },
    xl: {
      mobile: SPACING[12],   // 48px on mobile
      tablet: SPACING[16],   // 64px on tablet
      desktop: SPACING[24],  // 96px on desktop
    },
  },
};

// Border radius scale
export const BORDER_RADIUS = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// Shadow spacing (for consistent elevation)
export const SHADOW_SPACING = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Z-index scale for layering
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Utility functions
export const getSpacing = (value) => {
  if (typeof value === 'number') {
    return `${value * BASE_UNIT}px`;
  }
  return SPACING[value] || value;
};

export const createSpacing = (...values) => {
  return values.map(getSpacing).join(' ');
};

export const getResponsiveSpacing = (size, breakpoint = 'mobile') => {
  return RESPONSIVE_SPACING.responsive[size]?.[breakpoint] || SPACING[4];
};

// Grid system
export const GRID = {
  columns: 12,
  gutter: {
    xs: SPACING[4],   // 16px
    sm: SPACING[6],   // 24px
    md: SPACING[8],   // 32px
    lg: SPACING[10],  // 40px
    xl: SPACING[12],  // 48px
  },
  container: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export default {
  SPACING,
  SEMANTIC_SPACING,
  RESPONSIVE_SPACING,
  BORDER_RADIUS,
  SHADOW_SPACING,
  Z_INDEX,
  GRID,
  getSpacing,
  createSpacing,
  getResponsiveSpacing,
}; 