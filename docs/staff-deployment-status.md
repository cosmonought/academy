# Staff authority deployment status — 29 September 2026

Backend-first publication gate remains closed: this workspace has no authenticated Firebase CLI account. `firebase projects:list --json` returns `Failed to authenticate, have you run firebase login?`. No deployment or Git push was attempted. Billing configuration was not changed.

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
- Blaze/billing and deployment IAM could not be inspected without authenticated project access. They are **unverified**, not known to be misconfigured. Do not change billing or repeat Google/domain setup without evidence of a problem.

## Cinema correction

The original live Cinema code did depend on Anonymous Auth: it created a named `cinemaChatApp` and called `signInAnonymously`. The user has already disabled/deleted that provider. It must remain disabled; no further Anonymous-console action is required after the migration is deployed.

Current production source no longer calls `signInAnonymously`, creates the isolated chat app, or contains the old host URL token/reveal mechanism. Chat uses the shared Academy Auth and database instances and puts the signed-in Academy UID in each message.

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

## Deployment and live checks still pending

All ten intended functions remain **not deployed by this work**; their production availability has not been confirmed:

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

Database rules have not been deployed. No live participant records were changed or deleted. Live Admin Account Assistance, instructor grants/revocations, cross-seminar callables, ordinary-participant callable denial, narrow deletion, existing-Google-UID reuse, password sign-in/reset delivery, and final frontend checks remain pending authenticated deployment and safe test identities. The public Google configuration check is not a substitute for those checks.

The frontend must not be pushed until Functions plus rules deploy successfully and essential backend checks pass. After authentication, resume with prerequisite inspection, then:

`firebase deploy --only functions:academy-staff,database --project neta-dao-cinema`

Verify all ten operations and the actual rules before testing and pushing `main`. No Hosting deployment, final Admin redesign, or unrelated visual changes were performed.
