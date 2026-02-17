/**
 * Centralized layout constants for consistent spacing and z-index layering.
 * Prevents hardcoded magic numbers and z-index wars across the app.
 *
 * Z-index scale mirrors Binance's mobile web: a small set of named layers
 * instead of random 999/1000/9999 values.
 */

// ── Heights ──────────────────────────────────────────────────────
export const HEADER_HEIGHT = 64; // px — desktop header
export const HEADER_HEIGHT_MOBILE = 56; // px — mobile header (compact)
export const BOTTOM_NAV_HEIGHT = 56; // px — MobileBottomNav
export const STICKY_CTA_HEIGHT = 64; // px — sticky bottom action bars

// ── Z-Index Scale ────────────────────────────────────────────────
// Each layer is separated by 10 so we have room to insert if needed.
export const Z_INDEX = {
  /** Below everything (e.g. background decorations) */
  below: -1,
  /** Default / content level */
  base: 0,
  /** Cards that float slightly above content */
  card: 10,
  /** Sticky elements: sub-headers, tab bars, filter rows */
  sticky: 100,
  /** The main app header */
  header: 1100,
  /** Side drawers, slide-over panels */
  drawer: 1200,
  /** Bottom navigation bar */
  bottomNav: 1250,
  /** Sticky CTA bars that overlay content on mobile */
  stickyCta: 1260,
  /** Modal back-drops */
  backdrop: 1300,
  /** Modals / Dialogs */
  modal: 1400,
  /** Popovers, menus, select dropdowns */
  popover: 1500,
  /** Snackbar / toast notifications */
  snackbar: 1600,
  /** Tooltips */
  tooltip: 1700,
};

export default { HEADER_HEIGHT, HEADER_HEIGHT_MOBILE, BOTTOM_NAV_HEIGHT, STICKY_CTA_HEIGHT, Z_INDEX };
