# Registration Flow Audit – November 19, 2025

## Objective
Document the current state of Kelmah's desktop (`Register.jsx`) and mobile (`MobileRegister.jsx`) registration experiences to prepare for the UX + state management redesign requested (schema-driven form, Redux-aligned auth workflow, and productivity aids like autosave + guided steps).

## Files Reviewed
- `kelmah-frontend/src/modules/auth/components/register/Register.jsx`
- `kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx`
- `kelmah-frontend/src/modules/auth/services/authSlice.js`
- `kelmah-frontend/src/modules/auth/services/authService.js`

## Current Implementation Snapshot
- **Desktop**: Custom multi-step wizard using local `useState` fields, home-grown validation, and manual draft persistence in `secureStorage`. Steps: account type → personal details → security → confirmation. Submission dispatches `registerAction` thunk and redirects to `/login`.
- **Mobile**: Single-page progressive form with inline sections. Uses similar local state, custom validators (phone/password helpers), and role-based field rendering. Adds worker "trades" selection and animated UI states.
- **Redux/Auth**: `authSlice.register` thunk persists tokens + normalized user to `secureStorage`. Desktop + mobile components call the same thunk but do not share schema/validation utilities.

## Key Gaps vs. Target Brief
1. **Schema Duplication** – Both components maintain their own validation logic (regex + manual checks). No shared schema (zod/yup) or react-hook-form integration, making consistency + localization difficult.
2. **State Fragmentation** – Desktop wizard stores each field in individual state variables and manual draft persistence. Mobile form maintains an object but still performs imperative validation. Neither reuses a shared hook.
3. **Role-Specific Data** – Mobile flow asks workers for `trades`, but desktop wizard lacks skills/trade capture, leading to asymmetry at the API level.
4. **UX Divergence** – Desktop uses Stepper + Save Draft CTA; mobile focuses on single-page animation. Neither offers a consolidated experience across breakpoints.
5. **Feedback / Error Handling** – Both rely on component-level error strings without leveraging a centralized error mapper from `authSlice`. Success feedback diverges (desktop immediate redirect, mobile shows success card first).

## Data Flow Notes
```
User Input → Local component state → validateStep()/validateForm() → dispatch(registerAction)
            ↓                                                ↓
 secureStorage draft (desktop only)               authSlice.register → authService.register → API /api/auth/register
```
- No react-hook-form controllers; manual field wiring.
- Password strength meters differ (color schemes vs. numeric thresholds) but both rely on local helper functions.
- `secureStorage` draft is desktop-only and stores limited fields (no password, no worker trades), so returning users on mobile lose progress.

## Upcoming Work Targets
1. Introduce a shared schema + hook layer (e.g., `useRegistrationForm`) that both desktop/mobile consume.
2. Align worker-specific questions (skills/trades, experience, availability) across breakpoints.
3. Replace manual validation + `useState` fields with react-hook-form + zod/resolver for deterministic errors.
4. Unify success/error UX (confirmation step, success banner, redirect timing) so Redux outcomes feel consistent.
5. Extend draft persistence to cover the full form payload (excluding sensitive fields) and share between layouts via secureStorage or Redux slices.

## Next Steps
- Map each existing step/section to the future schema to identify required fields + optional enhancements.
- Define the shared validation schema + default values.
- Plan component decomposition (Stepper shell, shared field groups, CTA/footer, autosave hook).
- Update STATUS_LOG.md as milestones are completed.

## Progress Log (Nov 19)
- Shared schema + helper hook implemented (`registrationSchema.js`, `registrationDraftStorage.js`, `useRegistrationForm.js`) with autosave + password strength metadata to unblock the Register/MobileRegister refactors.
