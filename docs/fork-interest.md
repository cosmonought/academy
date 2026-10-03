# Fork registrations of interest

fork.netadao.org/submit.html has a Register interest form (name, email, interest, research area). It posts each
registration to this project's Realtime Database, and the Academy Admin lists them under **Fork**. No link or form on
the three sites opens an email app.

## Where registrations go

- `forkInterests/{pushId}`: `name`, `email`, `interest` (`submitting`, `editorial`, `reviewing` or `updates`),
  optional `area`, `source` (`fork.netadao.org`) and `submittedAt` (the server's time). Anyone can create an entry;
  nobody can read, change or delete one except the verified Academy administrator (`academy@netadao.org`). The rule
  is in `firebase-rules-latest.json` and tested in `tests/rules.mjs`.
- Until that rule is deployed, the database refuses `forkInterests`, and the form sends the same record to
  `interestSignups` instead (the homepage's public signup list, which already accepts it). Admin shows those entries
  under Fork, says the rule isn't live yet, and keeps them out of Inquiries. Nothing is lost either way.
- The form talks to the database's REST endpoint (`…firebaseio.com/forkInterests.json`, a plain POST), so Fork loads
  no Firebase SDK and no credentials. The Academy's public web config is not needed for this.

## Deploying the rule

`firebase-rules-latest.json` is a local snapshot, not proof of the live rules (see `auth-rollout.md`), so add only
this block to the live rules rather than publishing the whole file:

1. Firebase console → project `neta-dao-cinema` → Realtime Database → Rules.
2. Inside `"rules": { … }`, after the `"seminarInterests": { … }` block, add a comma and paste:

```json
  "forkInterests": {
    ".read": "auth != null && auth.token.email_verified === true && auth.token.email === 'academy@netadao.org'",
    ".write": false,
    "$interestId": {
      ".write": "!data.exists()",
      ".validate": "newData.hasChildren(['name','email','interest','source','submittedAt'])",
      "name": {
        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 80"
      },
      "email": {
        ".validate": "newData.isString() && newData.val().length > 2 && newData.val().length <= 120 && newData.val().contains('@')"
      },
      "interest": {
        ".validate": "newData.isString() && (newData.val() === 'submitting' || newData.val() === 'editorial' || newData.val() === 'reviewing' || newData.val() === 'updates')"
      },
      "area": {
        ".validate": "newData.isString() && newData.val().length <= 200"
      },
      "source": {
        ".validate": "newData.isString() && newData.val() === 'fork.netadao.org'"
      },
      "submittedAt": {
        ".validate": "newData.isNumber() && newData.val() <= now"
      },
      "$other": {
        ".validate": false
      }
    }
  }
```

3. Publish. In the Rules Playground, a simulated unauthenticated read of `/forkInterests` should be denied.
4. Register on fork.netadao.org/submit.html with your own address; it appears in Admin → Fork, and the
   "rule isn't deployed yet" note is gone.

With the CLI, the same block is already in the snapshot: `firebase deploy --only database --project neta-dao-cinema`
publishes the whole file, so compare it with the live rules first.

## Later

An Editorial role for Fork's editors can be granted read access to `forkInterests` alone (for example through a
`forkEditors/{uid}` list checked in the rule's `.read`), without the rest of Admin.
