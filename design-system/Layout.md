# Layout

The homepage is a front page cut to what the Academy runs: a sticky header, the statement across the page, one row of four program panels, and a footer, inside `space-8` gutters and divided by hairlines.

## Desktop grid (1200px and up)

| Row | Columns | Contents |
| --- | --- | --- |
| Header | `--nda-lead` 37% · rest · auto | Wordmark (docked in once the statement's first line scrolls under it) · navigation and radio · the account action |
| Hero | one, the full width | HeroStatement (`nda-hero--page`), the tag line under it |
| Programs | four equal columns | ProgramPanels, type only, current first: Sex, and/or Love · Coining Reason · Sex, Monsters, and Superheroes · Fork; a program's action (Late enroll, Express interest) at its foot |
| Footer | auto · 1fr · auto | Two rows: wordmark · X, Discord and Neta DAO's mark (linking to netadao.org) · copyright, then the disclaimer. The site's own pages live in the sticky header only |

- Rows are `.nda-row` (padding `space-7` × gutter); columns are `.nda-columns` with the template in `--nda-columns`. Every column after the first gets a 1px `rule-strong` left border.
- The statement fills the row at the intro's scale but never grows taller than the first screen minus `--nda-hero-room` (170px), so the panels' index rules show at the fold on a 1440×900 screen.
- The program row bleeds into the gutters by a panel's padding (`space-4`), so all four panels keep their padding and are the same width. The actions pin to the panels' foot with `margin-top: auto` and align across the row.
- A full-width 1px `rule` sits under the header, under the statement and above the footer.

## Tablet (760–1199px)

- The statement still spans the row; the program panels go two by two.
- The header collapses to wordmark, radio and Menu below 1024px of its own width.

## Phones (under 760px)

- Everything stacks in one column with `space-6` gutters; column dividers become `rule-thin` rules above each panel, and every panel sits on the gutter.
- The statement keeps its shape at the column's width; the tags wrap to two lines.
- ProgramPanel titles size by their own width (container units), so they stay fitted.

## Content pages

- Seminar pages: SiteHeader, optional ScreeningBanner, a cover (kind and state, the title fitted to the copy column, the subtitle, the lede and description, Late enroll), with the seminar's artwork filling the right of the cover and fading out toward the copy; the facts in hairline columns, `.nda-sessions` with SessionRows, then how to enroll. A seminar with its own visual language (Sex, Monsters, and Superheroes) keeps the shell (header, facts, sessions, enrollment, footer) and brings its own cover.
- Enrollment: one form for account and request, the three steps across the top, the seminar beside it (EnrollPage).
- Account: a working column (the forms) beside a help column of short Q&As on hairlines. One form shows at a time: sign in or create an account as mono tabs, then set or reset a password, then, once signed in, request enrollment. A pink-ruled context line names the seminar the visitor came from. Password fields carry a Show toggle (AccountPage, AccountStates).
- Profile: the person's name as the display title, their email and X handle in mono, then tabs: Student, Teacher (instructors and teaching assistants only) and Account. Student: each seminar is a record row, title and StatusBadge on the left, Attendance · Evaluation · Seminar on the right, with the attendance record folding open; finished seminars close the tab as the transcript (ProfilePage, ProfileStates).
- Teacher: one seminar at a time, numbered with IndexRules on `rule-strong` dividers. 01 Attendance runs full width: one table, participants down the left (sticky), every meeting across the top, scrolling sideways and opening on the current meeting with its pink rule; one box per cell, present or absent. Below it, 02 Enrollment (requests, then participants with Unenroll on each row) and 03 Evaluations side by side, stacking below 1200px (ProfileTeacher).
- Participate: three numbered ways in, in IndexRule columns, each ending on one action (ParticipatePage).
- Staff (admin): a working layout in the system's type and colour. Tables on hairlines with data in mono, StatusBadges for status, the Teacher tab's attendance table (present or absent), account assistance in a side column. Tables scroll sideways on phones (AdminPage).
- Coining Reason, a series of units: the seminar cover and facts, then a switcher (Current unit · Archive · Roadmap) as three large tabs on the row's rule, the unit's name in the display face beside its summary, its sessions as SessionRows with a `rule-strong` line where the unit paused, and the roadmap as ten tiles, five to a row on hairlines, the open one underlined in ink with its summary and topics below (CoiningReasonPage).
- The Graphic (Sex, Monsters, and Superheroes) keeps the shell and brings comic panels inside it: 2px ink frames with a hard 8px drop on 20px gutters, Night panels inverted, the syllabus as a comic page of panels in rows of differing splits, printed in eight comic process colours, every one dotted (yellow, cyan, green, orange, red, purple and brown tints that stay light in both themes, and one charcoal), no panel beside or under its own colour. Magenta is held back: pink is the page's neon (the cover's Sex, sign) and marks the current session, with a pink frame, drop, dots and a Now! burst; held sessions print in black. The cover's red stays on the cover. The three description captions are numbered in reading order (left, across to the right, back left), and Lil D peeks over the format panel from the corner beside them (TheGraphicPage, TheGraphicSyllabus).
- The SeminarPage, SeminarsIndex, EnrollPage, CinemaPage, CoiningReasonPage, TheGraphicPage, TheGraphicSyllabus, AccountPage, ProfilePage, ProfileTeacher, ParticipatePage and AdminPage drafts lay these out; AccountStates and ProfileStates show the other states of the account and profile pages.
- Cinema: Night, the header tucks away on scroll (`data-nda-autohide`), the player and the chat side by side.
- One accent per page: pink marks what is happening now (current session, current screening). Do not add other colours.
