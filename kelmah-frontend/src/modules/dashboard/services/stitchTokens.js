/**
 * Stitch "Kelmah Elite" design tokens.
 *
 * Single source of truth shared by the Hirer and Worker dashboards so the two
 * pages can never drift. Values mirror the Stitch HTML
 * (stitch_kelmah_dashboard_redevelopment) and the accompanying DESIGN.md.
 *
 * The global MUI theme (src/theme/index.js) is intentionally left untouched —
 * these tokens are applied locally via `sx` where the Stitch design demands
 * specific colors that differ from the app-wide brand gold (#FFD34D).
 */

// ─── Color tokens (exact Stitch values) ───
export const STITCH = {
  // Gold family
  primary: '#f2ca50',
  primaryContainer: '#d4af37', // the iconic solid gold for buttons / active states
  primaryFixed: '#ffe088',
  onPrimary: '#3c2f00',
  onPrimaryContainer: '#554300', // text on gold backgrounds

  // Surface stack (dark-mode first)
  background: '#121317',
  surface: '#121317',
  surfaceDim: '#121317',
  surfaceContainerLowest: '#0d0e12',
  surfaceContainerLow: '#1a1b1f',
  surfaceContainer: '#1e1f23', // card backgrounds
  surfaceContainerHigh: '#292a2e', // active nav item
  surfaceVariant: '#343539', // secondary surfaces / icon chips
  surfaceBright: '#38393d',

  // Lines / text
  borderMuted: '#2C2C2E',
  outline: '#99907c',
  outlineVariant: '#4d4635',
  onSurface: '#e3e2e7', // primary text
  onSurfaceVariant: '#d0c5af', // secondary / muted text

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
};

// ─── Typography ───
export const FONT_HEAD = '"Montserrat", "Segoe UI", sans-serif';
export const FONT_BODY = '"Roboto Flex", "Roboto", "Helvetica Neue", sans-serif';

// Headline/body presets mapped to Stitch fontSize scale (used inline via sx).
export const STITCH_TYPE = {
  displayLg: { fontFamily: FONT_HEAD, fontSize: '2.5rem', fontWeight: 700, lineHeight: '56px', letterSpacing: '-0.02em' }, // 40px on responsive layouts, 48px on wide
  headlineLg: { fontFamily: FONT_HEAD, fontSize: '1.75rem', fontWeight: 700, lineHeight: '40px' },
  headlineMd: { fontFamily: FONT_HEAD, fontSize: '1.5rem', fontWeight: 600, lineHeight: '32px' },
  bodyLg: { fontFamily: FONT_BODY, fontSize: '1.125rem', fontWeight: 400, lineHeight: '28px' },
  bodyMd: { fontFamily: FONT_BODY, fontSize: '1rem', fontWeight: 400, lineHeight: '24px' },
  labelMd: { fontFamily: FONT_HEAD, fontSize: '0.875rem', fontWeight: 600, lineHeight: '20px', letterSpacing: '0.05em' },
  labelSm: { fontFamily: FONT_HEAD, fontSize: '0.75rem', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.03em' },
};

// ─── Reusable style fragments ───

/**
 * Glassmorphism panel — semi-transparent surface with blur + muted border.
 * Matches `.glass-panel` in the Stitch HTML (hirer variant).
 */
export const glassPanel = {
  backgroundColor: 'rgba(26, 26, 26, 0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${STITCH.borderMuted}`,
};

/**
 * Hover effect for cards — gold border, soft inset glow, slight lift.
 * Matches `.hover-gold-glow` in the Stitch HTML.
 */
export const hoverGoldGlow = {
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
  '@media (hover: hover)': {
    '&:hover': {
      borderColor: STITCH.primaryContainer,
      boxShadow:
        'inset 0 0 20px rgba(212, 175, 55, 0.05), 0 4px 20px rgba(0,0,0,0.5)',
      transform: 'translateY(-2px)',
    },
  },
};

/**
 * Solid-gold primary button (primary-container). Use via MUI `<Button sx={goldButtonSx} />`.
 */
export const goldButtonSx = {
  backgroundColor: STITCH.primaryContainer,
  color: STITCH.onPrimaryContainer,
  fontFamily: FONT_HEAD,
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '4px',
  boxShadow: '0 4px 14px rgba(212,175,55,0.25)',
  transition: 'background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease',
  '&:hover': {
    backgroundColor: STITCH.primary,
    boxShadow: '0 6px 20px rgba(212,175,55,0.4)',
  },
  '&:active': {
    transform: 'scale(0.97)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    color: 'rgba(85, 67, 0, 0.5)',
  },
};

/**
 * Smaller pill-style gold button (e.g. "Open Pipeline" in the top bar).
 */
export const goldPillSx = {
  ...goldButtonSx,
  borderRadius: '4px',
  boxShadow: '0 0 15px rgba(212,175,55,0.2)',
};
