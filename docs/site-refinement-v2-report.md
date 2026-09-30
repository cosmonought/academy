# Corrective integration verification

1. **Authoritative base:** `214b0df96250dee3d66a79e266737dac2842c5f7`. The integration starts directly from this staff/security commit.
2. **Branch:** `site-refinement-v2`. Prototype reference: `95bedb1a1a7721af3739852009f470936191e163` on `site-refinement-feedback-2026-09-29`. No merge of PR #1, push, or deployment.
3. **Retained prototype pieces:** editorial homepage, first-visit introduction, large Coining artwork/fade, unit selector, Graphic comic composition and paired-reading layout, Profile tab/transcript presentation, shared policy dialog, restrained Cinema masthead atmosphere. These were selectively integrated into the authoritative implementation.
4. **Discarded/replaced prototype pieces:** prototype staff/security rules and simulated teaching access; attendance matrix; unsafe or duplicated screening labels; direct participant evaluation request writes; obsolete top navigation; duplicate poster title in the secondary Graphic hero; empty red Express Interest ornament; misleading reading-derived session titles. The retained staff assignment and callable architecture supplies real access.
5. **Files changed:** listed below. Generated staff-model copies are synchronized with browser source. The Lil D asset is a transparent crop derived from the supplied historical poster, without importing its historical schedule or registration text.
6. **Staff/security preservation:** real Auth UID assignments, verified-email Admin authority, seminar-specific instructor scope, scoped server roster reads, ownership checks, revocation, legacy verified-email handling, historical Admin correction, and Cinema identity/chat rules remain authoritative. Teaching uses actual `getTeachingAssignments` and `getTeachingRoster`; unauthorized and revoked users return to Seminars. Cinema navigation uses actual enrollment/assignment/Admin entitlement. Player and chat implementation are unchanged.
7. **Backend/rules changes:** added `staffMarkAllAttended`, `participantSetEvaluationRequest`, and `staffSetEvaluationRequest`. Bulk attendance and participation changes use root RTDB transactions, rechecking current assignment/enrollment/ownership inside the transaction. A retained snapshot listener prevents an empty speculative cache from being mistaken for a missing roster. Direct client writes to evaluation requests are denied. Registration validation requires the revised policy for new Graphic records while preserving existing records; enrollment approval separately requires current assent. No records were migrated or deleted. These functions and rules remain local and require a future backend-first deployment/verification before frontend publication.
8. **Policy:** `2026-09-29-r2`. Shared modal content comes from the Seminars policy body, including Attendance and Conduct. Existing assent is preserved with its original version; it is not relabeled as acceptance of r2. Express Interest's Review Academy Seminar Policies opens this modal, with close-button focus, Escape dismissal, focus return, and a fallback link.
9. **Routes:** `/CoiningReason/` and `/SexMonstersSuperheroes/` are canonical content. `seminar.html` and `forthcoming.html` are minimal redirect stubs preserving query strings and hashes, with ordinary canonical fallback links. Sign-in return normalization accepts canonical destinations and maps old paths. Coining preserves unit aliases, including access-panel anchors, and changes the selected view for deep links/hash changes.
10. **Attendance:** Admin and Teaching share `session-attendance.js`. Canonical chronological events are grouped beneath their parent syllabus session, with current/next emphasized and upcoming/past collapsed. Staff screenings show actual film titles, e.g. SESSION 6 — LOVE'S MEASURE / SCREENING · Ma Mère. Present, Absent, and Unrecorded are separate controls; resetting removes the mark. Bulk attendance is atomic for the supplied roster and fails without partial updates if scope or registration changes. Participant summaries use the seminar's shared `canRevealTitle` boundary and enrollment requirement. Legacy Sex/Love s0–s8 marks remain stored but never count as canonical attendance or evaluation eligibility.
11. **Evaluation:** explicit enabled/minimum/cutoff configuration; Graphic enabled with minimum one canonical event and null cutoff, existing seminars disabled. Disabled sections do not query missing evaluation records or show fake failures. Participant opt-in/out and re-opt-in remain available before a real cutoff, while requested, agreed, or in progress; the callable enforces ownership, enrollment, enabled status, canonical attendance for opt-in, form validity, and cutoff. Invalid cutoffs fail closed. Scoped staff and Admin can correct participation after cutoff. Completed evaluations have no ordinary participant opt-in/out controls; the callable rejects both operations inside the transaction even before cutoff, preserving the request, result and feedback. Admin exceptional correction remains available. Instructor feedback remains a separate staff-controlled record.
12. **Responsive and visual checks:** screenshots at 1440, 1280, 1024, and 390 CSS px for homepage, both canonical seminar pages, Cinema, Teaching, and Transcript. Homepage checked at practical zoom-equivalent widths for 80%, 100%, 125%, 150%, 175%, and 200% of a 1440px viewport; these are viewport equivalents, not native browser zoom. Homepage and canonical pages have no horizontal document overflow. Editorial depth uses a cut title field, restrained offset shadows, rotated Thought/art relationships, and layered Fork typography rather than floating cards. The Graphic secondary hero contains only Lil D/arrow on near-black, with a 1.6s single entrance and immediate final state under reduced motion. Pink active border motion is restrained and respects reduced motion. First-visit intro is skippable with Escape/keyboard, keeps navigation usable, and stores its seen state. Shared modal and legacy deep links were exercised.
13. **Exact verification results:** 46 targeted unit tests pass: staff service 17, Cinema identity 6, Academy record 6, account flow 7, screening reveal 4, Profile presentation 4, Cinema navigation 2. Local RTDB emulator rules: 21 pass (general rules 12, staff rules 3, Cinema rules 6). Real Admin SDK transaction tests: 2 pass, including no partial bulk write on invalid roster and legacy-only evaluation rejection/opt-out and completed-record protection against both participant changes. Source checker: 58 scripts plus all HTML pass; `git diff --check` passes. Staff browser suite passes all four widths, saved evaluation, revocation fallback, participant no-Teaching, Google flow, and reports zero JavaScript errors. Comprehensive refinement browser suite passes public layout, Profile/Teaching/Transcript, policy focus/Escape, redirects, intro, frog animation and reduced motion, with zero JavaScript errors. Account and staff browser operations are mocked; no production writes were made.
14. **Review/limitations:** Cinema's existing chat input/send-button horizontal overflow reproduces at all four widths on both the authoritative base and this integration; it was reported and left unchanged because player/chat fixes are out of scope. Historical Graphic repository versions did not supply independent canonical session titles for the current eight-session reading pairs, so neutral Session 1–8 headings are retained; the newly supplied poster has a different historical syllabus and was used only for its frog artwork. Art direction remains available for user review. Backend/rules publication and live deployment checks are intentionally pending; this pass does not deploy.

## Changed files

- `account.html`
- `admin.html`
- `cinema.html`
- `css/editorial.css`
- `css/graphic.css`
- `css/staff.css`
- `firebase-rules-latest.json`
- `forthcoming.html`
- `functions/index.js`
- `functions/shared/academy-record.js`
- `functions/shared/seminar-policies.js`
- `functions/staff-service.js`
- `index.html`
- `js/academy-auth.js`
- `js/academy-record.js`
- `js/account-flow.js`
- `js/homepage-hero.js`
- `js/profile-teaching.js`
- `js/seminar-policies.js`
- `js/site.js`
- `profile.html`
- `register.html`
- `scripts/sync-staff-model.mjs`
- `seminar.html`
- `seminars.html`
- `set-password.html`
- `sex-and-or-love.html`
- `tests/academy-record.test.mjs`
- `tests/account-flow.test.mjs`
- `tests/check-source.py`
- `tests/rules.mjs`
- `tests/staff-rules.mjs`
- `tests/staff-service.test.mjs`
- `tests/staff-ui.cjs`
- `CoiningReason/index.html`
- `SexMonstersSuperheroes/index.html`
- `assets/lil-d-poster-crop.png`
- `functions/shared/seminar-screenings.js`
- `js/cinema-navigation.js`
- `js/evaluation-correction.js`
- `js/profile-tabs.js`
- `js/session-attendance.js`
- `tests/cinema-navigation.test.mjs`
- `tests/profile-presentation.test.mjs`
- `tests/refinement-ui.cjs`
- `tests/staff-transactions.mjs`

- `docs/site-refinement-v2-report.md`
- `docs/refinement-review/*.webp` (review captures)

## Review screenshots

Screenshots use a local preview and mocked signed-in identity. See `refinement-review/` for all width and zoom-equivalent captures, including homepage, canonical seminars, Cinema, Teaching, Transcript, Admin, intro, modal and settled frog.

- [Homepage, desktop](refinement-review/home-1440.webp)
- [Graphic, desktop](refinement-review/SexMonstersSuperheroes-1440.webp)
- [Graphic, mobile](refinement-review/frog-390.webp)
- [Teaching, mobile](refinement-review/teaching-390.webp)
- [Policies, mobile](refinement-review/policy-390.webp)

## Pre-deployment completed-evaluation correction

Inspection confirmed that the prior implementation allowed participant request removal after instructor completion, while retaining the instructor result. The smallest correction adds a completed-state guard inside the participant transaction and hides both participation controls from completed Profile records. Requested, agreed and in-progress records retain pre-cutoff opt-in/out. Targeted tests verify unchanged completed request/result/feedback after rejected opt-in and opt-out, including real RTDB transactions, plus exceptional Admin participation correction. No Firebase rules or deployment changes were needed.
