# Frontend Viewport Screenshot Checklist (Prefilled Filenames)

Date: ____________________
Tester: __________________
Environment: __________________
Build / Commit: __________________
Artifact Root Folder: qa-artifacts/screenshots/2026-03-16/

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
4. Save each screenshot using the suggested name from the matrix below.

## Prefilled Interaction Matrix

Use one row per width and interaction. The Screenshot Path column includes suggested filenames.

| Width | Interaction | Route / Context | Screenshot Path (Suggested) | Verdict (Pass/Fail) | Notes |
|---|---|---|---|---|---|
| 320 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | qa-artifacts/screenshots/2026-03-16/320_sw-update-snackbar-safe-area.png | | |
| 320 | Install snackbar safe-area spacing | Any page where install snackbar is visible | qa-artifacts/screenshots/2026-03-16/320_install-snackbar-safe-area.png | | |
| 320 | JobDetails touch hover suppression | Job details page with image gallery | qa-artifacts/screenshots/2026-03-16/320_jobdetails-touch-hover-suppression.png | | |
| 320 | HomeLanding tile density/readability | Home landing categories section | qa-artifacts/screenshots/2026-03-16/320_homelanding-category-density.png | | |
| 360 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | qa-artifacts/screenshots/2026-03-16/360_sw-update-snackbar-safe-area.png | | |
| 360 | Install snackbar safe-area spacing | Any page where install snackbar is visible | qa-artifacts/screenshots/2026-03-16/360_install-snackbar-safe-area.png | | |
| 360 | JobDetails touch hover suppression | Job details page with image gallery | qa-artifacts/screenshots/2026-03-16/360_jobdetails-touch-hover-suppression.png | | |
| 360 | HomeLanding tile density/readability | Home landing categories section | qa-artifacts/screenshots/2026-03-16/360_homelanding-category-density.png | | |
| 390 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | qa-artifacts/screenshots/2026-03-16/390_sw-update-snackbar-safe-area.png | | |
| 390 | Install snackbar safe-area spacing | Any page where install snackbar is visible | qa-artifacts/screenshots/2026-03-16/390_install-snackbar-safe-area.png | | |
| 390 | JobDetails touch hover suppression | Job details page with image gallery | qa-artifacts/screenshots/2026-03-16/390_jobdetails-touch-hover-suppression.png | | |
| 390 | HomeLanding tile density/readability | Home landing categories section | qa-artifacts/screenshots/2026-03-16/390_homelanding-category-density.png | | |
| 768 | SW update snackbar safe-area spacing | Any page where update snackbar is visible | qa-artifacts/screenshots/2026-03-16/768_sw-update-snackbar-safe-area.png | | |
| 768 | Install snackbar safe-area spacing | Any page where install snackbar is visible | qa-artifacts/screenshots/2026-03-16/768_install-snackbar-safe-area.png | | |
| 768 | JobDetails touch hover suppression | Job details page with image gallery | qa-artifacts/screenshots/2026-03-16/768_jobdetails-touch-hover-suppression.png | | |
| 768 | HomeLanding tile density/readability | Home landing categories section | qa-artifacts/screenshots/2026-03-16/768_homelanding-category-density.png | | |

## Alternate Naming Scheme (Timestamp Placeholder)

Use this when running repeated QA passes on the same day.

Pattern:
- qa-artifacts/screenshots/YYYY-MM-DD/{run_ts_utc}_{width}_{check}.png

Placeholder guidance:
- run_ts_utc: YYYYMMDDTHHMMSSZ
- width: 320, 360, 390, 768
- check: sw-update-snackbar-safe-area | install-snackbar-safe-area | jobdetails-touch-hover-suppression | homelanding-category-density

Examples:
- qa-artifacts/screenshots/2026-03-16/20260316T214500Z_320_sw-update-snackbar-safe-area.png
- qa-artifacts/screenshots/2026-03-16/20260316T214500Z_390_jobdetails-touch-hover-suppression.png
- qa-artifacts/screenshots/2026-03-16/20260316T214500Z_768_homelanding-category-density.png

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
