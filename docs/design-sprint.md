# Design sprint record

Local implementation, September 27, 2026. Nothing in this sprint has been published.

## Design baseline accepted by Bradshaw

Session title and status; lecture date followed immediately by readings on the
normal page background; screening-date summary followed by a subordinate pale
blue panel. Use compact screening rows and thin rules. Pink marks current status.
Completed screenings have neutral text and a Screened label, with no gray boxes.
Only the current/nearest scheduled screening receives the enrolled Stream here link.
The public Cinema banner runs from 10 p.m. Eastern for four hours regardless of
playback, including the gathering before the film.

## Original brief coverage

1. **Active program first:** Sex, and/or Love leads the homepage with seminar,
   enrollment, and syllabus links. Coining Reason is secondary and labeled on hiatus.
2. **Separate access management:** dedicated account route; compact seminar access
   regions. Password-first flows are prepared locally. Production rollout is pending.
3. **Editorial syllabus:** accepted lecture/screening hierarchy in Sex, and/or Love;
   a clearer number/title/date grid for Coining Reason, including mobile.
4. **Local navigation:** sticky section links on both seminars, active-section
   indication, Cinema navigation for Sex, and/or Love, and banner-aware offsets.
5. **Dates/status:** one canonical schedule in js/seminar-data.js. Public rendering,
   next-event planning, title reveals, screening links, and session badges use it.
   Static HTML dates are generated with npm run sync:schedule and checked with
   npm run check:schedule. No lecture times have been invented.
6. **Current/next:** enrolled participant panel, current session accents, nearest
   screening link, and automatic public screening-night banner.
7. **Institution/program/journal:** Academy masthead, seminar-specific titles and
   local navigation, distinct Fork Journal destination and homepage description.
8. **Quieter global navigation:** Home, Seminars (categories nested), Fork Journal,
   and sign-in utility. Mobile menu and disclosure keyboard behavior retained.
9. **Editorial identity:** typography, fine rules, restrained blue/pink accents,
   and existing seminar imagery. Further art direction remains an editorial choice,
   not an excuse to add decorative cards or invent imagery/content.
10. **Seminar directory:** consistent title, subtitle, state/date, thesis and action;
    completed Coining Reason units linked from the archive introduction.

## Validation

Node tests cover authentication helpers, date/reveal boundaries, session status,
screening-link advancement, and participant next-event selection. Static schedule
and HTML/script checks are provided. Desktop/mobile browser checks cover both
seminars, the homepage, directory, account entry, local anchors, mobile navigation,
and keyboard roadmap disclosure. Sample enrolled layouts use ignored local fixtures;
no real registrations or messages were submitted during this design pass.

## Remaining production work

Follow auth-rollout.md: review live rules/accounts, verify Email/Password settings,
deploy ownership rules and frontend together, enable the guarded signup flag, and
verify existing-user migration and real password-recovery delivery. Sender-domain
branding and inbox placement cannot be established by a visual preview or emulator.
These changes have not been made in production. Dates for the final two sessions
remain TBD until supplied by the organizer.
