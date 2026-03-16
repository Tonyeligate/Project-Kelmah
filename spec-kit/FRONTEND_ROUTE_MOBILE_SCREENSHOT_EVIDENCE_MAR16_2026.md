# Frontend Route + Mobile Screenshot Evidence (March 16, 2026)

## Capture Run
- Tooling: Playwright (Chromium)
- Base URL: http://127.0.0.1:4173
- Widths: 320, 360, 390, 768
- Evidence JSON: kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/evidence.json
- Screenshot root: kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/

## Verified Checks

### A) Public support pages are not rendered with dashboard bottom nav
- Result: PASS at 320/360/390/768 for:
  - /support
  - /support/help-center
  - /help
  - /docs
  - /community
- Evidence signals:
  - `bottomNavPresent: false` in all route-capture records for these paths
- Screenshot samples:
  - kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w320/support.png
  - kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w390/support-help-center.png
  - kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w768/help-alias.png

### B) Public profile alias route uses public shell behavior
- Path tested: /profile/000000000000000000000000
- Result: PASS at 320/360/390/768 (`bottomNavPresent: false`)
- Screenshot samples:
  - kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w320/profile-alias-public.png
  - kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w768/profile-alias-public.png

### C) Support CTA query-contract cleanup
- Check 1: Contact Support CTA should not append `tab=support`
  - Result: PASS
  - Final URL: http://127.0.0.1:4173/login
  - Query present: `hasQueryTab: false`
  - Screenshot: kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w390/support-contact-cta.png
- Check 2: View Documentation CTA should not append `category=support`
  - Result: PASS
  - Final URL: http://127.0.0.1:4173/docs
  - Query present: `hasQueryCategory: false`
  - Screenshot: kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/w390/support-docs-cta.png

## Constraint Notes
- NearbyJobs floating refresh button fix is implemented in source with shared bottom-nav constant + safe-area expression.
- Visual runtime proof of NearbyJobs FAB placement is blocked in this local pass by authenticated worker-flow dependency and backend-auth coupling in the current dev environment.
- Source-level fix reference:
  - kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx

## Validation Summary
- Routed smoke tests: PASS (15/15)
- Frontend build: PASS
