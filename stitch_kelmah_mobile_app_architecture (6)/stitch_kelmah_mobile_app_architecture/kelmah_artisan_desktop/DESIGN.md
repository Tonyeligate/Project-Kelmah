---
name: Kelmah Artisan Desktop
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4d4732'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
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
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#dadada'
  on-tertiary-container: '#5e5f5f'
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
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 84px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Montserrat
    fontSize: 60px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
  label-md:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  baseline: 8px
  container-max-width: 1440px
  columns: '12'
  gutter: 32px
  margin-desktop: 64px
  margin-tablet: 32px
  sidebar-width: 280px
---

## Brand & Style

The design system translates an artisan, craft-focused mobile identity into a premium, expansive desktop experience. The brand personality is rooted in high-end craftsmanship, blending the energy of a startup with the weight of a traditional guild.

The design style is **Modern Minimalist with Tactile Accents**. It utilizes heavy whitespace to allow high-quality product photography to breathe, punctuated by high-contrast primary accents. The transition to desktop focuses on "The Gallery Effect"—utilizing the horizontal canvas to showcase work through structured, architectural layouts that evoke a sense of permanence and professional reliability. The UI should feel intentional, precise, and premium.

## Colors

The palette is anchored by "Artisan Gold" (#FFD700), used strategically for primary actions and brand signifiers. To maintain a premium desktop aesthetic, the background remains predominantly white or off-white (#F5F5F5) to ensure maximum legibility and focus on content.

- **Primary:** #FFD700 (Artisan Gold) - Used for primary buttons, active states, and highlights.
- **Secondary:** #1A1A1A (Deep Charcoal) - Used for text, iconography, and high-contrast UI elements like sidebars or headers.
- **Tertiary:** #F5F5F5 (Alabaster) - Used for background layering and subtle container separation.
- **Neutral:** #666666 (Stone) - Used for secondary text, metadata, and borders.

## Typography

This design system leverages **Montserrat** exclusively to maintain a bold, geometric, and modern feel. On desktop, the type scale is aggressively expanded to take advantage of the viewport size.

Headlines use a tighter letter-spacing to appear more "locked-in" and architectural. Body text maintains a generous line height (1.5x) to ensure long-form readability in multi-pane layouts. Labels and small metadata are set in semi-bold uppercase to create a clear visual distinction from body copy. Use `display-xl` for hero sections and `headline-xl` for major page transitions.

## Layout & Spacing

The layout utilizes a **12-column fixed-width grid** centered within the viewport for standard pages, and a **fluid multi-pane layout** for dashboard and tool-heavy views.

- **Grid:** 12 columns with 32px gutters and 64px outer margins on desktop.
- **Breakpoints:** Desktop (1280px+), Tablet (768px - 1279px), Mobile (<767px).
- **Navigation:** A persistent left-hand sidebar (280px) is preferred for complex navigation, while a sticky top header is used for content-first editorial pages.
- **Multi-pane:** In artisan toolsets, utilize a three-pane architecture: Navigation (Left), Content List/Gallery (Center), and Detail/Inspector (Right).

## Elevation & Depth

To maintain the "Artisan" aesthetic, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surfaces:** Use #F5F5F5 for the base canvas. Secondary containers (like cards or sidebars) use #FFFFFF with a subtle 1px border (#E0E0E0).
- **Elevation:** Level 1 elevation is reserved for floating elements (modals, dropdowns) and uses a soft, neutral-tinted ambient shadow: `0 8px 32px rgba(0, 0, 0, 0.08)`. 
- **Active States:** Instead of elevation, active states are indicated by the primary #FFD700 color or a 2px interior stroke.

## Shapes

The shape language is **Soft (0.25rem base)**, reflecting a balance between organic craft and industrial precision.

- **Standard Elements:** Buttons, inputs, and small chips use `rounded` (4px).
- **Containers:** Large cards and surface areas use `rounded-lg` (8px).
- **Feature Elements:** Images in galleries should remain sharp (0px) or use very small rounding to maintain a professional, editorial look.

## Components

### Buttons
- **Primary:** Solid #FFD700 with #1A1A1A text. Bold, uppercase Montserrat. 
- **Secondary:** Transparent with a 2px #1A1A1A border. 
- **Desktop Sizing:** Minimum height of 48px to provide a generous click target.

### Input Fields
- **Style:** Underlined or subtle 1px border. Focus state switches border to #FFD700. Labels sit above the field in `label-md` style.

### Navigation Patterns
- **Primary Sidebar:** Dark-themed (#1A1A1A) with #FFD700 active indicators. Use for artisan dashboards and project management.
- **Persistent Header:** 80px height, white background, #1A1A1A bottom border.

### Multi-Pane Layouts
- **Split Views:** Use 1px vertical dividers (#E0E0E0) to separate navigation, lists, and details. This prevents the "floating" feeling and grounds the UI in a structured grid.

### Cards
- **Product/Artisan Cards:** Minimalist. Large image, `headline-md` title, and `body-sm` metadata. No shadow; 1px border on hover only.