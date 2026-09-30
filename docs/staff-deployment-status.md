# Staff authority deployment status — 29 September 2026

Backend deployment completed after fresh Firebase CLI 15.31.0 two-phase authentication. Project `neta-dao-cinema` is visible to the authenticated deployment account. Billing is enabled; Google provider is enabled and `academy.netadao.org` is authorized. No billing or Auth-provider configuration was changed by this work. Anonymous remains disabled as requested.

## Git and prerequisites

- Initial local HEAD and verified remote `origin/main`: `3cec66c5104da196bee02d76763bf662b344c18e` (`Build Academy participant record and evaluation workflow`); local `main` initially ahead 0 / behind 0.
- Staff-authority changes were uncommitted at inspection. They are being recorded in one local commit named `Add seminar teaching roles and admin account support` with the requested Cinema security migration.
- An unrelated modification to `assets/Saketopoulous_Sexuality Beyond Consent_selections.pdf` appeared before resumption. It is preserved and excluded from this commit.
- No `.firebaserc` project selection exists. Deployment explicitly targets `neta-dao-cinema`; client config matches that project and its database URL.
- `firebase.json`: Functions source `functions`, codebase `academy-staff`, predeploy canonical-model sync, and the intended RTDB rules file. Functions specify Node 22 and `us-central1`. Local Node is 24; the cloud runtime remains explicitly Node 22.
- Functions dependencies installed from the lockfile. Admin SDK 13.10.0 and Functions SDK 6.6.0 are locked. All three synchronized model files match browser sources exactly; no unrelated source changes resulted from synchronization.
- Credential-material scan of tracked and proposed files found no private key or service-account JSON. No deployment credentials belong in the commit.
- Live public Firebase project configuration confirms `academy.netadao.org` is authorized (project number 857402063474).
- Live `accounts:createAuthUri` request for `google.com` succeeded and returned an authorization URL hosted by `accounts.google.com`. No Google identity was signed in, created, or merged; no participant data was accessed.
- Billing enabled was verified through the Cloud Billing API. Deployment permissions were proven by successful deployment. No Firebase-console setup remains required.

## Cinema correction

The original live Cinema code did depend on Anonymous Auth: it created a named `cinemaChatApp` and called `signInAnonymously`. The user has already disabled/deleted that provider. It must remain disabled; no further Anonymous-console action is required after the migration is deployed.

The migrated Cinema source no longer calls `signInAnonymously`, creates the isolated chat app, or contains the old host URL token/reveal mechanism. Chat uses the shared Academy Auth and database instances and puts the signed-in Academy UID in each message.

Authorization is now:

| Action | Authorized identities |
|---|---|
| New message | Correctly owned, currently enrolled Sex/Love participant; verified Academy Admin; or UID assigned as Sex/Love instructor |
| Disable / re-enable chat | Verified Academy Admin or UID assigned as Sex/Love instructor |
| Delete individual messages / clear chat | Verified Academy Admin or UID assigned as Sex/Love instructor, subject to existing banned-UID exclusion |
| Host controls in UI | Verified Academy Admin or assigned Sex/Love instructor; never an ordinary enrollee, another-seminar instructor, guest, or URL-token holder |

Exact rule changes, all under `chat/cinema`:

1. Removed the broad messages-parent `auth != null` write grant. Parent writes now permit only complete deletion by an authorized moderator; participants cannot replace or erase the collection.
2. Added message-child create authorization requiring a non-anonymous Auth identity with email, absence from `banned`, host chat not disabled, and either legitimate Sex/Love enrollment ownership or moderator authority.
3. Enrollment ownership matches the existing readings boundary: `enrolled === true` and matching `accountUid`; legacy registrations without a UID require verified matching email.
4. Moderator authority is verified `academy@netadao.org`, or `seminarStaff/sex-and-or-love/{auth.uid}/role === 'instructor'`. Other seminar assignments confer no Cinema authority. RTDB evaluates the current assignment on every write.
5. Existing messages cannot be edited by participants, including their own. Only moderators may delete them.
6. `disabled` is writable only by the same real-identity moderators; non-deletion values must be boolean.
7. Existing message UID matching and length/type validation remains; names/text must be nonempty, UID must be a matching string, and unknown fields are rejected.
8. Existing public reads were left unchanged. Registration, staff, evaluation, and readings permissions outside these requested changes were not broadened.

The UI obtains the caller's assignments through `getTeachingAssignments`, checks the exact seminar, and rechecks instructor assignment before host actions. Database rules independently enforce authority. Clear-chat failure does not falsely end the local presentation. As before, the end-screening presentation is local playback behavior; no new remote stream-control service was introduced.

## Verification performed

- Six focused actual-chat-module tests with mocked Academy identities: shared UID send, enrolled success, signed-out/non-enrolled denial, ordinary-user host denial, Admin authority, correct instructor authority, cross-seminar denial, and revocation.
- Six focused RTDB emulator tests: non-anonymous identity, real enrollment/legacy ownership, UID spoofing denial, history edit/delete denial, banned/unenrolled/disabled denials, Admin authority, assigned instructor authority, cross-seminar denial, and revocation.
- Cinema inline-module syntax and diff whitespace checks.
- No broad/full suite rerun. The earlier staff-authority targeted tests remain documented in `staff-authority-pass.md`.

## Backend deployment verified

Implementation commit: `214b0df96250dee3d66a79e266737dac2842c5f7` — `Add seminar teaching roles and admin account support` (31 files).

All ten callable operations are ACTIVE in `us-central1`, codebase `academy-staff`, Node 22 / Functions v2:

- getTeachingAssignments
- getTeachingRoster
- staffSetEnrollment
- staffSetAttendance
- staffSetEvaluation
- adminGetAuthSummary
- adminListInstructors
- adminAssignInstructor
- adminRevokeInstructor
- adminDeleteRegistration

Deployment used `firebase deploy --only functions:academy-staff,database --project neta-dao-cinema`. The initial command completed Functions and rules but exited on the missing artifact cleanup policy. That ancillary issue was resolved with a 30-day artifact retention policy. Independent Cloud Functions API verification confirms every function ACTIVE. All ten unauthenticated calls return HTTP 401 / UNAUTHENTICATED.

Production RTDB rules were downloaded with authorized project access and exactly match the tested local JSON, including deny-by-default, ownership, browser-denied seminarStaff, no instructor-wide browser registration read, staff-only attendance, participant/instructor evaluation separation, Admin authority, and unchanged readings access.

## Live smoke results and limitations

Live backend checks used one disposable email/password Auth identity and uniquely named temporary registrations:

- Ordinary account reaches getTeachingAssignments with an empty assignment list; all nine privileged operations deny it.
- Assigned instructor retrieves its seminar roster; unassigned seminar retrieval is denied.
- Lecture and screening attendance save separately; enrollment toggles preserve attendance and the unrelated seminar fixture.
- Evaluation agreed, in-progress, and completed/merit save while preserving the participant request.
- Instructor permanent deletion is denied and the registration remains.
- Removing assignments immediately denies subsequent roster/attendance requests.

Assignments for this fixture were seeded/revoked through authorized project access; this is not a positive test of the Admin assignment callables. No real participant record was changed. All temporary registrations, evaluation, assignments, and the disposable Auth account were removed successfully after the checks.

Account Assistance code and targeted tests verify Auth/registration distinction, safe metadata allowlisting, qualified password status, and Google-only guidance without password-reset advice. No password, hash, token, reset URL, or credential internals are returned. Email/password and reset helpers plus legacy email-link compatibility remain in code.

Remaining manual/live tests: authenticated Admin Account Assistance and grant/revoke UI; positive Admin deletion of a disposable registration with unrelated-data preservation; existing Google UID reuse; real email/password browser login and reset-email delivery; signed-in participant, instructor, and Admin browser views. These require suitable Academy login sessions. Deployment OAuth credentials are not used to impersonate an Academy Admin. Earlier targeted service/UI/emulator tests cover these permission and rendering paths, but are not represented as live tests.

No Hosting deployment, full test-suite rerun, final Admin redesign, or unrelated visual change was performed. The unrelated PDF modification remains excluded and preserved.
