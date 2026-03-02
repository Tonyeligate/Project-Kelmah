# Kelmah Mobile Audit — Binance Design Pattern Comparison

**Date**: June 2025  
**Scope**: All frontend pages, layout components, and theme  
**Standard**: Binance.com mobile web — firm, data-dense, flat, zero decorative fluff  
**Methodology**: Read every page file end-to-end, traced component chains, validated against live Binance mobile patterns

---

## Executive Summary

### What's Already Right (Theme-Level Wins ✅)

The MUI theme at `src/theme/index.js` already has several Binance-aligned overrides:

| Pattern | Theme Status | Notes |
|---------|-------------|-------|
| iOS auto-zoom prevention | ✅ `MuiInputBase { fontSize: 16px }` | Global fix — BUT pages that override `inputProps.style.fontSize` to `<16px` will break it |
| Button touch targets | ✅ `MuiButton { minHeight: 44px }` | Correct |
| Card flat on mobile | ✅ `MuiCard @mobile { borderRadius: 12, boxShadow: minimal, hover: none }` | Correct |
| Paper flat on mobile | ✅ `MuiPaper @mobile { borderRadius: 10, boxShadow: minimal }` | Correct |
| AppBar solid on mobile | ✅ `MuiAppBar @mobile { backdropFilter: none, solid bg }` | Correct |
| Dialog near-fullscreen | ✅ `MuiDialog @mobile { margin: 16, borderRadius: 12 }` | Correct |
| Container padding | ✅ `MuiContainer { px: 16px mobile, 24px desktop }` | Correct |
| Bottom nav clearance | ✅ `Layout.jsx { pb: calc(56px + safe-area + 16px) }` | Wrapper handles it for ALL pages |

### What's Still Wrong

| Category | Remaining Issues | Severity |
|----------|-----------------|----------|
| Dead code / unused animations | 7 keyframe animations in JobsPage, HeroSection dead code | CRITICAL |
| framer-motion on data lists | Messaging, Reviews — motion.div on every list item | HIGH |
| Decorative effects bypassing theme | Inline gradients, glowPulse CSS animation, boxShadow overrides | HIGH |
| Above-fold content waste | HomeLanding 100vh hero, JobsPage marketing sections, large avatars | HIGH |
| Typography overscaling on mobile | h3/h4 titles without responsive fontSize overrides | MEDIUM |
| Hover transforms on touch | Pages with inline `&:hover { transform }` not gated by `@media(hover:hover)` | MEDIUM |
| Input fontSize overrides | Pages explicitly setting `fontSize < 16px` on inputs, defeating theme fix | MEDIUM |
| Touch targets — IconButtons | `size="small"` IconButtons without `minWidth/minHeight: 44` | MEDIUM |
| Excessive padding/spacing | 24px section padding, 100px avatars, wide borderRadius overrides | LOW |

---

## Findings By Page

### Layout & Navigation Components

#### Layout.jsx (238 lines) ✅ GOOD
- Bottom nav clearance applied globally via `pb: calc(56px + safe-area + 16px)` — individual pages do NOT need their own padding
- Mobile/desktop branching clean at `breakpoints.up('md')`
- Messages page correctly exempted from Header rendering

#### MobileBottomNav.jsx (249 lines) ✅ GOOD
- 4 items, 56px height, keyboard-aware hide, safe-area padding
- Role-based navigation
- Minor: `backdropFilter: blur(20px)` — but theme already fixes AppBar, this component is separate. Consider solid bg.

#### Header.jsx (1620 lines) ⚠️ NEEDS WORK
- **HIGH**: 1620 lines — massively oversized for a header component
- **MEDIUM**: `NavMenuSection` component defined before imports (unusual pattern)
- **LOW**: Heavy styled-components with gradients on desktop; mobile gets theme override to solid

#### MobileNav.jsx (468 lines) ⚠️ NEEDS WORK
- **MEDIUM**: framer-motion staggered animations on nav items — 200ms entry delay
- **MEDIUM**: Drawer width `min(280px, 85vw)` — acceptable but generous
- **LOW**: Avatar 50px (should be 40px), profile section padding 24px (should be 16px)

---

### Dashboard Pages

#### WorkerDashboardPage.jsx (666 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Metric card height 100px | ~L339 | Reduce to 72px |
| 2 | **HIGH** | Chart sections 220-280px height | multiple | Reduce to 160-180px |
| 3 | **MEDIUM** | Greeting `variant="h5"` + `mb: 3` consumes excessive space | L442-L467 | `mb: 1`, smaller variant |
| 4 | **MEDIUM** | Font size 1.5rem for card values | multiple | Reduce to 1.1-1.2rem |
| 5 | **LOW** | LinearProgress z-index conflicts | — | Review z-index stack |

#### HirerDashboardPage.jsx (1079 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Breadcrumb visible on mobile — wastes 24px+ | L537 | Hide on `xs` |
| 2 | **HIGH** | Welcome banner 120px with emoji | L559 | Reduce to 64px, remove emoji |
| 3 | **HIGH** | SpeedDial z-index 1700 renders above modals | L1038 | Reduce to 1100 |
| 4 | **HIGH** | Auto-refresh bar visible on mobile — 40px wasted | L951 | Hide on `xs` |
| 5 | **MEDIUM** | Metric card height 100px | — | Reduce to 72px |
| 6 | **MEDIUM** | Chart sections 220-280px | — | Reduce to 160-180px |

---

### Auth Pages

#### LoginPage.jsx → MobileLogin.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Logo (70px) + chips + padding = ~240px before email field | — | Logo 40px, remove chips, reduce spacing |
| 2 | **MEDIUM** | framer-motion decorative entrance animations | — | Remove or CSS-only |
| 3 | **LOW** | "Sign Up" button 36px minHeight | — | Theme already sets 44px for MuiButton — check if overridden |

#### RegisterPage.jsx → MobileRegister.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Same branding overhead as Login (~240px) | — | Same fixes as Login |
| 2 | **MEDIUM** | Multi-step form with large spacing between steps | — | Reduce step spacing |

---

### Jobs Pages

#### JobsPage.jsx (2609 lines) ⚠️ CRITICAL
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **CRITICAL** | 7 dead keyframe animations (`float`, `shimmer`, `pulse`, etc.) bundled | top of file | Remove all dead keyframes |
| 2 | **CRITICAL** | `HeroSection` dead styled component with gradient + `rotateGlow` 30s animation | top of file | Remove entire unused component |
| 3 | **HIGH** | Platform Statistics + CTA marketing sections render on mobile (~450px waste) | — | Hide with `display: { xs: 'none' }` |
| 4 | **HIGH** | Card `minHeight: 300px` | — | Change to `minHeight: 'auto'` (Binance uses ~120px) |
| 5 | **MEDIUM** | 2609 lines — massively oversized, hard to maintain | — | Split into sub-components |

#### JobDetailsPage.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | 200px map renders before title — job info not visible above fold | — | Move map below description or collapse |
| 2 | **HIGH** | `variant="h3"` title with gradient text — no responsive fontSize | — | Use theme's clamp or responsive sx |
| 3 | **MEDIUM** | Gradient backgrounds on sections | — | Use solid theme colors |

#### JobSearchPage.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | framer-motion on search results | — | Remove |
| 2 | **LOW** | Filter section spacing generous | — | Tighten |

#### JobPostingPage.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | Multi-step form with large spacing | — | Reduce |
| 2 | **LOW** | Gradient submit button despite theme fix | — | Remove inline gradient |

#### JobManagementPage.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | Card decorative effects | — | Remove inline overrides |

---

### Landing Page

#### HomeLanding.jsx
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | 100vh hero — users scroll past entire screen to see product | — | Reduce to `min(50vh, 400px)` or remove hero |
| 2 | **HIGH** | All section padding `py: { xs: 6-7 }` (48-56px) — extreme waste | — | `py: { xs: 3 }` (24px) max |
| 3 | **MEDIUM** | Heavy framer-motion section animations | — | Remove or CSS only |
| 4 | **MEDIUM** | Gradient text effects on headings | — | Solid colors |

---

### Messaging Page

#### MessagingPage.jsx (2024 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | `AnimatePresence` + `motion.div` with staggered delays on every conversation | L494-L502 | Remove motion wrappers |
| 2 | **HIGH** | `motion.div` with `initial/animate/exit` on each message bubble | L1001-L1006 | Remove — messages appear instantly in Binance/WhatsApp |
| 3 | **HIGH** | `fontSize: '0.875rem'` on search input overrides theme's 16px → iOS zoom | L1475 | Remove the fontSize override, let theme handle it |
| 4 | **MEDIUM** | Message bubble gradient `linear-gradient(135deg, ...)` | L1046-L1048 | Solid `primary.main` background |
| 5 | **MEDIUM** | `borderRadius: '20px'` on mobile input | L1854 | `borderRadius: '8px'` |
| 6 | **MEDIUM** | Sticky input bottom clearance only `env(safe-area)` + 16px, no bottom nav buffer | L1883 | Needs `calc(56px + safe-area)` for sticky positioning |

---

### Settings Page

#### SettingsPage.jsx (195 lines) ✅ MOSTLY GOOD
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | Back IconButton default 40px (needs 44px) | L94 | `sx={{ minWidth: 44, minHeight: 44 }}` |
| 2 | **INFO** | Clean: `borderRadius: 2`, `elevation: 1`, no gradients — passes Binance test | — | — |

*Note: Bottom nav clearance handled by Layout.jsx wrapper*

---

### Profile Page

#### ProfilePage.jsx (679 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | `variant="h4"` for name (~34px) — too dominant on mobile | L305 | `sx={{ fontSize: { xs: '1.25rem', md: '2.125rem' } }}` |
| 2 | **MEDIUM** | Avatar 100px on mobile eats ~130px above fold | L222 | Reduce to 64px, inline with name |
| 3 | **MEDIUM** | iOS zoom — explicit `fontSize` overrides on some TextFields | L268, L275, L525, L539 | Remove overrides, let theme handle |

---

### Notifications Page

#### NotificationsPage.jsx (437 lines) ✅ GOOD
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **INFO** | Already has correct `pb` with safe-area | L253 | — |
| 2 | **INFO** | No gradients, no blur, no framer-motion — clean | — | — |
| 3 | **LOW** | `borderRadius: 2` (16px) on items — borderline | L79 | Reduce to 12px |

---

### Payment Pages

#### PaymentCenterPage.jsx (1265 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | `glowPulse` CSS animation infinite — burns battery | L424-L427 | Remove animation |
| 2 | **HIGH** | Dialog `borderRadius: 24px` + glow boxShadow + `backdropFilter: blur(4px)` | L1087-L1096 | `borderRadius: 2`, remove glow/blur (theme already handles Dialog on mobile) |
| 3 | **HIGH** | iOS zoom — filter date inputs with explicit small fontSize | L867-L882 | Remove fontSize overrides |
| 4 | **HIGH** | iOS zoom — dialog amount field | L1098-L1114 | Remove fontSize overrides |
| 5 | **MEDIUM** | Wallet gradient `linear-gradient(to right, ...)` + `elevation: 4` + 2px border | L80-L85 | Solid dark bg, `elevation: 0` |
| 6 | **MEDIUM** | SummaryCard hover scale + glow shadow | L430-L434 | Remove — no hover on mobile |
| 7 | **MEDIUM** | Filter bar potential overflow on 375px | L861-L865 | Use collapsible filter sheet on mobile |

#### WalletPage.jsx (140 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | iOS zoom — date inputs without safeguard | L85-L95 | Remove fontSize overrides |
| 2 | **MEDIUM** | Gradient decoration same as PaymentCenter | L69-L74 | Solid bg, elevation 0 |
| 3 | **MEDIUM** | Filter buttons no `minHeight: 44` | L103-L110 | Add `sx={{ minHeight: 44 }}` |
| 4 | **MEDIUM** | `p: 3` (24px) wallet padding on mobile | L68 | `p: { xs: 2, sm: 3 }` |

---

### Worker Pages

#### MyApplicationsPage.jsx (833 lines) ✅ MOSTLY GOOD
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **GOOD** | Bottom clearance `height: calc(100px + safe-area)` — generous | L412 | — |
| 2 | **GOOD** | Safe-area top handling correct | L247 | — |
| 3 | **MEDIUM** | Card `borderRadius: 3` (24px) | L304 | `borderRadius: 2` (16px) |
| 4 | **MEDIUM** | Dialog multiline TextField may override fontSize | L733 | Check/remove override |

#### WorkerProfileEditPage.jsx (1324 lines) ⚠️ CRITICAL
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **CRITICAL** | ~15+ TextFields with explicit `inputProps` that may override theme's fontSize: 16px | L778-L870 | Audit all `inputProps` — remove any `fontSize < 16px` |
| 2 | **HIGH** | `type="time"` inputs may trigger iOS zoom | L637-L658 | Ensure no fontSize override |
| 3 | **MEDIUM** | `elevation: 3` on every Paper section (6 sections) | L516, L693, L745+ | `elevation: 0` or `1` |
| 4 | **LOW** | Avatar 100px on mobile | L752 | Optional: reduce to 64px |

---

### Reviews Page

#### ReviewsPage.jsx (1327 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | `motion.div` + staggered delay on every ReviewCard | L493-L498 | Remove motion wrapper |
| 2 | **HIGH** | `AnimatePresence` wrapping list | L1073 | Remove |
| 3 | **HIGH** | Heavy gradient backgrounds on ALL cards | L499-L502 | `bgcolor: 'background.paper'` |
| 4 | **HIGH** | `::before` gradient bar on every card | L508-L522 | `borderTop: 3px solid` instead |
| 5 | **HIGH** | ThumbUp/Down buttons `size="small"` ~30px | L781-L805 | `sx={{ minHeight: 44, minWidth: 44 }}` |
| 6 | **HIGH** | iOS zoom — search field with `size="small"` | L951 | Remove fontSize override |
| 7 | **HIGH** | Bottom clearance only 16px + safe-area (missing 56px nav) | L881 | Fix: `pb: calc(safe-area + 72px)` — BUT check if Layout.jsx wrapper already covers this |
| 8 | **MEDIUM** | `borderRadius: 3` (24px) on cards | L505 | Theme already sets 12px on mobile — check if inline override bypasses it |
| 9 | **MEDIUM** | Hardcoded RGBA colors instead of theme tokens | throughout | Use `theme.palette.*` |
| 10 | **MEDIUM** | MoreVert icon `size="small"` no min dims | L598 | `sx={{ minWidth: 44, minHeight: 44 }}` |

---

### Search Page

#### SearchPage.jsx (926 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **MEDIUM** | Quick action buttons `size="small"` no `minHeight: 44` | L725-L745 | Add `minHeight: 44` |
| 2 | **LOW** | `minHeight: calc(100dvh - 64px)` uses desktop header height | L35 | Use `HEADER_HEIGHT_MOBILE` constant |
| 3 | **INFO** | Most UX delegated to SearchBar/FilterDrawer sub-components | — | Sub-components need separate audit |

---

### Contracts Page

#### ContractsPage.jsx (386 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Download IconButton `size="small"` no min dims | L357 | `sx={{ minWidth: 44, minHeight: 44 }}` |
| 2 | **HIGH** | iOS zoom — search field | L217 | Check for fontSize override |
| 3 | **MEDIUM** | `variant="h4"` title at fontWeight 700 (~34px bold) on mobile | L189 | `sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}` |
| 4 | **MEDIUM** | Card `boxShadow: '0 12px 24px ...'` overrides theme flat | L287 | Remove, let theme handle |
| 5 | **MEDIUM** | View Details & Refresh buttons default height | L199-L210, L350 | Theme already sets 44px — check overrides |

---

### Scheduling Page

#### SchedulingPage.jsx (903 lines)
| # | Severity | Issue | Line(s) | Fix |
|---|----------|-------|---------|-----|
| 1 | **HIGH** | Edit/Delete IconButtons `size="small"` ~28px | L164-L175 | `sx={{ minWidth: 44, minHeight: 44 }}` |
| 2 | **HIGH** | iOS zoom — search input | L656 | Check for fontSize override |
| 3 | **MEDIUM** | Hover `transform: translateY(-4px)` not gated by `@media(hover:hover)` | L96-L97 | Add hover media query |
| 4 | **MEDIUM** | Buttons with decorative `boxShadow: '0 2px 8px rgba(255,215,0,0.4)'` | L132, L146 | Remove |
| 5 | **MEDIUM** | Map fixed 500px height | L822 | `height: { xs: 300, md: 500 }` |
| 6 | **MEDIUM** | `variant="h4"` title unscaled | L631 | Use responsive fontSize |
| 7 | **MEDIUM** | ToggleButtonGroup 4 items tight on 375px | L679-L685 | Consider 2-row or Tabs |

---

## Cross-Cutting Systemic Issues

### 1. framer-motion Decorative Animations on Data Lists 🔴

**Files**: MessagingPage, ReviewsPage, MobileNav, HomeLanding, JobSearchPage  
**Impact**: Frame drops on scrolling through lists of 20+ items  
**Binance Pattern**: Zero animation on data lists — items render instantly  
**Fix**: Remove all `motion.div`, `AnimatePresence`, staggered delays from mapped list items  

### 2. Inline Style Overrides Defeating Theme 🔴

**Pattern**: Pages setting `fontSize: '0.875rem'` on inputs, `boxShadow` on cards, `borderRadius: 24px` on Papers  
**Impact**: Theme's mobile-optimized overrides get bypassed  
**Fix**: Remove inline overrides; let the centralized theme handle styling. Only add inline styles when intentionally deviating.

### 3. Decorative Effects (Gradients, Glow, Blur) 🟡

**Files**: PaymentCenterPage (glowPulse), ReviewsPage (card gradients), MessagingPage (bubble gradient), HomeLanding, JobsPage  
**Impact**: GPU-intensive rendering, battery drain, visual noise  
**Binance Pattern**: Solid backgrounds, no gradients except brand-specific CTAs  
**Fix**: Replace with solid theme colors

### 4. Above-Fold Content Waste 🟡

**Worst Offenders**:
- HomeLanding: 100vh hero = entire viewport before content
- JobsPage: Marketing sections + tall cards
- LoginPage: 240px branding before first input
- ProfilePage: 100px avatar centered

**Binance Pattern**: 80-100% of above-fold viewport is actionable content  
**Fix**: Reduce hero sizes, avatar sizes, branding space; hide marketing on mobile

### 5. Touch Target Gaps (IconButtons) 🟡

**Pattern**: `size="small"` IconButtons (~28-30px) without explicit 44px minimum  
**Files**: ReviewsPage, ContractsPage, SchedulingPage, SettingsPage  
**Note**: Theme sets `minHeight: 44px` for `MuiButton` but NOT for `MuiIconButton`  
**Fix**: Add global `MuiIconButton` override OR per-component fixes

### 6. Typography Overscaling 🟢

**Pattern**: `variant="h4"` (34px) used as page titles on mobile  
**Files**: ProfilePage, ContractsPage, SchedulingPage  
**Note**: Theme uses `clamp()` for h4: `clamp(1.125rem, 2.5vw, 1.75rem)` — already responsive  
**Mitigation**: The theme's clamp may already handle this. Verify actual rendered sizes at 375px.

---

## Prioritized Fix Plan

### Priority 1 — Dead Code Removal (10min, high impact)

1. **JobsPage.jsx**: Remove 7 dead keyframe animations and `HeroSection` styled component
   - Zero risk — they're unused
   - Reduces bundle size

### Priority 2 — Theme-Level Fixes (15min, fixes ALL pages)

1. **Add `MuiIconButton` override** in theme:
   ```js
   MuiIconButton: {
     styleOverrides: {
       root: {
         minWidth: 44,
         minHeight: 44,
       }
     }
   }
   ```
   This fixes touch targets in Reviews, Contracts, Scheduling, Settings simultaneously.

2. **Remove contained button gradient on mobile**:
   ```js
   MuiButton: {
     styleOverrides: {
       contained: {
         '@media (max-width: 599.95px)': {
           background: BRAND_COLORS.gold,
           boxShadow: 'none',
           '&:hover': {
             background: BRAND_COLORS.goldLight,
             boxShadow: 'none',
             transform: 'none',
           },
         },
       }
     }
   }
   ```

### Priority 3 — Remove framer-motion from Data Lists (30min)

1. **MessagingPage.jsx**: Remove `motion.div` from conversation cards (L494-L502) and message bubbles (L1001-L1006)
2. **ReviewsPage.jsx**: Remove `motion.div` from ReviewCards (L493-L498) and `AnimatePresence` (L1073)
3. **MobileNav.jsx**: Remove staggered animation from nav items

### Priority 4 — Remove Inline Decoration Overrides (30min)

1. **PaymentCenterPage**: Remove `glowPulse` animation (L424-L427), glow dialog (L1087-L1096), wallet gradient (L80-L85)
2. **ReviewsPage**: Remove card gradients (L499-L502), `::before` bars (L508-L522)
3. **MessagingPage**: Remove bubble gradient (L1046-L1048)
4. **SchedulingPage**: Remove button boxShadow (L132, L146)

### Priority 5 — Input fontSize Override Cleanup (20min)

Audit and remove any `inputProps={{ style: { fontSize: '0.875rem' } }}` or similar overrides that defeat the theme's `16px` default. Files to check:
- MessagingPage (L1475)
- PaymentCenterPage (L867-L882, L1098-L1114)  
- WalletPage (L85-L95)
- WorkerProfileEditPage (L778-L870 — all 15+ inputs)

### Priority 6 — Above-Fold Optimization (45min)

1. **HomeLanding**: Reduce hero to `min(50vh, 400px)`, section padding `py: { xs: 3 }`
2. **LoginPage**: Logo 40px, remove trade chips, reduce spacing
3. **JobsPage**: Hide marketing sections on mobile, card `minHeight: 'auto'`
4. **JobDetailsPage**: Map below description on mobile
5. **ProfilePage**: Avatar 64px, inline with name

### Priority 7 — Remaining Per-Page Fixes (45min)

- Dashboard metric cards: height 72px
- Dashboard breadcrumb/refresh bar: hide on xs
- HirerDashboard SpeedDial z-index: 1100
- SchedulingPage map: `height: { xs: 300, md: 500 }`
- ContractsPage card boxShadow: remove override
- Various `borderRadius` overrides: remove (let theme handle)

---

## Pages That Pass Binance Audit ✅

| Page | Notes |
|------|-------|
| NotificationsPage | Clean, no decorations, correct safe-area handling |
| SettingsPage | Minimal, flat, good density (minor IconButton fix needed) |
| MyApplicationsPage | Good clearance, safe-area top, clean cards |

## Health Score

| Category | Score | Notes |
|----------|-------|-------|
| Theme Foundation | 8/10 | Strong global overrides, missing IconButton fix |
| Layout System | 9/10 | Excellent — wrapper handles bottom nav for all pages |
| Data Density (Binance-like) | 5/10 | Too much decorative space, large heroes/avatars |
| Animation Discipline | 3/10 | framer-motion on data lists is the #1 mobile perf issue |
| Decoration Control | 4/10 | Inline gradients/glows/shadows bypass good theme defaults |
| Touch Accessibility | 7/10 | Buttons good via theme, IconButtons need fix |
| iOS Compatibility | 6/10 | Theme sets 16px but pages override it back to smaller |

**Overall Mobile UX Health: 6.0/10**  
**Target (Binance-level): 9/10**

---

## Implementation Order

```
Week 1: Priority 1-3 (Dead code + Theme fixes + framer-motion removal)
Week 2: Priority 4-5 (Decorations + Input fixes)
Week 3: Priority 6-7 (Above-fold + Per-page fixes)
```

Total estimated effort: ~3-4 hours of focused implementation.
