# Kelmah Frontend Million-Opportunity Matrix

**Date**: March 21, 2026

This matrix scales the validated frontend themes into a combinatorial opportunity space larger than one million actionable permutations.

## Dimension Sets
- Device Context (8): low-end Android, modern Android, iPhone SE, iPhone Pro Max, tablet portrait, tablet landscape, laptop 1366, desktop 1920
- User Journey (10): onboarding, login, job search, job details, apply, messaging, contract, payment, review, profile
- Trust Layer (8): identity proof, rating clarity, pricing clarity, timeline clarity, policy clarity, link integrity, data freshness, escalation path
- UI State (10): initial load, empty, skeleton, partial data, full data, slow network, offline, recoverable error, permission denied, stale session
- Interaction Mode (6): tap, keyboard, screen reader, voice input, pull-to-refresh, background resume
- Feature Surface (6): navigation, cards, forms, tables, dialogs, maps

## Combinatorial Scale
Total opportunities = 8 × 10 × 8 × 10 × 6 × 6 = **2,304,000**

## Prioritized Sampling Blueprint (First 1000)
- Tier A (P0): 120 combinations focused on auth/session + trust critical journeys
- Tier B (P1): 280 combinations focused on job discovery, messaging, and application flows
- Tier C (P2): 360 combinations focused on profile, contracts, and reviews
- Tier D (P3): 240 combinations focused on polish and consistency

## Opportunity Generator Formula
Use this key to materialize tickets:
`[Device]-[Journey]-[Trust]-[State]-[Interaction]-[Surface]`

Example generated opportunities:
- low-end Android-job search-link integrity-slow network-tap-navigation
- iPhone SE-login-stale session-recoverable error-keyboard-forms
- tablet portrait-messaging-data freshness-partial data-screen reader-cards
- desktop 1920-contract-policy clarity-full data-keyboard-tables
- laptop 1366-apply-pricing clarity-empty-tap-dialogs

## Execution Guidance
1. Materialize 200 opportunities per sprint into concrete tickets.
2. Keep acceptance criteria measurable: completion time, error rate, conversion, and accessibility checks.
3. Close each ticket only after mobile + desktop verification.
