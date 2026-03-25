# Mobile Native Hardening Backlog

**Date**: March 9, 2026

## Priority 1
- Add native tests around degraded recommendation state so Android and iOS cannot silently regress back to urgent fallback being presented as personalized matching.
- Add backend tests for `GET /api/users/me/profile-signals` and `GET /api/jobs/recommendations/personalized` to lock the mobile-facing envelope and metadata.
- Normalize notification ordering on both native clients with local timestamp sorting before rendering "recent alerts".

## Priority 2
- Reduce realtime refresh cost by applying incremental message/notification updates from socket events instead of refetching full lists after every signal.
- Expand the mobile recommendation contract to expose recommendation quality or degradation flags directly from the backend so clients can distinguish "no matches" from "matching unavailable" without heuristic fallback.
- Strengthen password policy and account-security UX on both native apps to align with marketplace-grade auth expectations.

## Priority 3
- Add richer worker profile signals for recommendations, including credential counts, featured portfolio coverage, and freshness timestamps for availability/profile completeness.
- Tighten native job parsers further by rejecting malformed ranking-critical fields instead of defaulting weak data into valid-looking matches.
- Restore full native CI validation by fixing the blocked macOS GitHub Actions path or providing an alternative signed remote build lane.