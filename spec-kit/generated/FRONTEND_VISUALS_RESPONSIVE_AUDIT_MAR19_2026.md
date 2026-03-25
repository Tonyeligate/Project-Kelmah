# Frontend Visuals & Responsive Audit (March 19 2026)

This audit focuses on the **visual presentation**, **responsiveness**, and **display polish** of the Kelmah frontend across **mobile and desktop**. It is based on a scan of key UI components, layout patterns, and responsive code paths (breakpoints, grid layouts, `sx` styling, and media-query logic).

---

## 🔎 Key Findings (Code Signals & Patterns)

### 1) Inconsistent responsive strategy across components
- Multiple components use `useMediaQuery(theme.breakpoints.down('md'))`, `down('sm')`, and raw `(max-width: 768px)` strings (e.g., `WorkerProfile.jsx`), indicating mixed responsive logic.
- Some pages (e.g., `HomeLanding.jsx`) use fine-grained `Grid` breakpoints; others manually adjust padding/margins with hard-coded pixel values.

### 2) Inline styling via `sx={{ ... }}` is prevalent
- The `App.jsx` layout and numerous pages (e.g., `ResetPassword.jsx`, `gracefulDegradation.js`) use `sx` with fixed widths/heights and mixed `px`/`%` units.
- This creates risk of inconsistent spacing across breakpoints and makes theme-driven design harder to enforce.

### 3) Missing or weak responsive layout for long content
- Many `Grid item` configurations (e.g., on `HomeLanding`, `WorkerProfileEditPage`) are complex; without strict max-width constraints, content could overflow on narrow viewports.
- `JobSearchPage.jsx` has multiple breakpoint checks, suggesting the UX is already complex and likely fragile.

### 4) Visual consistency issues likely in typography and spacing
- Some components (e.g., `ResetPassword.jsx`) hardcode typography weights and spacing (`mt: 2`, `minHeight: 48`, etc.) rather than leveraging design tokens.
- There is no single source of truth for spacing scale, leading to inconsistent margins/paddings across screens.

### 5) Potential performance issues due to layout thrashing
- `useMediaQuery` is used in many components, which can trigger re-renders on resize. Some of these components are heavy (profile, job list), risk of jank on low-end devices.

---

## ✅ Priority Fixes (High Impact, Quick Wins)

1. **Standardize responsive breakpoints** into a shared utility (e.g., `useIsMobile()`, `useIsTablet()`) and migrate components to use it.
2. **Audit all `sx` inline styles** for hard-coded dimensions (px values) and replace with theme spacing / breakpoints / responsive arrays.
3. **Establish a responsive grid pattern** for key pages (HomeLanding, JobSearch, WorkerProfile, Dashboard) and apply consistent column/spacing rules.
4. **Create a design token file** for spacing, font sizes, and elevations; use it across all components instead of `mt: 2`, `fontSize: '1.25rem'`, etc.
5. **Add a visual regression test harness** (Storybook + chromatic, Percy, or similar) to catch layout regressions across breakpoints.

---

## 🔧 Remediation Directions (How to Fix)

### A) Consolidate responsive utilities
- Create `src/utils/responsive.js` with hooks: `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`, and `useBreakpointValue()`.
- Replace ad-hoc `useMediaQuery(theme.breakpoints.down(...))` with the shared hooks.

### B) Convert `sx` hard-coded values into theme tokens
- Define spacing scale in `src/theme/JobSystemTheme.js` (e.g., `spacing` array and `typography` scales).
- Replace `sx={{ mt: 2 }}` with `sx={{ mt: (theme) => theme.spacing(2) }}` or `sx={{ mt: 'spacing.2' }}` as consistent.

### C) Add responsive layout QA
- Add Storybook stories for critical screens (Job list, Worker profile, Messaging) with viewport knobs.
- Run axe accessibility checks at each viewport size.

---

## 🔭 Next Audit Focus (Pick one)
- ✅ **Mobile vs Desktop layout breakpoints**: Validate `Grid`/`Box` logic across breakpoints, verify no horizontal scroll.
- ✅ **Typography & spacing consistency**: Ensure all pages use theme typography tokens and spacing system.
- ✅ **Visual hierarchy and color usage**: Check that buttons, cards, and navigation have consistent UI states and contrast.

Tell me which direction you want next, or I can immediately generate the next 1,000-item backlog focused strictly on *visual/responsive UI improvements*.  (We can also continue expanding toward the "1 million" backlog goal.)
