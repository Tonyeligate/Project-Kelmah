# Top 5 UX Specs — Kelmah (summary)

Brief, actionable UX specs for the five high-impact items we agreed to prioritize.

1) Mobile Bottom Tab Bar (Primary Nav)
- Objective: One-tap access to Home, Search/Find, Post Job (primary CTA), Messages, Profile.
- Files: [kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx](kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx#L1-L200)
- Key acceptance:
  - Tabs present and order matches role (hirer vs worker).
  - Tap targets >= 44px; message badge shows unread count.
  - Post Job is visually emphasized (center, elevated).

2) Fast Onboarding (Hirers)
- Objective: Let hirers browse or create a job in <60s with minimal friction.
- Files: [kelmah-frontend/src/modules/auth/components/register/Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L1-L80)
- Key acceptance:
  - Role selection up-front (hirer vs worker).
  - Minimal required fields (phone + city) for browsing/posting a draft.
  - Progressive profile completion and optional magic-link/SMS verification.

3) Job Posting Wizard (Progressive Steps)
- Objective: Guide hirers through a short, trade-aware multi-step flow that autosaves drafts.
- Files: [kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx](kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx#L1-L1200)
- Key acceptance:
  - Steps 1–5 shown with progress indicator; autosaves draft to localStorage.
  - Trade-specific hints, budget presets, and image upload validations.

4) Book Now Flow (Confirm Booking)
- Objective: Convert discovery into confirmed bookings with transparent fees and ETA.
- Files to inspect / extend: [kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx](kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx#L1)
- Key acceptance:
  - Booking modal shows price, arrival window, cancellation policy, and contact options.
  - Booking state flows from Pending → Confirmed and notifies both parties.

5) Mobile Money Payments (MTN MoMo, AirtelTigo, Vodafone)
- Objective: Support local payment methods for faster conversions.
- Files: [kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx](kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx#L1-L120)
- Key acceptance:
  - Add mobile money as a payment method; show provider and phone number.
  - Checkout uses chosen mobile money method with provider-specific UX (OTP/USSD/sandbox).

Assets to produce next (optional):
- Low-fidelity PNG wireframes for each screen (mobile 360px width).  
- Copy bundle (button labels, SMS text, microcopy) in `/docs/ux/copy/top5-copy.md`.
