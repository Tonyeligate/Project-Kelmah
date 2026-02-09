# Job Creation Autosave & Layout Plan – November 19, 2025

## 1. Data Flow Analysis

### UI Component Chain
- **Component:** `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx` (modal dialog rendered via `CreateJobDialog`).
- **State Management:** `react-hook-form` controls the entire payload; Redux is only touched during submission (`dispatch(createJob(jobData))`). Local component state handles loading/error/success banners.
- **Service Layer:** `kelmah-frontend/src/modules/jobs/services/jobSlice.js` thunk `createJob` → `jobsService.createJob()` in `kelmah-frontend/src/modules/jobs/services/jobsService.js` → `jobServiceClient.post('/jobs', jobData)`.
- **Backend Endpoint:** API Gateway proxies to Job Service `POST /api/jobs` (see `kelmah-backend/services/job-service/routes/job.routes.js` + `controllers/job.controller.js#createJob`).

### Flow Map
```
Hirer opens Post Job dialog (Jobs.jsx → CreateJobDialog)
  ↓
JobCreationForm.jsx: react-hook-form manages inputs, watch()/setValue() track user edits
  ↓
handleSubmit(onSubmit) serializes data, injects hirer metadata, dispatches createJob thunk
  ↓
jobSlice.js:createJob → jobsService.createJob(jobData)
  ↓
jobServiceClient (axios) POST /jobs → Gateway → Job Service controller
  ↓
Response (success/error) bubbles back → JobCreationForm toggles success/error banners, resets form, closes dialog, optional redirect to `/jobs/:id`
```

### Issues Found
1. **No Draft Persistence:** `react-hook-form` state lives only in-memory. Closing the dialog, refreshing, or hitting navigation destroys in-progress data.
2. **Single Column Layout:** 900+ lines of inline JSX produce a very tall form with inconsistent spacing, making it hard to scan critical fields (title/category/budget) separately from optional sections (bidding, benefits).
3. **State Feedback Gaps:** Loading spinner only disables the submit button; inputs remain editable with no progress indicator. Errors show as a single banner without field-level persistence.
4. **No Autosave Feedback:** Users cannot tell whether an autosave would succeed, nor can they manage multiple drafts.
5. **No validation summary:** When the backend returns validation errors (e.g., skill enum mismatches), the UI only surfaces `err.message`, leaving the user guessing which field failed.

## 2. Autosave Draft Strategy
1. **Custom Hook (`useJobDraft`):**
   - Location: `src/modules/jobs/hooks/useJobDraft.js`.
   - Responsibilities:
     - Accept `{ formValues, isDirty, userId }` from `react-hook-form`.
     - Persist drafts to `secureStorage` (preferred) with a fallback to `localStorage` under key `kelmah:job-draft:<userId>`.
     - Debounce writes (e.g., 1s) via `useEffect` + `setTimeout` to avoid constant IO.
     - Expose `loadDraft()` to merge saved data into `reset()` on mount, `clearDraft()` after successful submission or manual discard.
2. **Integration with `JobCreationForm`:**
   - Inject `const draft = useJobDraft({ watchAll: watch(), isDirty: formState.isDirty, userId: user?.id });` where `watch()` already exists.
   - On mount, call `draft.load()` and `reset(savedValues)` before showing the dialog. Display a “Draft restored” snackbar when applicable.
   - Add a “Discard Draft” text button near the footer to call `draft.clear()` + `reset(defaults)`.
3. **Draft Metadata:**
   - Store `{ data, updatedAt, version }` so we can expire drafts (e.g., 7 days) and handle schema evolution.
4. **Error Handling:**
   - Wrap storage access in try/catch, fall back silently if quota is exceeded.

## 3. Layout Enhancements
1. **Sectionized Layout:**
   - Extract logical sections into small components (e.g., `JobDetailsSection`, `CompensationSection`, `LocationSection`, `RequirementsSection`, `BiddingSection`).
   - Use `Grid` with `xs=12` + `md=6` pairs for critical fields to reduce scroll length.
2. **Stepper / Progress Summary:**
   - Optional progressive disclosure using MUI Stepper (“Basics → Scope → Compensation → Review”). Each step maps to a subset of form fields while still submitting via a single payload.
   - Display a mini checklist showing “4/6 essentials completed” (title, description, category, budget, location, skills) to guide hirers.
3. **Persistent Footer:**
   - Keep `Submit`, `Save Draft`, and `Discard Draft` actions in a sticky footer so actions are always visible.
4. **Backend Validation Surfacing:**
   - On `createJob.rejected`, inspect `action.payload` for JSON error details (backfill once job-service returns `error.details`). Map field errors to `setError()` so the offending inputs highlight automatically.
5. **Preview Panel (Future):**
   - Add an optional preview drawer on the right (desktop) that renders a JobCard using current form values, reinforcing how postings will look.

## 4. Next Steps / Work Breakdown
1. **Backend:** Already fixed proxy body forwarding – awaiting redeploy.
2. **Frontend Implementation:**
   - [ ] Build `useJobDraft` hook with tests (Jest) to validate storage lifecycle.
   - [ ] Refactor `JobCreationForm` into modular sections + shared inputs.
   - [ ] Add sticky footer with `Save Draft`, `Discard Draft`, and `Post Job` actions.
   - [ ] Surface backend validation errors via `setError` + summary banner.
   - [ ] Optionally add stepper/progress indicator once layout refactor stabilizes.
3. **QA Checklist:**
   - Draft persists across dialog close/reopen, page refresh, and after visiting other modules.
   - Manual discard clears storage and resets form.
   - Successful job creation clears draft automatically and redirects.
   - Responsive layout verified on <768px, 1024px, and desktop.

Refer back to this document once we start implementing autosave and layout improvements to ensure all touchpoints remain documented.
