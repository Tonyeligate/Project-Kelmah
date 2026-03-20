# Kelmah Frontend Backlog - Messaging

**Date**: March 19, 2026

**Source**: Extracted from `spec-kit/generated/FRONTEND_1000_ITEM_BACKLOG_MAR18_2026.md`

## Prioritized Messaging Plan

### P0
1. Thread list across 320/360/390/768/desktop.
2. Conversation header across 320/360/390/768/desktop.
3. Composer area across 320/360/390/768/desktop.
4. Attachment flow across 320/360/390/768/desktop.
5. Unread badges across 320/360/390/768/desktop.
6. Error recovery across 320/360/390/768/desktop.

### P1
7. Empty state across 320/360/390/768/desktop.
8. Loading state across 320/360/390/768/desktop.
9. Accessibility labels across 320/360/390/768/desktop.
10. Performance budget across 320/360/390/768/desktop.

## Why This Order
- Messaging is a daily-use workflow and must stay reliable.
- Thread opening and composing are the highest-risk user actions.
- Empty/loading states matter after the main flow is stable.

## Notes
- Keep legacy route aliases working while the canonical `/messages` flow remains the source of truth.
- Check mobile keyboard overlap, thread scroll position, and attachment visibility during fixes.
