# Hirer Mobile UI Implementation Batch Plan (Apr 12, 2026)

## Scope
Source audit: `spec-kit/HIRER_MOBILE_UI_UX_200_PER_PAGE_APR12_2026.md`

This plan maps issues into execution batches:
- `P0`: Production blockers and trust-breaking UX failures.
- `P1`: High-friction decision and form-completion barriers.
- `P2`: Quality polish, consistency, and advanced accessibility refinements.

## Status Snapshot
- `P0-01` Messages route crash + chunk recovery: `DONE`
- `P0-02` Worker profile CTA occlusion and trust clarity: `DONE`
- `P0-03` Post Job mobile chrome reduction + category overlap fix: `DONE`
- `P0-04` Dashboard stacked fixed bars conflict: `DONE`
- `P0-05` Post Job local autosave and restore UX: `DONE`
- `P0-06` Post Job data-loss prevention on route close/refresh: `DONE`
- `P0-07` Messages fallback guidance and recovery actions: `DONE`
- `P1-01` Worker profile trust architecture and comparability: `IN PROGRESS (core mobile trust architecture landed)`
- `P1-02` Post Job language clarity and guidance quality: `IN PROGRESS (guided flow + publish confidence checks landed)`
- `P1-03` Dashboard decision-first layout: `IN PROGRESS (priority queue strip + sync resilience messaging landed)`
- `P1-04` Messages continuity and status transparency: `IN PROGRESS (continuity recovery + reconnect hardening + low-bandwidth/outage clarity landed)`
- `P2-01` Accessibility and consistency pass: `IN PROGRESS (kickoff started with messaging-first accessibility audit scope and final validation baseline captured)`
- `P2-02` Performance and resilience refinement: `IN PROGRESS (low-bandwidth guidance now propagated across messages, worker profile, hirer dashboard, worker dashboard, messaging attachments, worker portfolio/gallery surfaces, and shared job-card media surfaces)`

## P0 (Immediate)

### P0-01 Messaging reliability and outage recovery
Mapped issues:
- Page 4: `1-8`, `11-18`, `21-27`, `31-33`, `38-41`, `61-63`, `81-85`, `97-100`, `120-123`, `127-130`, `153-155`, `174`, `197-200`.

Implemented:
- Fixed variable-order runtime crash.
- Added chunk-aware route fallback actions (`Retry Route`, `Reload App`, `Help`, `Go to Dashboard`).
- Added guarded auto-reload in lazy chunk loader for stale deployment mismatch.

### P0-02 Worker profile mobile decision safety
Mapped issues:
- Page 1: `1-5`, `9-15`, `26-31`, `41-44`, `52-55`, `79-83`, `91-99`, `101-103`, `111-118`, `128-131`, `136-139`, `145-147`, `170`, `187-190`, `195-199`.

Implemented:
- Replaced fixed bottom CTA block with sticky in-flow panel to reduce occlusion.
- Added trust explanation copy, pricing/location/availability summary, and clearer CTA labels.
- Added explicit action outcome hint before hire flow.

### P0-03 Post Job mobile completion and data safety
Mapped issues:
- Page 2: `1-6`, `7-13`, `20-24`, `34-36`, `49-55`, `71-74`, `89-94`, `115-116`, `129-131`, `135-137`, `149-154`, `161`, `170-173`, `183-190`, `196-200`.

Implemented:
- Replaced dense mobile vertical stepper with compact step + progress meter.
- Fixed category field overlap behavior.
- Removed duplicate mobile + desktop action rows.
- Added autosave to local draft, restore banner, saved timestamp, clear-draft controls.
- Added beforeunload unsaved-change protection and mobile save-draft parity.

### P0-04 Hirer dashboard action safety
Mapped issues:
- Page 3: `4-6`, `19-20`, `55-56`, `79-81`, `125-127`, `188-190`, `198-200`.

Implemented:
- Removed extra fixed bottom `Refresh/Post Job` rail that competed with bottom nav.

## P1 (Next)

### P1-01 Worker profile trust architecture and comparability
Mapped issues:
- Page 1: `16-25`, `32-40`, `47-51`, `56-78`, `84-90`, `100`, `104-110`, `119-127`, `132-135`, `140-144`, `148-169`, `171-186`, `191-194`.

Implemented in current batch:
- Added compact mobile `Hire Readiness` panel with rate guide, reply speed, current load, and response-rate summary.
- Added explicit logistics rows for service area, language support, tools/material responsibility, and travel readiness.
- Improved mobile section hierarchy labels (`Work Summary`, `Recent Work Photos`, `Client Feedback`) with plain-language helper copy.
- Added persistent section-jump state + profile scroll restoration for profile -> messages -> back continuity.

Planned changes:
- Add compact "Hire Readiness" card (cost, response, availability freshness, capacity).
- Improve section hierarchy and labels for low-literacy scanability.
- Add explicit service area, language support, and materials responsibility rows.
- Add persistent section jump + scroll restore for profile -> messages -> back.

### P1-02 Post Job language clarity and guidance quality
Mapped issues:
- Page 2: `14-19`, `25-33`, `37-48`, `56-70`, `75-88`, `95-114`, `117-128`, `132-134`, `138-148`, `155-169`, `174-182`, `191-195`.

Implemented in current batch:
- Added plain-language coaching banners per wizard step to reduce uncertainty and improve completion guidance.
- Added keyword-based category filtering (`Find Trade Category`) to improve trade/category selection speed on mobile.
- Added final-step `Confidence Checklist` with pass/fail visibility for title/category/description/budget/location/requirements readiness.
- Added explicit publish expectations covering moderation review and expected first-response timing.

Planned changes:
- Add plain-language examples and local market hints by step.
- Add confidence checklist before publish.
- Add explicit posting fees/moderation notes and expected response timeline.
- Improve search and categorization affordances for trade selection.

### P1-03 Dashboard decision-first layout
Mapped issues:
- Page 3: `1-3`, `7-18`, `21-54`, `57-78`, `82-124`, `128-187`, `191-197`.

Implemented in current batch:
- Added a reusable top `Today Priority Queue` strip on mobile and desktop with urgent, action-linked items.
- Prioritized pending-application, overdue-job, pending-payment, and no-applicant scenarios with direct CTA routing.
- Standardized KPI phrasing and quick-action labels (`Review queue`, `Live jobs`, `Open messages`) for lower decision friction.
- Added explicit recency visibility (`Last sync`) and partial-load warning messaging when some dashboard modules fail to refresh.

Planned changes:
- Add top "Today" strip (urgent actions only).
- Reduce visual density; prioritize overdue/pending actions.
- Standardize card action placement and KPI phrasing.
- Add clear last-updated and partial-load warnings.

### P1-04 Messages continuity and status transparency
Mapped issues:
- Page 4: `9-10`, `19-20`, `28-30`, `34-37`, `42-60`, `64-80`, `86-96`, `101-119`, `124-126`, `131-152`, `156-173`, `175-196`.

Implemented in current batch:
- Added explicit continuity-aware status language in inbox and chat panes (connection state + last successful sync context).
- Added resilient retry actions that preserve current message context and drafts while attempting inbox refresh + realtime reconnection.
- Added visible support escalation actions (`Help`) in realtime instability and deep-link failure states.
- Added user-facing recovery feedback banner to confirm reconnect attempts and outcomes.
- Added low-bandwidth and offline resilience cues in composer and attachment handling, including reduced preview behavior under constrained network/data-saver conditions.
- Added focused messaging lint command path (`lint:messaging`) to keep file-scoped verification actionable.

Planned changes:
- Add last-successful-sync indicator and clearer outage status copy.
- Improve retry feedback and fallback context preservation.
- Expose support escalation path and stronger empathy copy.

## P2 (Polish and hardening)

### P2-01 Accessibility and consistency pass
Mapped issues:
- All pages: typography consistency, contrast edge cases, screen reader sequence, motion smoothness, icon semantic clarity.

Kickoff in current batch:
- Moved to next backlog item immediately after messaging media closure verification.
- Started with a messaging-first scope to keep changes isolated and auditable.
- Captured a final validation baseline before kickoff (`npm run lint:messaging`, `npm run build`).

Implemented in current batch:
- Added conversation-list accessibility summaries and per-thread aria labeling in `MessagingPage.jsx`.
- Added message-menu control relationships and polite delivery-state announcements in `Message.jsx`.
- Added explicit preview-dialog title/description wiring in `MessageAttachments.jsx`.
- Added modal semantics and Escape-key support to fullscreen preview overlay in `AttachmentPreview.jsx`.
- Added message-composer form/dialog/live-region accessibility wiring in `MessageInput.jsx`.
- Added typing-indicator screen-reader semantics and reduced-motion behavior in `TypingIndicator.jsx`.
- Verified this pass with focused lint and production build smoke checks.

Planned changes:
- Focus order and ARIA audit per route.
- Color and contrast pass against mobile sunlight scenarios.
- Reduce decorative noise and tighten spacing rhythm.

### P2-02 Performance and resilience refinement
Mapped issues:
- Heavy media/load jank concerns and low-end mobile behavior concerns across Page 1, Page 3, and Page 4.

Implemented in current batch:
- Extended low-bandwidth/offline guidance to Worker Profile (`Page 1`) and Hirer Dashboard (`Page 3`) to match messaging route behavior:
	- network-mode alerts for offline, constrained network, and restored connectivity,
	- reduced media preview behavior on Worker Profile portfolio surfaces,
	- adaptive dashboard auto-refresh cadence under constrained network/data-saver conditions,
	- reduced chart animation load in low-bandwidth mode for dashboard visualization panels.
- Extended low-bandwidth/offline guidance to Worker Dashboard (heavy charts + polling):
	- network-mode alert for offline, constrained network, and restored connectivity,
	- adaptive background polling cadence under constrained network/data-saver conditions,
	- reduced chart animation load in low-bandwidth mode for worker analytics charts.
- Propagated constrained-network media behavior into shared `JobCard` media surfaces:
	- cover-image previews pause in low-bandwidth/offline mode with explicit fallback copy,
	- hirer avatar image loading is reduced during constrained-network mode.
- Extended constrained-network media behavior through messaging attachment renderers:
	- `MessageAttachments` image previews now pause in constrained mode with explicit low-bandwidth/offline helper copy,
	- `AttachmentPreview` keeps attachment actions available while pausing heavy image preview rendering in constrained mode.
- Extended constrained-network behavior through inline message-body media renderers:
	- `Message.jsx` now pauses raw/typed inline image and video previews in low-bandwidth/offline mode while preserving text context,
	- `MessagingPage.jsx` local `MessageBubble` now pauses inline attachment image previews during constrained sessions with explicit fallback messaging.
- Final messaging media closure audit completed:
	- verified no remaining ungated direct `img`/`video` rendering points in `src/modules/messaging/**`,
	- remaining direct media elements are either constrained-network gated or explicit user-triggered preview surfaces.
- Extended constrained-network preview behavior to worker portfolio/gallery shared components:
	- `PortfolioGallery` now pauses tile previews with explicit low-bandwidth/offline fallback messaging,
	- `ProjectGallery` now pauses default full-image loading in constrained mode behind explicit user intent (`Load current image`) and suppresses thumbnail-strip overhead,
	- `ProjectShowcase` now applies constrained-mode pause/fallback behavior for before/after image cards.

Planned changes:
- Image and list virtualization strategy where needed.
- Reduced motion/repaint optimization on sticky and animated blocks.
- Continue low-bandwidth guidance hardening for any remaining heavy routes and shared media primitives.

## Current Execution Order
1. `P0` complete verification and user acceptance.
2. Begin `P1-01` Worker profile trust architecture.
3. Continue to `P1-02` Post Job guidance and confidence checklist.
4. Continue to `P1-03` Dashboard decision-first redesign.
5. Continue to `P1-04` Messages continuity hardening.
6. Begin `P2-01` accessibility and consistency pass (messaging-first slice).
