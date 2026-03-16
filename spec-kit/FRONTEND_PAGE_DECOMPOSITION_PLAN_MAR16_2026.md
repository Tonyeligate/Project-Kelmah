# Frontend Page Decomposition Plan (March 16, 2026)

## Objective
Reduce UI regression risk by splitting the largest route-mounted pages into smaller, testable sections with stable contracts.

## Priority Targets
1. kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx (2801 lines)
2. kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx (2448 lines)
3. kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx (1505 lines)
4. kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx (1495 lines)
5. kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx (1458 lines)

## Decomposition Architecture

### Phase 1: JobsPage (highest impact)
- Extract `JobsFilterBar` component
- Extract `JobsResultsSection` component
- Extract `JobsAlertControls` component
- Extract `JobsEmptyState` component
- Keep page shell responsible only for route params, redux dispatch wiring, and section composition
- Add focused tests:
  - filter state -> query param sync
  - role CTA routing correctness
  - infinite/normal pagination guard behavior

### Phase 2: MessagingPage
- Extract `ConversationListPanel`
- Extract `ConversationThreadPanel`
- Extract `MessageComposer`
- Extract `MessagingDeepLinkResolver` hook
- Isolate upload/preview lifecycle into `useMessageAttachments`
- Add focused tests:
  - deep-link resolver contract (`conversation`, `recipient`)
  - cleanup behavior for blob URLs/timeouts
  - mobile drawer/list-thread transitions

### Phase 3: ApplicationManagementPage
- Extract `ApplicationsToolbar`
- Extract `ApplicationsSummaryCards`
- Extract `ApplicationsTableDesktop`
- Extract `ApplicationsCardsMobile`
- Extract `ApplicationDetailsDialog`
- Add focused tests:
  - URL state synchronization (`tab`, `page`, `limit`, `sort`)
  - mobile card action parity with desktop table actions

### Phase 4: SkillsAssessmentPage
- Extract `AssessmentOverviewHeader`
- Extract `AssessmentQuestionRenderer`
- Extract `AssessmentProgressRail`
- Extract `AssessmentResultsPanel`
- Add focused tests:
  - progress and completion transitions
  - responsive render parity of assessment controls

### Phase 5: JobPostingPage
- Extract `JobPostingStepLayout`
- Extract `JobBasicsStep`
- Extract `BudgetAndTimelineStep`
- Extract `ReviewAndPublishStep`
- Add focused tests:
  - step validation boundaries
  - mobile fixed footer action placement

## Shared Guardrails
- Keep behavior unchanged during extraction (no product logic rewrites in decomposition PRs)
- Enforce one-directional data flow: page container -> section props -> callbacks
- Extract shared constants for spacing, route aliases, and mobile fixed-offset values
- Add route smoke assertions whenever navigation logic moves

## Delivery Plan
- Sprint A:
  - Phase 1 + Phase 3 (highest routing and UX regression surfaces)
- Sprint B:
  - Phase 2 (messaging stability) + Phase 5 (job creation reliability)
- Sprint C:
  - Phase 4 + cleanup pass on legacy/unmounted page surfaces

## Success Criteria
- Each target page reduced below 900 lines
- No route smoke regressions
- No build regressions
- Mobile layout checks pass at 320/360/390/768 for affected pages
