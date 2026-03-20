# Kelmah Frontend Prioritized Execution Plan

**Date**: March 19, 2026

**Purpose**: Turn the highest-value items from the frontend improvement backlog into an executable order of work.

**Prioritization rule**: Fix user-blocking crashes and workflow failures first, then route and shell issues, then high-friction interaction polish, then broader optimization and accessibility hardening.

## P0 - Must Fix First
1. Worker profile edit safety.
   - Prevent object-as-child rendering crashes.
   - Normalize all skill payloads before display and submit.
   - Verify profile save flow on mobile and desktop.
2. Messaging thread stability.
   - Keep thread deep-links, unread badges, and composer flow stable.
   - Preserve legacy route compatibility while eliminating blank or broken chat states.
   - Verify message list, thread open, send, attach, and back-navigation paths.
3. Job application flow reliability.
   - Keep apply flow stable from job detail into submission.
   - Protect validation, attachment upload, and success/error states.
   - Verify no lost drafts or duplicate submissions.
4. Payments and wallet continuity.
   - Keep balance, escrow, payout, and transaction views readable and actionable.
   - Verify payout and payment-method flows do not trap the user.
   - Ensure error recovery is visible and specific.

## P1 - High Impact Next
5. Jobs discovery quality.
   - Improve search, filters, sort, and result clarity.
   - Make job cards scannable on mobile.
   - Verify no-results and loading states are useful.
6. Worker and hirer dashboard clarity.
   - Keep KPI cards, quick actions, and task queues prominent.
   - Remove hidden or cramped actions on small screens.
   - Verify dashboards work as command centers, not generic panels.
7. Navigation and shell correctness.
   - Keep header, sidebar, and bottom nav in sync with role and route.
   - Avoid shell misclassification and broken aliases.
   - Verify responsive collapse and active states.
8. Profile viewing trust cues.
   - Keep profile header, skills, reviews, and trust badges readable.
   - Make verification signals prominent.
   - Verify action paths from view profile into contact or hire.

## P2 - Usability and Conversion
9. Home landing conversion flow.
   - Strengthen primary CTAs, hero trust, and category browsing.
   - Make the first-screen path obvious for both hirers and workers.
10. Help and support clarity.
   - Make support content easy to find and actionable.
   - Reduce dead-end states and unsupported query links.
11. Reviews and reputation comprehension.
   - Keep rating summaries and feedback forms simple.
   - Expose moderation states and trust badges clearly.
12. Notifications usefulness.
   - Improve unread prioritization and settings discoverability.

## P3 - Hardening and Scale
13. Accessibility baseline.
   - Keep contrast, labels, focus states, and keyboard flow consistent.
14. Performance budget.
   - Reduce heavy page weight and improve mobile loading behavior.
15. Empty states and loading states.
   - Make every dead-end informative and recoverable.
16. Touch target quality.
   - Ensure mobile controls are easy to tap in all primary workflows.

## Delivery Order
1. Worker profile edit
2. Messaging
3. Job application
4. Payments and wallet
5. Jobs discovery
6. Dashboards
7. Navigation and shell
8. Profile trust cues
9. Home landing
10. Support, reviews, notifications
11. Accessibility and performance hardening

## Verification Gate
- Build the frontend after each P0 or P1 group.
- Run route smoke tests for messaging, jobs, profile, and payments after changes.
- Confirm mobile behavior at 320/360/390/768 widths before closing a ticket.
