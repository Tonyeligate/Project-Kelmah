# Kelmah Frontend Backlog - Worker Profile

**Date**: March 19, 2026

**Source**: Extracted from `spec-kit/generated/FRONTEND_1000_ITEM_BACKLOG_MAR18_2026.md`

## Prioritized Worker Profile Plan

### P0
1. Worker Profile Edit - Bio editor across 320/360/390/768/desktop.
2. Worker Profile Edit - Skill editor across 320/360/390/768/desktop.
3. Worker Profile Edit - Save state across 320/360/390/768/desktop.
4. Worker Profile Edit - Error state across 320/360/390/768/desktop.
5. Worker Profile View - Profile header across 320/360/390/768/desktop.
6. Worker Profile View - Skill chips across 320/360/390/768/desktop.
7. Worker Profile View - Trust badges across 320/360/390/768/desktop.

### P1
8. Worker Profile Edit - Portfolio upload across 320/360/390/768/desktop.
9. Worker Profile Edit - Availability editor across 320/360/390/768/desktop.
10. Worker Profile Edit - Validation copy across 320/360/390/768/desktop.
11. Worker Profile View - Portfolio gallery across 320/360/390/768/desktop.
12. Worker Profile View - Review summary across 320/360/390/768/desktop.
13. Worker Profile Edit - Accessibility labels across 320/360/390/768/desktop.
14. Worker Profile View - Accessibility labels across 320/360/390/768/desktop.
15. Worker Profile Edit - Touch targets across 320/360/390/768/desktop.
16. Worker Profile View - Touch targets across 320/360/390/768/desktop.

### P2
17. Worker Profile Edit - Performance budget across 320/360/390/768/desktop.
18. Worker Profile View - Performance budget across 320/360/390/768/desktop.
19. Worker Profile View - Empty state across 320/360/390/768/desktop.
20. Worker Profile View - Loading state across 320/360/390/768/desktop.
21. Worker Profile Edit - Portfolio upload edge cases across 320/360/390/768/desktop.
22. Worker Profile Edit - Save success feedback across 320/360/390/768/desktop.

## Why This Order
- Profile edit is the most failure-sensitive surface because it writes user data.
- Profile view needs trustworthy identity and skill presentation right after edit safety.
- Accessibility and performance follow once the data flow is stable.

## Notes
- Keep skill values normalized before display and submit.
- Treat profile trust cues as part of the core hiring conversion path.
