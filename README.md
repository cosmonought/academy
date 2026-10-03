# Neta DAO Academy

A static, multi-page site. No build step is required.

## Local preview

Run `python -m http.server 8765 --bind 127.0.0.1`, then open
`http://127.0.0.1:8765`. Authentication and registration still connect to the
existing Firebase project; do not submit production registrations as test data.

## Design system

The site is built on the Neta DAO Academy design system.

- `design-system/README.md`: the brand book (voice, colour, type, layout, imagery). Start here; `design-system/Layout.md` and `design-system/Motion.md` cover the homepage grid and the intro and pigment films.
- `design-system/components/<Name>.md`: each component's guideline and markup, and the page drafts (Homepage, SeminarPage, CoiningReasonPage, TheGraphicPage, AccountPage, ProfilePage, CinemaPage…).
- `design-system/tokens.json`: the tokens, compiled into `ds/tokens.css`.
- `ds/`: what the pages load: `tokens.css`, `bundle.css` and `bundle.js` (`window.NDA`; pages call `NDA.enhance()`), `fonts/`, and `media/` (the films, posters and artwork the guidelines name). These come from the design system as a set: change them together with its guidelines. The site's own additions are `ds/site.css`, `ds/pages.css`, `ds/graphic.css`, `ds/cinema.css` and `ds/staff.css`.

academy.netadao.org shares Neta DAO Radio with netadao.org and links to Fork; netadao.org and fork.netadao.org keep their own design systems in their own repositories.

## Shared presentation

- `css/style.css`: base palette and legacy components.
- `css/editorial.css`: shared editorial layouts, responsive behavior, forms, and accessibility.
- `js/site.js`: mobile navigation and keyboard disclosure controls.
- `sex-and-or-love.html`: reference seminar layout and syllabus.

## Film-title reveals

`js/seminar-data.js` is the canonical source for lecture dates, screening titles,
and reveal times. `js/seminar-screenings.js` controls title visibility. Set `startsAt`
to an ISO timestamp with an explicit UTC offset. A `null` value keeps an
unscheduled title hidden. Previously screened films use `screened: true`.
After editing the schedule, run `npm run sync:schedule` to update the static HTML
fallback. `npm run check:schedule` verifies it is synchronized. The browser also
derives displayed dates and session statuses from the canonical schedule.

The September 30 and October 7, 2026 screenings reveal at 10 p.m. Eastern /
7 p.m. Pacific (UTC−04:00 in Eastern time on those dates). The interface checks
every second and when a background tab becomes visible. Titles appear only after
the existing enrollment check succeeds. The later screenings remain TBD.

This is a spoiler-control interface, not a confidentiality boundary: titles are
present in the public source, and reveal timing uses the browser clock. Firebase
continues to enforce access to protected reading URLs. Strong embargoes would
require storing unreleased titles behind server-enforced release rules.

Run the reveal boundary and enrollment-state tests with:

```sh
node --test tests/screenings.test.mjs
```

## Accounts and enrollment

`account.html` is the shared email/password sign-in, account creation, recovery,
and seminar enrollment page. Pass `?seminar=sex-and-or-love` (or either Coining
Reason unit ID) to preserve seminar context. `returnTo` accepts only known local
Academy pages. New participants choose a password before requesting enrollment.
Creating an account does not approve enrollment.

Read **[the authentication rollout guide](docs/auth-rollout.md) before deploying**.
The database rules and enrollment ownership model must be deployed together with
this frontend. New signup deliberately stays disabled until the server-managed
`academyConfig/passwordAccountsEnabled` flag is true. Existing sign-in works
without that flag. No Firebase configuration changes are made by this repository.

Tests (Node 22+ and Java 21+ for the Firebase emulators):

```sh
npm ci --ignore-scripts
npm test
npm run test:rules
python tests/check-source.py
```

The emulator command uses `demo-academy`, local fake accounts, and local database
data. It does not send real email or change production users. Browser previews
still use the real Firebase project; do not submit fake accounts there.

## Participant next-event panel and screening announcement

An enrolled participant sees the next event and its lecture readings above the
overview on `sex-and-or-love.html`. Signed-out and pending participants retain the
public overview. The panel uses the same enrollment result and the same reading
list as the syllabus, clears on loss of enrollment, and advances automatically.

`js/seminar-now.js` derives the next event from `js/seminar-data.js`.
The canonical data also defines the four-hour screening window.
October 14 is currently a calendar date in Eastern time: no lecture start time has
been supplied. It remains “today” through that Eastern calendar day; subsequent
sessions with no announced dates stay explicitly TBD. Film starts are in
`js/seminar-data.js`. The schedule uses the visitor's clock.

The shared announcement appears at 10 p.m. Eastern on each scheduled screening
night and disappears exactly four hours later, at 2 a.m. Eastern. It stays visible
through the pre-film conversation and the screening, regardless of whether the
broadcast is offline, interrupted, or finished. It does not poll the streaming
server or claim that the film is live. The participant panel likewise retains the
current screening until the four-hour window ends, then advances to the next event.
Open tabs update every second and recheck when brought back into view.

The banner wraps naturally on mobile, measures its own height, and reserves space
below the navigation rather than overlaying page content. It is public navigation
to Cinema; access there still requires enrollment. Future film titles are not
included in the banner. It does not appear on Cinema itself, admin, or account/password
pages. `.preview/` is ignored local design/test output; do not publish it.

## Seminar navigation and design maintenance

Both seminar pages have a sticky local index. `js/local-navigation.js` measures
its height and follows the current section. The masthead, scheduled screening
banner, and local index each reserve their own space for anchor navigation.

`js/seminar-public.js` updates dates, screening completion, and session badges
without depending on Firebase. Authentication still controls film-title visibility,
reading URLs, and the enrolled participant panel. Sessions remain in progress
through their Eastern lecture day; undated sessions explicitly show Date TBD.

The accepted syllabus treatment is plain lecture dates/readings followed by a
smaller pale blue screening panel, below its screening-date summary. Pink marks
current status. Past screenings use neutral text and a Screened label, without
additional gray boxes. Keep this hierarchy when extending the site.

See [the design sprint record](docs/design-sprint.md) for coverage and remaining
production work. No publishing or production configuration is performed by these
local changes.
