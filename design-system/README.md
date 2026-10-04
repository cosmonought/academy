Neta DAO Academy runs free public seminars that read Web3 through philosophy, psychoanalysis, economics, law, art and religion, and publishes *Fork*, its journal. The identity is a broadsheet: off-white paper, black ink, enormous condensed capitals, hairline rules, and one moving thing on the page, the pigment inside **THOUGHT**, which a first-visit intro reaches by running the disciplines through the statement.

## Using this system

- Load `tokens.css`, the fonts in `fonts/`, `components/bundle.css` and `components/bundle.js`, then call `NDA.enhance()` once the page has loaded. Components are HTML and CSS patterns with a small vanilla-JS enhancer on `window.NDA`; there is no framework layer, matching the site's no-build static pages. Copy each component's markup from its guideline.
- **Paper** (light) is the default theme. **Night** (dark) is for the intro and screening contexts: put `data-theme="dark"` on that section, never on the whole site.
- Host the media yourself. Set `--nda-wash-image` to your copy of `assets/Imagery/pigment-wash.webp` and `--nda-wash-film-webm` / `-mp4` to your copies of the wash films (`assets/Motion/pigment-wash-paper.*`, and `pigment-wash-night.*` under `[data-theme="dark"]`), point LiquidWord's sources at your copies of the four pigment loops in `assets/Motion`, and IntroSequence's at the kinetic films beside them.
- **The display face is Archivo**, free under the SIL Open Font License (`fonts/Archivo-OFL.txt`), so the site can host it. `NDA Display` Bold and Heavy are static cuts of it, condensed to the widths and weights the intro film was measured at (width 62 / weight 692 and width 67.5 / weight 898); `Archivo` is the variable font itself, which the intro uses for its disciplines. Host the three files with the rest of `fonts/`. The stack falls back to Arial Narrow, which `NDA.fit` re-measures, so lines still fit. `fonts/Satisfy-Regular.woff2` (Google Fonts, OFL) is The Graphic's neon script, for its cover's Sex, only.
- Start a new page from the `Homepage` page card or one of the page drafts (SeminarPage, CoiningReasonPage, TheGraphicPage, SeminarsIndex, EnrollPage, CinemaPage, AccountPage, ProfilePage, ProfileTeacher, ParticipatePage, AdminPage), or from SiteHeader + content + SiteFooter.

## Content fundamentals

- **Voice**: plain, curious, exact. An open seminar talking to adults, not a startup. Say what something is and who it is for: "Free public seminars exploring Web3 through economics, philosophy, politics, psychoanalysis, law, ecology, business, art, and religion."
- **Casing**: write source text in sentence case ("Seminar access", "Explore the journal") and let CSS set the capitals. Display type, labels, buttons and small section heads are uppercase by style, never typed in caps, so screen readers and copy-paste get normal text.
- **Names are exact**: "Neta DAO Academy" (DAO in caps), "Sex, and/or Love" (comma and slash), "Coining Reason", "Sex, Monsters, and Superheroes", "Fork" or "Fork: The Journal". Where Fork is named as a brand in display (its panel title, the journal blocks) the ForkMark stands in for the word. Seminar subtitles are the seminar's own ("Psychoanalysis and the Science of Desire").
- **The statement**: "Neta DAO Academy is the home of Web3 and Thought". The intro sets it without "is" ("Neta DAO Academy / the home of Web3 and"), as the film does; it opens on "…and Philosophy", runs real disciplines beneath it, then lands on THOUGHT. Only real disciplines appear in it.
- **Numbers**: two digits in sequences (01, 02, 03); "Session 6" in syllabi.
- **Dates and times**: "14 October 2026", "10 p.m. Eastern", "10 p.m.–2 a.m. Eastern". Unknown is "Date TBD". Never invent a time.
- **Status words** are fixed: In progress, Next, Scheduled, Date TBD, Past, Screened; Active, On hiatus. A banner says "Screening night", never "Live now".
- **Actions**: verb first, short. Navigation gets an arrow: "View seminar →", "Open Cinema →", "Stream here →"; another site gets ↗ ("Visit the journal ↗"). CircleLink labels split verb and object over two lines: "View / current seminars".
- **Addresses**: an email address is written as plain text, never a `mailto:` link (people close the mail app and the message is lost). Anything a visitor sends us goes through a form that saves to the database and appears in Admin.
- **Taglines** are short noun lists with no punctuation between items: "Ideas  Community  Discipline  For a more open tomorrow"; "Research  Peer reviewed  Open access  Interchain".
- No emoji, no exclamation marks, no hype ("revolutionary", "unlock", "the future of").
- Footer: "© Neta DAO Academy · All rights reserved", on one line with the wordmark and the off-site links. No disclaimer.

## Visual foundations

### Colour

- The page is `paper`; text, display type, rules, circles and filled buttons are `ink`. Most of every view is these two.
- `ink-mid` for secondary reading copy, `ink-dim` for metadata, dates, locked readings and past states. Both sit on `paper` (and `ink-dim` on `screening-bg`); never on washes or images, where everything is `ink`.
- Three rules, all 1px: `rule` for full-width section rules, `rule-strong` for vertical column dividers and control borders, `rule-thin` inside IndexRules and between list rows.
- `pink` means **now**: In progress, Active, the current session's title, "Stream here →", text-link hover. `pink-mark` draws its square, the 3px current-session rule and the current screening's edge. Nothing decorative is pink.
- `blue` is for links inside reading lists and the Next status, on `paper` only. `focus` is the keyboard ring.
- `screening-bg` / `screening-ink` / `screening-rule` make the subordinate screening panel in a syllabus; `banner-bg` is the screening-night banner. Both are the only tinted surfaces.
- The `pigment-*` colours are sampled from the pigment film and belong to imagery: the THOUGHT loop, the intro's kinetic film, the hover wash, the cover. Never set text or a UI fill in a raw pigment; use the role tokens that alias them (`pink`, `pink-mark`, `blue`, `focus`).
- No CSS gradients in the interface; colour movement lives in the film. The one gradient is the slash inside the Fork mark, which belongs to that mark and goes nowhere else.

### Type

- **Display: NDA Display** (Archivo, cut condensed), uppercase, leading 0.8–0.9, set tight with open word spaces as in the intro film: statement lines `-.05em` tracking and `.1em` word spacing (`--nda-display-tracking`, `--nda-display-words`), titles `-.03em`. **Bold (700)** for every display line, from `display-session` (28px) to the hero's lead line; **Heavy (800)** only for THOUGHT (`hero-word`, tracked `-.03em` so its letters never touch), which is also drawn 1.6 times its natural height (`--nda-word-stretch`) so its capitals are 30% of the column, as the film draws it.
- **The intro's disciplines** are the one place the display face varies. As in the film, they are heavier, a little wider and more loosely spaced than the statement above them: each is set in **Archivo** (`display-widths`, the variable font) at its own width and weight, from a condensed bold-and-a-bit (width 62–75, weight 730–850) to CIVICS at full width and Black (102, 900), with normal tracking. Each has its own size too, so the rows crowd and push each other rather than sit as a list. Nowhere else.
- Giant words are *fitted* to their column (`data-nda-fit`, `--nda-fit`), not set at a fixed size, so a line always spans its column like the mockup's. The fit counts the ink, not the advance, so tight tracking never pushes a line past its column.
- Stacked display lines are spaced by their letters, not their boxes: baseline to the next line's cap top is `--nda-line-gap` (2.3% of the column) whatever the two sizes; `NDA.lineGaps` measures the rendered lines and nudges them so every gap matches to the pixel.
- **Labels: IBM Plex Mono**, uppercase, 11–13px. `mono-label` for navigation, index labels and status; `mono-wide` for taglines, subtitles and CircleLink labels; `mono-index` (bold) for 01/02/03; `mono-button`; `mono-meta` for small print.
- **Reading: Barlow.** `text-body` (17/1.7) for seminar copy and reading lists, `text-lede` for intros, `text-small` and `text-caption` for notes, `text-heading` (bold caps) for small section heads such as "Seminar access", `text-field-label` for forms.
- Outside the intro one display word carries the pigment film: THOUGHT, in the hero. Inside the intro the kinetic film also stains a few of the disciplines (most are cream) before it settles in a band through THOUGHT. Program titles are solid `ink`.

### Layout

- Columns separated by 1px `rule-strong` verticals; rows separated by full-width 1px `rule`. No cards, boxes or shadows: the rules do the structuring.
- Every panel opens with an IndexRule ("01 —— Course", or on the homepage its state: "01 —— ■ Active") and ends with its action (a CircleLink), its image or its subtitle.
- Gutters: `space-8` (40px) on desktop, `space-6` (24px) on phones. Panel padding `space-4`. Reading copy stops at `measure` (640px). Content centres at `page-max` (1600px).
- The header is sticky on every page; on the homepage it starts without its wordmark (the statement is the masthead), and on Cinema it tucks away while you scroll down.
- The Layout section has the homepage grid and how it stacks.

### Imagery

- Each seminar's own artwork lives on its page and in the seminars index, not on the homepage: Sex, and/or Love's red flowers (`art-sex-and-or-love.webp`), Coining Reason's Socrates with the coin (`art-coining-reason.webp`), the comic covers from Sex, Monsters, and Superheroes' title card (`art-sex-monsters-superheroes.webp`). On a seminar page the artwork fills the right of the cover and fades out toward the text (as on Coining Reason's page); in the seminars index it sits greyscale and takes its colour on hover. The homepage's one image is THOUGHT's film. Never fill a missing program's slot with pigment stills or stock images.
- The pigment appears as film: in THOUGHT, in the intro, and as the wash moving behind a hovered panel. Never as a still in a panel; the wash's still only stands in while its film loads and under reduced motion.
- Decorative images get `alt=""`.

### Motion and states

- **Hover and focus on a panel**: the pigment wash fades in over `dur-wash` (450ms, `ease-out`), the film itself moving slowly behind the panel, and the panel's artwork turns to colour. On the homepage each program has its own hover: the wash for Sex, and/or Love; Coining Reason's guilloche band engraved across its title; The Graphic's flat comic panel (frame and Ben-Day dots, no drop, so it never looks more current than the rest); and for Fork its own site's stock, ice blue-grey with its type in Fork's charcoal navy, as the Fork mark cuts (the slash draws across and the lower half slips).
- CircleLinks fill with `ink`; text links turn `pink`; buttons darken to `ink-mid`, all over `dur-fast`.
- **Focus**: 3px `focus` outline at 4px offset on everything focusable (whole panels draw it inside their edge).
- **THOUGHT** loops the pigment film continuously while on screen and pauses off screen.
- **The intro** (first visit, Night): it opens on a still: the statement over PHILOSOPHY, the paint moving in its letters, for a second; then HISTORY OF SCIENCE slides up beneath it; SOCIOLOGY pushes them up, PHILOSOPHY is squashed away and PSYCHOANALYSIS heads the list; then the disciplines, each at its own size, scroll, peel, twist, roll, shiver and pinch, with holds where the film holds, the type mostly cream and the kinetic pigment staining only a few words. At the burst a plum spot of light blooms on the wall behind them and everything is thrown out of it at once: a few small splashes of thin paint (blue, one magenta) and flat shards of pink, blue and pigment that tumble and hang in the air, lit plum by the spot and casting soft shadows on the wall; the second line is knocked away, leaving four rows; a twisting satin ribbon of paint, blue on one face and magenta on the other, flicks through the rows (the film's own ribbon, frame by frame), in front of the letters and, for a moment, inside them; THOUGHT is peeled in by a right-angled edge whose corner runs from the top of THOU to the lower right, as the line wipes back in and an unstable nucleus of paint explodes in the middle of the page into a glowing magenta and blue membrane, almost to its edges, and fades, and a hairline white bar sweeps across to the homepage. About 12 seconds, skippable. It has the concept film's soundtrack, cut to the same moments, its last ring trailing off under the homepage: it plays where the browser allows (once the visitor has been active, say with the radio on), and otherwise a Sound on button beside Skip intro starts it; Neta DAO Radio is lowered under it while it plays.
- `prefers-reduced-motion: reduce`: THOUGHT shows its poster frame, the wash is its still and switches instantly, so does the Fork cut, and the intro never plays. The Motion section has the details.

### Borders, radii, shadows

- Square by default (`radius-0`): panels, images, inputs, banners, badges. `radius-sm` (4px) only on buttons; `radius-full` only on CircleLinks and the radio.
- `stroke-hairline` (1px) for every rule and input border; `stroke-outline` (1.5px) for circles and icons; `stroke-heavy` (3px) for the current session's rule and the focus ring.
- No shadows, no blur effects, no glass. The intro is the exception: motion blur on its moving words, depth blur on its fragments and their soft shadows on the wall, the smoke and the glowing bloom as THOUGHT comes in, a light grain, the glow of its exit bar.

## Iconography

- Icons are inline SVG line drawings on a 24px box, 1.5px stroke (`stroke-outline`), square caps, drawn in `currentColor`: arrow, magnifier, play, pause, menu, and the syllabus book (lecture) and film-strip (screenings) icons, which come from the current site's syllabus styles.
- Arrows in running text are the characters → and ↗, not icons, and are `aria-hidden`.
- Social links are words (X, Discord, Neta DAO), not logos. No icon fonts, no emoji, no filled or duotone icons.

## Logos

- The mark is the name: "NETA DAO ACADEMY" set in NDA Display Bold (Wordmark). Use live text on the site. The outlined `wordmark-ink.svg` and `wordmark-paper.svg` are the same setting drawn as paths, for where the font can't load. Each SVG is a single fixed ink.
- Never fill the wordmark with the pigment, outline it, stretch it, or track it out.
- **Fork** has its own mark: FORK, cut along a pink-to-blue slash (ForkMark). Inline it is the whole word until hovered, then the cut opens; use it wherever the journal is named as a brand. `fork-wordmark-ink.svg` and `fork-wordmark-paper.svg` are the outlined cut mark for places without hover. Don't recolour the slash.
- **Neta DAO**, the parent organisation, has its own mark: a rounded white N crossed by a glossy pink-to-cyan bar (`neta-mark-paper.png`, `neta-mark-night.png`, stills from Neta DAO's logo film). It appears once, at the end of the SiteFooter's links row, as an unlabelled link back to netadao.org. It is Neta DAO's artwork: never redraw it or set it as an Academy mark.
- The square "A" app icons (`monogram-a.svg`, `app-icon-512.png`, `apple-touch-icon.png`) are the current favicon set, drawn before this system; keep them until a monogram in the display face is commissioned.
