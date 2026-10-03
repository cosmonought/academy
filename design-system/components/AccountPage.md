# AccountPage (draft)

`account.html`: one account for seminars, readings and screenings. The page shows **Sign in**, the most common state: the two ways in as tabs (Sign in, Create an account), Continue with Google, then email and password. The narrow column answers the usual questions (an email link in the past, registered but never signed in, new here).

- When someone arrives from a seminar's Late enroll or How to enroll (`?seminar=…`), the line with the pink rule says which seminar they're signing in to join; otherwise it isn't there.
- The other states of the page (creating an account, the password states, signed in and requesting enrollment, awaiting confirmation) and the two small pages that share its forms (Set a password, the account-link page) are in **AccountStates**.
- The header's Sign in carries `aria-current="page"` here; once signed in it reads Account and goes to the profile.
- Fields are the Field component; Show beside a password reveals it. Buttons: one primary per form.

Draft for review; the page's script (`account-page.js`) keeps its element ids.
