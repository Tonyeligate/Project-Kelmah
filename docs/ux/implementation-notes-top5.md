# Implementation Notes — Top 5 Improvements

This file lists concrete, small changes to improve UX for the top 5 prioritized areas, mapped to existing files for quick PR work.

1) Mobile Bottom Tab Bar — `MobileBottomNav.jsx`
- File: [kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx](kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx#L1-L200)
- Quick wins:
  - Ensure `minHeight`/`minWidth` values match strict tap-target audit (>=44px) for `.MuiBottomNavigationAction-root` and nested inputs; add explicit vertical padding where MUI `size="small"` is used elsewhere.
  - Add an explicit ARIA label for the Post Job tab and quick-action long-press menu (quick post/photo/voice).
  - Add unit tests for the route-to-tab mapping (smoke tests already reference this component).

2) Fast Onboarding (Hirers) — `Register.jsx` and `MobileRegister`
- File: [kelmah-frontend/src/modules/auth/components/register/Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L1-L80)
- Quick wins:
  - Add a "Skip and Browse" CTA on step 0 that saves role=hirer and allows browsing/posting a draft job.
  - Make phone verification optional until first booking; surface magic-link option prominently.
  - Shorten field list for mobile by hiding non-essential fields behind "Tell us later".

3) Job Posting Wizard — `JobPostingPage.jsx`
- File: [kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx](kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx#L1-L1200)
- Quick wins:
  - Ensure progress indicator is visible on small screens; collapse preview to bottom sheet on <420px.
  - Expose a clear "Quick Post" flow that fills Title + Category + ASAP + Budget and publishes as a draft.
  - Validate category autocomplete to permit local-language keywords and common misspellings.

4) Book Now flow — `HirerQuickJobTrackingPage.jsx` (and related job detail pages)
- Files to inspect: [kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx](kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx#L1)
- Quick wins:
  - Add a lightweight booking confirmation modal with ETA, price summary, cancellation policy.
  - Show clear next steps after booking (e.g., "Worker will confirm in X minutes; we’ll SMS you").
  - Add an SMS fallback if in-app notifications are missed.

5) Mobile Money Payments — `PaymentMethodsPage.jsx` and `paymentService`
- File: [kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx](kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx#L1-L120)
- Quick wins:
  - Add provider-specific helper text for MTN/Vodafone/AirtelTigo (what the user will see during confirmation).
  - In checkout flows, if `mobile_money` is selected, show an intermediate screen describing the provider confirmation steps (OTP/USSD) and expected transaction reference format.
  - Add sandbox wiring for developers to simulate MoMo flows during local testing.

Next actions
- I can generate the markdown copy bundles and create low-fi PNG wireframes for each screen (mobile 360px) and commit them to `docs/ux/artifacts/`.
- Or I can open PR-ready branches with the small code changes above (one change per branch) and include tests where noted.
