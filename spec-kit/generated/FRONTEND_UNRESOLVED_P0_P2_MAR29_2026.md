# Frontend Strict Unresolved List (P0-P2) - March 29, 2026 (Refreshed)

Scope: Current code + tracker state only. No repeated closed findings.

## P0 (Critical)

None active after the March 29 hardening pass.

Verification snapshot:
- Remaining `minHeight/minWidth: 40` matches are non-action layout/text uses (for example, list-icon columns and text-height balancing), not tap/click controls.

## P1 (High impact)

None active after the March 29 spacing + sticky-token pass.

Verification snapshot:
- `PageCanvas` spacing in previously flagged pages is now normalized or intentionally route-specific:
  - `kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobAlertsPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobApplicationPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
  - `kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx`
  - `kelmah-frontend/src/modules/payment/pages/PaymentSettingsPage.jsx`
- Sticky top-offsets and z-indexes in target jobs/worker/payment/hirer/contracts route pages are now tokenized with shared layout constants (`HEADER_HEIGHT_MOBILE`, `STICKY_CTA_HEIGHT`, `BOTTOM_NAV_HEIGHT`, `Z_INDEX`).

## P2 (Important maintainability)

None active after stale-evidence reconciliation.

Verification snapshot:
- `JobDetailsPage` now uses named breakpoint token wiring rather than raw pixel hook usage:
  - `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx:336` uses `useBreakpointDown('mobileCompact')`.
- Theme-level compact breakpoint token remains explicitly defined and governed:
  - `kelmah-frontend/src/theme/index.js:77`
  - `kelmah-frontend/src/theme/JobSystemTheme.js:110`
- Frontend source scan found no remaining `useMaxWidth(` usage across `kelmah-frontend/src/**`.

## Closed in this pass

- Tracker rows moved to Done with checklist evidence:
  - `W2-08`, `W2-09`, `W2-10`
- Additional code hardening completed:
  - `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx`
  - `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx`
  - `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx`
  - `kelmah-frontend/src/modules/messaging/components/common/EmojiPicker.jsx`
  - `kelmah-frontend/src/modules/messaging/components/common/ConversationList.jsx`
  - `kelmah-frontend/src/modules/worker/components/SkillsVerificationPanel.jsx`
  - `kelmah-frontend/src/modules/worker/components/CertificateManager.jsx`
  - `kelmah-frontend/src/modules/worker/components/AdvancedCalendar.jsx`
  - `kelmah-frontend/src/modules/worker/pages/MyBidsPage.jsx`
  - `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx`
  - `kelmah-frontend/src/modules/common/components/forms/SearchForm.jsx`
  - `kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx`
  - `kelmah-frontend/src/modules/common/components/cards/JobCard.jsx`
- Spacing and sticky tokenization closure completed in:
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobAlertsPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/MyBidsPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
  - `kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx`
  - `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx`
  - `kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx`
  - `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx`
  - `kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx`
  - `kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx`
