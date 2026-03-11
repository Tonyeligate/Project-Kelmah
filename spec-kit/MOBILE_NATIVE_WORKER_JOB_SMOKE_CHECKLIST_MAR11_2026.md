# Mobile Native Worker Job Smoke Checklist March 11 2026

## Status
- READY ✅

## Scope
- Manual smoke coverage for the worker path from home recommendations to jobs browse, job detail, save, and application.
- Applies to both native apps after the March 11 2026 copy and affordance cleanup.

## Preconditions
- Sign in as a worker account.
- Ensure the worker can reach the jobs feed through the current API environment.
- Use a job that is visible in browse and can open in detail.

## iOS Smoke Flow
1. Open the worker home screen.
Expected: The headline reads in plain language, worker summary tiles show `Good jobs`, `Saved jobs`, and `Alerts`, and the primary button says `Find Work`.
2. If recommendation cards are visible, tap one worker job card.
Expected: The card shows a clear `Tap to open job` hint and opens the selected job detail.
3. If no recommendation cards are visible, tap `Find Work` from home.
Expected: The jobs screen opens with worker-friendly copy such as `Find Work`, `Find`, and `Quick Search`.
4. From the jobs list, save one job.
Expected: The save control is explicit text-plus-icon, and the success feedback says `Saved for later`.
5. Open the same job from either the home card or jobs list.
Expected: The detail screen shows `Opening job...` while loading, then uses simple section labels such as `What you need`, `Apply by`, and `Apply Now`.
6. Tap `Save Job` on the detail screen.
Expected: The button label changes state correctly and does not break navigation.
7. Tap `Apply Now` on the detail screen.
Expected: The apply screen opens with plain instructions about price, time, and a short message.
8. Submit with an empty price.
Expected: Validation says `Enter your price`.
9. Submit with a price but no message.
Expected: Validation says `Write a short message to the hirer`.
10. Submit with a valid price, optional duration, and short message.
Expected: The button shows `Sending...` during submission and returns success feedback or backend response without UI breakage.

## Android Smoke Flow
1. Open the worker home screen.
Expected: The headline reads in plain language, worker summary tiles show `Good jobs`, `Saved jobs`, and `Alerts`, and the primary button says `Find Work`.
2. If recommendation cards are visible, tap one worker job card.
Expected: The card shows a clear `Tap to open job` hint and opens the selected job detail.
3. If no recommendation cards are visible, tap `Find Work` from home.
Expected: The jobs screen opens with worker-friendly copy such as `Find Work`, `Find`, and `Type job name`.
4. From the jobs list, save one job.
Expected: The save control is explicit text-plus-icon, and snackbar feedback says `Saved for later`.
5. Open the same job from either the home card or jobs list.
Expected: The detail screen shows `Opening job...` while loading, then uses simple labels such as `What you need`, `Apply by`, and `Apply Now`.
6. Tap `Save Job` on the detail screen.
Expected: The button label changes state correctly and does not break navigation.
7. Tap `Apply Now` on the detail screen.
Expected: The apply screen opens with plain instructions about price, time, and a short message.
8. Submit with an empty price.
Expected: Validation says `Enter your price`.
9. Submit with a price but no message.
Expected: Validation says `Write a short message to the hirer`.
10. Submit with a valid price, optional duration, and short message.
Expected: The button shows `Sending...` during submission and returns success feedback or backend response without UI breakage.

## Notes
- If recommendation fallback is active, the worker home banner should use simple language such as `Showing urgent jobs for now.`
- If recommendation failure is active, the worker home banner should instruct the user to tap `Find Work` rather than exposing technical wording.
- This checklist is for manual runtime verification and was not executed in this session.
