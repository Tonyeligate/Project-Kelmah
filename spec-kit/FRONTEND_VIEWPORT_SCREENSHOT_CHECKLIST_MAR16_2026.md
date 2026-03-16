# Frontend Viewport Screenshot Checklist (Manual QA)

Date: ____________________
Tester: __________________
Environment: __________________
Build / Commit: __________________

## Scope

Capture manual screenshots for four viewport widths and four interaction checks:
- Widths: 320, 360, 390, 768
- Interaction checks:
  1. Service worker update snackbar bottom spacing remains visible above bottom nav/safe area.
  2. Install snackbar bottom spacing remains visible above bottom nav/safe area.
  3. Job Details gallery image does not stay zoomed on touch-only devices.
  4. HomeLanding category tiles remain readable and not overly cramped.

## Capture Setup

1. Open app with current production build or dev server.
2. In DevTools, set viewport width to one of: 320, 360, 390, 768.
3. Use full-page screenshot where practical; otherwise capture viewport with enough vertical context.
4. Save screenshots under a consistent folder, for example:
   - qa-artifacts/screenshots/2026-03-16/

## Interaction Matrix

Use one row per width and interaction. Fill Screenshot Path and Verdict.

| Width | Interaction | Route / Context | Screenshot Path | Verdict (Pass/Fail) | Notes |
|---|---|---|---|---|---|
| 320 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | | | |
| 320 | Install snackbar safe-area spacing | Any page where install snackbar is visible | | | |
| 320 | JobDetails touch hover suppression | Job details page with image gallery | | | |
| 320 | HomeLanding tile density/readability | Home landing categories section | | | |
| 360 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | | | |
| 360 | Install snackbar safe-area spacing | Any page where install snackbar is visible | | | |
| 360 | JobDetails touch hover suppression | Job details page with image gallery | | | |
| 360 | HomeLanding tile density/readability | Home landing categories section | | | |
| 390 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | | | |
| 390 | Install snackbar safe-area spacing | Any page where install snackbar is visible | | | |
| 390 | JobDetails touch hover suppression | Job details page with image gallery | | | |
| 390 | HomeLanding tile density/readability | Home landing categories section | | | |
| 768 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | | | |
| 768 | Install snackbar safe-area spacing | Any page where install snackbar is visible | | | |
| 768 | JobDetails touch hover suppression | Job details page with image gallery | | | |
| 768 | HomeLanding tile density/readability | Home landing categories section | | | |

## Acceptance Criteria

- Snackbar actions are fully visible and tappable, with no overlap against bottom nav/home indicator area.
- No sticky or unintended zoom state on touch interactions in Job Details image section.
- Category grid remains legible and balanced at each width with no clipped labels.
- No horizontal overflow introduced by these interactions.

## Final Sign-Off

Overall Result: Pass / Fail

Blocking Issues:
- 

Follow-Up Actions:
- 
