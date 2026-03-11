# Mobile Native Worker Job QA Handoff March 11 2026

## Status
- READY FOR TESTERS ✅

## Purpose
- Short pass/fail handoff for the worker home → jobs browse → job detail → apply path on both native apps.
- Derived from `spec-kit/MOBILE_NATIVE_WORKER_JOB_SMOKE_CHECKLIST_MAR11_2026.md` for faster manual QA execution.

## Tester Setup
- Sign in with a worker account.
- Use the current API environment with a reachable jobs feed.
- Test with one job that can be opened from browse or home.

## Pass Fail Sheet

| Check | iOS | Android | Expected result |
| --- | --- | --- | --- |
| Worker home copy | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Home shows plain wording such as `Your work today`, `Good jobs`, `Saved jobs`, `Alerts`, and `Find Work`. |
| Recommendation open affordance | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Recommendation cards show `Tap to open job` and open the correct job. |
| Jobs browse copy | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Jobs browse uses simple wording such as `Find Work`, `Find`, and the updated helper/search copy. |
| Save from jobs list | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Save control is explicit text-plus-icon and success feedback says `Saved for later`. |
| Job detail load and labels | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Job detail shows `Opening job...` while loading and uses simple labels such as `What you need`, `Apply by`, and `Apply Now`. |
| Save from detail | PASS / FAIL / N.A. | PASS / FAIL / N.A. | `Save Job` changes state correctly and does not break navigation. |
| Apply screen plain language | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Apply screen uses plain instructions for price, time, and short message. |
| Empty price validation | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Validation says `Enter your price`. |
| Missing message validation | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Validation says `Write a short message to the hirer`. |
| Submit loading state | PASS / FAIL / N.A. | PASS / FAIL / N.A. | Submit button shows `Sending...` and returns success or backend feedback without UI breakage. |

## Notes For Testers
- Mark `N.A.` only if the environment does not expose a recommendation card or an apply-ready job.
- Record the first failing screen and the exact message shown if copy or validation differs.
- This sheet is intentionally short; use the full smoke checklist for deeper troubleshooting.