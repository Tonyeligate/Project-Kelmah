---
name: Kelmah Artisan
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4d4732'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e775f'
  outline-variant: '#d0c6ab'
  surface-tint: '#705d00'
  primary: '#705d00'
  on-primary: '#ffffff'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#e9c400'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5f5f57'
  on-tertiary: '#ffffff'
  tertiary-container: '#dcdad0'
  on-tertiary-container: '#5f5f58'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
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
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
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

The visual style is **Corporate Modern with a Functional Edge.** By shifting to a **Light Mode** default, the system provides a clean, open, and high-clarity workspace that mirrors the organized nature of professional project management. The aesthetic avoids unnecessary decoration, focusing instead on utilitarian clarity and precision. The interface feels structured, reliable, and highly actionable, reminiscent of architectural blueprints and professional documentation.

## Colors

The palette is anchored by a high-visibility **Vibrant Yellow**, traditionally associated with construction and safety, now optimized for clarity against a clean, light backdrop.

- **Primary (#FFD700):** Used for primary buttons, active states, and key highlights. It serves as the brand's energetic signature.
- **Secondary (#1A1A1A):** Used for high-contrast text, borders, and deep accents. It provides the industrial weight needed to anchor the light interface.
- **Tertiary (#F9F7ED):** A warm, off-white "bone" color used for subtle section backgrounds and cards to differentiate content without the harshness of pure white.
- **Neutral (#FFFFFF):** The primary background color, ensuring a spacious and professional environment that maximizes legibility.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

**Montserrat** is used for headlines to provide a geometric, confident, and modern architectural feel. **Inter** is the workhorse for all body text, UI labels, and data-heavy job listings, chosen for its exceptional legibility on screens of all sizes. 

Large display titles should use tighter letter spacing to maintain a "solid" block-like appearance. All body copy must maintain a minimum line height of 1.5x to ensure readability. In the light theme, weights are crisp and clear, providing excellent contrast for users operating in various lighting conditions, including high-glare outdoor environments.

## Layout & Spacing

The system follows a **mobile-first fluid grid.** 

- **Mobile:** 4-column grid with 16px margins. Primary focus on single-column stacks for job cards.
- **Desktop:** 12-column fixed grid (max-width: 1280px) with 64px margins.
- **Spacing Rhythm:** All spacing is based on an 8px incremental scale. 

**Touch Targets:** Every interactive element (buttons, inputs, links) must adhere to a minimum size of 48x48px to ensure ease of use for workers who may have calloused hands or be using the app on the move.

## Elevation & Depth

In the light environment, depth is conveyed through **Soft Shadows and Tonal Offsets** to define hierarchy and focus.

- **Level 0 (Floor):** The base background using Neutral white (#FFFFFF).
- **Level 1 (Card):** Surfaces elevated with very soft, diffused shadows or the Tertiary "bone" color (#F9F7ED) to separate content sections.
- **Level 2 (Active/Floating):** Used for navigation bars and floating action buttons (FABs). These use the primary yellow for accents and more pronounced shadows to indicate they sit above the content.

We avoid complex gradients to ensure the app remains clear and performant under direct sunlight.

## Shapes

The shape language is **Rounded**, using a 8px (0.5rem) base radius. This softens the industrial tone, making the platform feel more approachable and modern while maintaining a structural integrity.

- **Standard Elements:** (Buttons, Input fields, Small Cards) use 8px.
- **Large Containers:** (Bottom sheets, Featured sections) use 16px.
- **Badges/Chips:** Use full pill-shaping (999px) to contrast against the more structured rectangular cards.

## Components

### Buttons
- **Primary:** Background #FFD700, Text #1A1A1A, Bold Montserrat labels. High-impact for actions like "Hire Now."
- **Secondary:** Background #1A1A1A, Text #FFFFFF. Used for "I need work" or significant secondary navigation.
- **Ghost:** Border #1A1A1A, Text #1A1A1A. Used for less urgent actions like "View Profile."

### Cards (Job/Talent Listings)
Cards are the core of the experience. They feature:
- A Tertiary (#F9F7ED) background or a thin 1px border to define boundaries.
- Clear **Headers** using Montserrat.
- **Status Badges** using pill-shapes with high-contrast text.
- **Primary Action** aligned to the bottom right for thumb-reachability on mobile.

### Inputs
Text fields use a 1px #1A1A1A border when inactive and a #FFD700 thick border when focused. Labels must always be visible to assist with clarity.

### Bottom Navigation
For mobile, a sticky bottom bar with 4-5 icons (Home, Jobs, Messages, Profile) provides quick access to core features. The active state is indicated by a #FFD700 highlight.