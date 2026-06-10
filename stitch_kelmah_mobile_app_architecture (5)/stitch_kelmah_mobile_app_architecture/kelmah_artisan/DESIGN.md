---
name: Kelmah Artisan
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#f8f6ec'
  on-tertiary: '#30312a'
  tertiary-container: '#dcdad0'
  on-tertiary-container: '#5f5f58'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e3d9'
  tertiary-fixed-dim: '#c8c7bd'
  on-tertiary-fixed: '#1b1c16'
  on-tertiary-fixed-variant: '#474740'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 16px
  touch-target: 48px
---

## Brand & Style

The design system for Kelmah is built on the pillars of **trust, efficiency, and industrial professionalism.** It caters to two distinct user groups—skilled artisans seeking opportunities and homeowners/contractors looking for reliable talent. 

The visual style is **Corporate Modern with a Functional Edge.** By shifting to a **Dark Mode** default, the system enhances its "on-site" feel, utilizing high-contrast pairings and structured layouts to convey stability. The aesthetic avoids unnecessary decoration, focusing instead on utilitarian clarity that mirrors the precision of the trades it represents. The interface feels rugged, clear, and highly actionable.

## Colors

The palette is anchored by a high-visibility **Vibrant Yellow**, traditionally associated with construction and safety, optimized for high-contrast visibility against dark backgrounds.

- **Primary (#FFD700):** Reserved for primary buttons, active states, and key highlights. In dark mode, it acts as a beacon for action.
- **Secondary (#1A1A1A):** The foundational surface color for the dark interface, providing an industrial, deep-tone canvas.
- **Tertiary (#F9F7ED):** A warm, off-white "bone" color used sparingly for high-contrast text or specific card elements to maintain warmth.
- **Neutral (#FFFFFF):** Used for primary typography and icons to ensure maximum legibility against dark surfaces.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

**Montserrat** is used for headlines to provide a geometric, confident, and modern architectural feel. **Inter** is the workhorse for all body text, UI labels, and data-heavy job listings, chosen for its exceptional legibility on small mobile screens. 

Large display titles should use tighter letter spacing to maintain a "solid" block-like appearance. All body copy must maintain a minimum line height of 1.5x to ensure readability for users who may be viewing the app in high-glare outdoor environments. In the dark theme, font weights are slightly preserved to prevent "ink bleed" and maintain crispness.

## Layout & Spacing

The system follows a **mobile-first fluid grid.** 

- **Mobile:** 4-column grid with 16px margins. Primary focus on single-column stacks for job cards.
- **Desktop:** 12-column fixed grid (max-width: 1280px) with 64px margins.
- **Spacing Rhythm:** All spacing is based on an 8px incremental scale. 

**Touch Targets:** Every interactive element (buttons, inputs, links) must adhere to a minimum size of 48x48px to ensure ease of use for workers who may have calloused hands or be using the app on the move.

## Elevation & Depth

To maintain a "professional and reliable" feel in a dark environment, the system uses **Tonal Layers** rather than heavy shadows to define hierarchy.

- **Level 0 (Floor):** The base surface using the secondary color (#1A1A1A).
- **Level 1 (Card):** Surfaces elevated with slightly lighter gray tones or 1px subtle borders to separate content.
- **Level 2 (Active/Floating):** Used for navigation bars and floating action buttons (FABs). These use the primary yellow for accents to indicate they sit above the content.

We avoid neomorphism and heavy gradients to ensure the app remains performant and clear under direct sunlight.

## Shapes

The shape language is **Rounded**, using a 8px (0.5rem) base radius. This softens the industrial tone, making the platform feel more approachable and modern while maintaining a structural integrity.

- **Standard Elements:** (Buttons, Input fields, Small Cards) use 8px.
- **Large Containers:** (Bottom sheets, Featured sections) use 16px.
- **Badges/Chips:** Use full pill-shaping (999px) to contrast against the more structured rectangular cards.

## Components

### Buttons
- **Primary:** Background #FFD700, Text #1A1A1A, Bold Montserrat labels. High-impact for "Hire Now" or "Apply."
- **Secondary:** Background #333333, Text #FFFFFF. Used for "I need work" or secondary navigation.
- **Ghost:** Border #FFD700, Text #FFD700. Used for less urgent actions like "View Profile."

### Cards (Job/Talent Listings)
Cards are the core of the experience. They must include:
- A clear **Header** (Trade Type + Location).
- **Status Badges** (e.g., "Verified," "Available Now") using pill-shapes with high-contrast text.
- **Primary Action** aligned to the bottom right for thumb-reachability on mobile.

### Inputs
Text fields use a 1px white border when inactive and a #FFD700 border when focused. Labels must always be visible (no floating placeholders that disappear) to assist with clarity.

### Bottom Navigation
For mobile, a sticky bottom bar with 4-5 icons (Home, Jobs, Messages, Profile) provides quick access to core features. The active state is indicated by a #FFD700 highlight.