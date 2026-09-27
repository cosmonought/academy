# Password-first account rollout

The frontend changes are prepared locally and have not been deployed. The owner
has enabled Email/Password, retained email-link sign-in, verified the netadao.org
sender domain, and confirmed receipt of a reset email and subsequent password
sign-in. Enrollment continuity still needs confirmation. Template editing is
blocked by Firebase; a support request is pending.

## Participant experience

- Returning participants sign in at `/account.html` using email and password.
- New participants create an account and choose a password immediately, then
  request enrollment with their name, X handle, and reason. Their account is usable
  immediately; the existing X confirmation and manual seminar approval still apply.
- Existing email-link users who never set a password use **Set or reset a password**
  once. This updates their existing Firebase account rather than creating a second
  identity. Already signed-in participants can choose a password directly through
  their profile. A stale login may require password recovery.
- A registration without a Firebase account needs verified manual assistance.
  Confirm the participant through their previously registered X handle. Have them
  create an account with their original email, obtain its UID from Firebase Auth,
  and bind the existing registration's `accountUid` to that UID in the database.
  Check the account email and identity before binding. Preserve enrollment and
  attendance; never ask for or transmit their password. The participant sees their
  account reference if access to an old registration is denied.

## Deploy in this order

1. Back up the current database rules and registration data. Inspect actual deployed
   rules against `firebase-rules-latest.json`; the file is a local snapshot, not proof
   of the live configuration. Preserve unrelated live-rule changes during review.
2. Check Firebase Authentication → Sign-in method: enable **Email/Password**.
   Retain email-link compatibility while previously issued links remain valid.
   The new frontend does not send new sign-in links. Ensure the production Academy
   domain is authorized. Configure a password policy consistent with the displayed
   minimum (8 characters); the UI also reports stricter Firebase policy rejections.
3. Review existing accounts before changing the rules. Legacy email-link/Google
   accounts with verified email retain access to legacy registrations. Existing
   unverified password accounts require verified manual binding to `accountUid`.
   Confirm the administrator account's email is verified so admin access continues.
4. Deploy the reviewed rules before enabling password-first signup. New registrations
   must belong to the signed-in UID, and only the verified administrator can approve
   them. An unverified account with an old participant's email cannot read or claim
   the participant's legacy enrollment. A UID-bound registration cannot be claimed
   by another UID, even with the same verified email. There are no client-wide read
   grants on the registration tree.
5. Deploy the static files, including the new account page and shared scripts.
   Coordinate steps 4–5: old cached pages can no longer submit anonymous registrations
   under the new rules. They should refresh and use the new account page.
6. Set `academyConfig/passwordAccountsEnabled` to boolean `true` using the Firebase
   console/Admin SDK only after the rules and frontend are ready. This is a rollout
   guard for the UI; it is not an Auth service security rule. The database rules
   enforce ownership regardless of how an Auth account was created.
7. Verify with designated real test accounts: returning password user; old email-link
   user recovering a password; new signup → pending → approved; sign-out re-locking;
   mobile use; administrator access. Test recovery email delivery across providers.
   Local emulator tests cannot establish production deliverability or console setup.

## Email identity and recovery

Normal signup and sign-in no longer require an email message. Password recovery
still does. In Firebase Authentication → Templates, set the sender display name to
**Neta DAO Academy**, use an Academy-controlled sender/reply address, and configure
and verify the custom email domain through the supplied DNS records. Use clear
subject/body language such as “Set or reset your Neta DAO Academy password.” Verify
the received From address, domain authentication, reply address, link, and inbox
placement with actual delivery tests; the display name alone does not fix Spam.

The standard Firebase reset handler works without further frontend configuration.
The new account page implements `mode=resetPassword&oobCode=…`, including a saved
password screen with a prominent sign-in button and the account email prefilled.
Expired, used, or missing codes offer a new reset link. The code is removed from
the URL after success. Passwords are not carried into sign-in.

Use `/auth-action.html` as the email action URL, **not** `/account.html` directly.
The router sends password resets to the Academy form and preserves other action
parameters at the fixed Firebase-hosted handler, including verification, email
recovery, and legacy email sign-in. It does not trust an incoming handler host.

Activation, after publishing the frontend:
1. Confirm `https://academy.netadao.org/auth-action.html?mode=resetPassword` opens
   the Academy page with an invalid-link message and a request-new-link option.
2. In Firebase → Authentication → Templates → Password reset, edit the action URL
   to `https://academy.netadao.org/auth-action.html` and save. If the project-level
   editing block applies here, wait for Firebase Support to restore access.
3. Send a fresh reset to the designated test account. Complete it yourself, use
   the new sign-in button, and verify existing seminar access. Test an already
   used link as well. Older emails retain their original Firebase URLs.
4. Test verification and legacy sign-in links before declaring rollout complete.
   If routing fails, restore the previous Firebase action URL. Do not remove the
   published router while issued emails can still point to it.

References: [Firebase password authentication](https://firebase.google.com/docs/auth/web/password-auth),
[custom email domains](https://firebase.google.com/docs/auth/email-custom-domain),
[custom action handlers](https://firebase.google.com/docs/auth/custom-email-handler).

## Validation and existing limits

`npm test` covers safe return destinations, account error messages, password
confirmation, and film reveal timing. `npm run test:rules` runs both Firebase Auth
and Realtime Database emulators: new password accounts, sign-in, password change,
legacy email-link recovery preserving the UID, replayed reset rejection, enrollment
ownership, legacy access, self-approval denial, and administrator permissions.

Cinema streaming and Coining Reason archive URLs are already in public frontend
source. Their UI gates are not a secure media delivery boundary. This change does
not add server-authorized streaming or move those archives into protected storage.
The separate cinema chat permissions are unchanged.

Sex, and/or Love PDFs under `/assets` are likewise static public files. Their
syllabus links are displayed only after enrollment confirmation, but direct file
URLs are not access-controlled. `js/seminar-readings.js` maps the supplied files;
the supplied readings now include the Copjec essay.

For rollback, first disable the signup flag and diagnose the issue. Do not restore
the old permissive email-based rules once unverified password accounts exist. Keep
the ownership protections and retain all account and enrollment records.
