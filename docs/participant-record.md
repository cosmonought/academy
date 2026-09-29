# Participant record data

## Attendance migration

`ATTENDANCE_EVENTS` in `js/academy-record.js` is the shared event list for Profile and Admin. New Sex, and/or Love marks use `lecture-s0` through `lecture-s8` and distinct `screening-{filmId}` keys. The film IDs and dates come from `js/seminar-data.js`. A missing mark means **unrecorded**, distinct from `false` (**missed**).

Existing Sex/Love `attendance/s0` through `attendance/s8` marks refer to syllabus units. They remain in Firebase and appear in Profile as **legacy syllabus-unit marks**, outside the new event numerator. There is no reliable way to infer which lecture or screening a historical unit mark meant, especially for unit 6 with four screenings. Admin should review source records and mark real events explicitly; do not bulk-convert those marks.

Coining Reason has one relevant meeting per historical unit, so its existing `sN` keys map directly to discussion events and keep their prior counts. No historical data is deleted or rewritten.

## Account, interest, and evaluation

`accountMeta/{emailKey}/displayName` is the current public Academy name. Old registration names and stored chat messages are historical and unchanged. Cinema suggests a browser's `cinemaChatName` once when a signed-in account lacks a name; confirmation saves it to the account. Guest chat can continue with a browser-local name.

`accountSeminarInterests/{emailKey}/{seminarId}` is a signed-in receipt written alongside a future seminar-specific interest submission when the form email matches the account email. Old anonymous interest submissions remain in the admin-only `seminarInterests` path and are not retrospectively linked by email string alone. The public form's success does not depend on creation of the account receipt.

`evaluations/{emailKey}/{seminarId}/request` stores the participant's preferred form, timestamp, and UID. An enrolled Graphic participant may create or change that request until an instructor record exists. `.../instructor` stores agreed/completed state, form, optional standardized outcome, and freeform feedback. It is admin writable only. Offering evaluation to another seminar requires updating both `EVALUATION_OFFERED` and the request allowlist in database rules. Publish the updated rules before the new client pages.
