# Frontend Visual Backlog Remap Proposal (Items 10001-11000)

Date: March 23, 2026
Scope: Remap the 23 non-existent filename targets from the visual backlog to concrete, existing frontend files so execution can proceed directly.

## Remap Matrix

| Non-existent backlog filename | Primary existing target | Secondary existing targets | Why this remap is valid |
|---|---|---|---|
| Button.jsx | kelmah-frontend/src/modules/layout/components/header/HeaderStyles.js | kelmah-frontend/src/modules/common/components/layout/PageHeader.jsx; kelmah-frontend/src/modules/auth/components/common/AuthWrapper.jsx | Centralized button styling/behavior and high-traffic CTA surfaces already live here. |
| Typography.jsx | kelmah-frontend/src/theme/index.js | kelmah-frontend/src/modules/common/components/layout/PageHeader.jsx; kelmah-frontend/src/pages/HomeLanding.jsx | Typography tokens are theme-driven, with major hierarchy usage in page headers and landing hero sections. |
| PostContent.jsx | kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx | kelmah-frontend/src/modules/messaging/components/common/MessageList.jsx | Long-form user-facing content and readability patterns are implemented in job detail and messaging content surfaces. |
| WorkerDashboard.jsx | kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx | kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx | Worker dashboard implementation exists as page component with real responsive and feedback logic. |
| Card.jsx | kelmah-frontend/src/modules/common/components/cards/JobCard.jsx | kelmah-frontend/src/modules/search/components/results/WorkerSearchResults.jsx | Shared card behavior and card-heavy result UI are handled in these existing components. |
| ListItem.jsx | kelmah-frontend/src/modules/messaging/components/common/ConversationList.jsx | kelmah-frontend/src/modules/settings/pages/SettingsPage.jsx | List interaction density, tap-target, and state styling are concentrated in messaging/settings list items. |
| ModalDialog.jsx | kelmah-frontend/src/modules/common/components/common/ConfirmDialog.jsx | kelmah-frontend/src/modules/jobs/components/common/CreateJobDialog.jsx; kelmah-frontend/src/modules/hirer/components/ApplicationDecisionDialog.jsx | Dialog accessibility and visual consistency are already encapsulated in reusable confirm/create decision dialogs. |
| FiltersPanel.jsx | kelmah-frontend/src/modules/jobs/components/common/JobFilters.jsx | kelmah-frontend/src/modules/jobs/components/common/SearchFilters.jsx; kelmah-frontend/src/modules/search/components/common/MobileFilterDrawer.jsx | Existing filter panels/drawers cover desktop and mobile filter UX. |
| ProfileAvatar.jsx | kelmah-frontend/src/modules/profile/components/ProfilePicture.jsx | kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx; kelmah-frontend/src/modules/hirer/pages/HirerProfilePage.jsx | Avatar rendering, fallback, and profile image states are implemented here. |
| Tabs.jsx | kelmah-frontend/src/modules/settings/pages/SettingsPage.jsx | kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx; kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx | Tabs are implemented across high-use settings/payment/application workflows. |
| Snackbar.jsx | kelmah-frontend/src/App.jsx | kelmah-frontend/src/components/common/OfflineBanner.jsx; kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx | Global + local feedback toasts/snackbars are implemented in these files. |
| DarkModeToggle.jsx | kelmah-frontend/src/theme/ThemeProvider.jsx | kelmah-frontend/src/modules/layout/components/Header.jsx; kelmah-frontend/src/modules/layout/components/Layout.jsx | Theme mode state and toggle controls are already implemented in provider/layout/header. |
| WorkerGallery.jsx | kelmah-frontend/src/modules/worker/components/ProjectGallery.jsx | kelmah-frontend/src/modules/worker/components/PortfolioManager.jsx; kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx | Worker media/gallery behavior exists under portfolio/project gallery flows. |
| Banner.jsx | kelmah-frontend/src/pages/HomeLanding.jsx | kelmah-frontend/src/components/common/OfflineBanner.jsx; kelmah-frontend/src/modules/auth/components/common/AuthWrapper.jsx | Banner-like hero and notification banner surfaces are already present. |
| ProfileHeader.jsx | kelmah-frontend/src/modules/common/components/layout/PageHeader.jsx | kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx; kelmah-frontend/src/modules/hirer/pages/HirerProfilePage.jsx | Reusable header patterns and profile top-sections are implemented in these components. |
| FocusRing.jsx | kelmah-frontend/src/theme/index.js | kelmah-frontend/src/theme/JobSystemTheme.js; kelmah-frontend/src/modules/layout/components/Header.jsx | Focus-visible behavior is theme-driven with local control overrides in high-interaction components. |
| Tooltip.jsx | kelmah-frontend/src/modules/layout/components/Header.jsx | kelmah-frontend/src/modules/common/components/layout/PageHeader.jsx; kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx | Tooltip usage density and interaction patterns are already established in these files. |
| SkipLink.jsx | kelmah-frontend/src/modules/layout/components/Layout.jsx | kelmah-frontend/src/App.jsx; kelmah-frontend/src/modules/layout/components/Header.jsx | Skip-link behavior should be anchored at global layout and top navigation entry points. |
| FormField.jsx | kelmah-frontend/src/modules/settings/components/common/AccountSettings.jsx | kelmah-frontend/src/modules/settings/components/common/SecuritySettings.jsx; kelmah-frontend/src/modules/settings/components/common/NotificationSettings.jsx | Form controls and validation states are concentrated in settings form modules. |
| PageTransition.jsx | kelmah-frontend/src/modules/layout/components/Layout.jsx | kelmah-frontend/src/App.jsx; kelmah-frontend/src/modules/common/components/RouteErrorBoundary.jsx | Route-level page orchestration and transition-friendly wrappers are maintained in layout/app boundary files. |
| SkeletonLoader.jsx | kelmah-frontend/src/modules/common/components/loading/LoadingScreen.jsx | kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx; kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx | Shared and page-local skeleton loading patterns already exist in these components. |
| Carousel.jsx | kelmah-frontend/src/modules/auth/components/common/AuthWrapper.jsx | kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx | Existing slideshow/carousel-like behavior and card-slider UX are implemented here. |
| InfiniteScroll.jsx | kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx | kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx; kelmah-frontend/src/modules/messaging/components/common/MessageList.jsx | Infinite/paginated load-more behaviors already exist via viewport sentinel and message history loading. |

## Execution Guidance

- Treat each remap row as the new canonical target for the related backlog item cluster.
- Use the primary target first; use secondary targets when the issue is cross-surface (desktop + mobile, or page + reusable component).
- Keep response verification unchanged: build plus smoke suites after each batch.

## Verification Context

- Existing filename mappings fixed earlier: 12
- Non-existent mappings remapped in this proposal: 23
- Total original filename mappings: 34
