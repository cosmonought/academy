# ProgramPanel

A homepage panel for one program (course, seminar or the journal): index rule, title in NDA Display Bold, a two-line mono subtitle and, if the row uses it, the program's own artwork. The whole panel is one link.

## Use
- On the homepage, one row of four under the statement, divided by `rule-strong` hairlines (`.nda-columns`): each real program once, current first (Sex, and/or Love, Coining Reason, Sex, Monsters, and Superheroes, Fork). The row bleeds into the gutters by a panel's padding so the four are the same width.
- **Each program has its own hover** (and keyboard focus), so a row of them doesn't repeat one effect, and none lifts its panel out of the row (no shadows or drops: the hovered panel must not look more current than the others). Sex, and/or Love's is the pigment wash (`nda-wash`), the film itself drifting slowly behind the panel while it is hovered or focused (`NDA.wash()`; the still under reduced motion). Coining Reason's is still: a banknote's guilloche band, engraved in `ink` at 60%, fades in across the title, the band as tall as its two lines and the full width of the panel (`nda-engrave`, the lines from `--nda-engrave-image`, sized in `cqi` so it scales with the panel). The Graphic's is its own page's comic panel, flat: a 2px ink frame and pale yellow Ben-Day dots (`nda-comic`). Fork's is its own site's stock: the panel turns Fork's ice blue-grey (`#E3EAF0`) and its type Fork's charcoal navy (`#17202C`, `#46515F` for the subtitle), while the mark cuts (`nda-fork`). None of the three moves. `.is-washed` pins the state, as in the preview.
- **Artwork is optional, per row.** With it, each panel ends in its program's own 4:3 artwork (Sex, and/or Love's flowers, Coining Reason's Socrates and coin, the comic covers from Sex, Monsters, and Superheroes' title card), greyscale at rest and in colour on hover and focus; set `--nda-art-rest: none` to keep it in colour. Without it the row is index, title, subtitle and nothing else. Use one choice for the whole row; never stand in pigment stills or stock images for missing art.
- **Fork is the exception**: its title opens with the ForkMark instead of the word FORK, with "The Journal" under it on one line, set smaller to fit the panel (`nda-program__title-tail`, `100cqi / 4.8`); its hover is `nda-fork` (above), and the mark cuts with it (the slash draws across and the lower half slips; see ForkMark). It has no artwork in either row, and ends in the CircleLink "Explore / the journal" at its foot.
- Titles are solid `ink`. Only THOUGHT carries the film.

## You provide
- Index number and either the kind ("Course", "Journal") or, on the homepage, the program's state as a StatusBadge (Active, On hiatus, Forthcoming); title; subtitle as two short lines; optionally the artwork `<img class="nda-program__image">` with `alt=""`, because the title already names it.
- The link `href` on the title; `.nda-program__link::after` stretches it over the panel.
- Long words: the title size is `100cqi / --nda-fit` (default 3.25, enough for COINING, JOURNAL, AND/OR). For a longer word set `style="--nda-fit: 5"` (SUPERHEROES) or run `NDA.fit` on a single-line title.

## Markup
```html
<article class="nda-program nda-wash">
  <p class="nda-index"><span class="nda-index__num">01</span><span class="nda-index__label">Course</span></p>
  <h2 class="nda-program__title"><a class="nda-program__link" href="/CoiningReason/">Coining Reason</a></h2>
  <p class="nda-program__subtitle">Money, value and<br>the social imaginary</p>
  <img class="nda-program__image" src="/ds/media/art-coining-reason.webp" alt="" width="960" height="720" loading="lazy">
</article>
<article class="nda-program nda-wash">
  <p class="nda-index"><span class="nda-index__num">02</span><span class="nda-index__label">Seminar</span></p>
  <h2 class="nda-program__title"><a class="nda-program__link" href="/sex-and-or-love.html">Sex, and/or Love</a></h2>
  <p class="nda-program__subtitle">Desire, identity and<br>the politics of intimacy</p>
  <img class="nda-program__image" src="/ds/media/art-sex-and-or-love.webp" alt="" width="840" height="630" loading="lazy">
</article>
<article class="nda-program nda-fork">
  <p class="nda-index"><span class="nda-index__num">03</span><span class="nda-index__label">Journal</span></p>
  <h2 class="nda-program__title"><a class="nda-program__link" href="https://fork.netadao.org"><span class="nda-visually-hidden">Fork: </span><span class="nda-forkmark"><svg …>…</svg></span><!-- ForkMark markup --> <span class="nda-program__title-tail">The Journal</span></a></h2>
  <p class="nda-program__subtitle">Critical writing for<br>a more open tomorrow</p>
  <p class="nda-program__actions"><a class="nda-circle-link" href="https://fork.netadao.org">
    <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
    <span class="nda-circle-link__label"><span class="nda-circle-link__line">Explore</span><span class="nda-circle-link__line">the journal</span></span>
  </a></p>
</article>
```
The Fork title's mark is the ForkMark markup in full.

## Actions
A panel is one link (to the program's page), but a program with something to do now carries that action at its foot, above the panel link: Sex, and/or Love's **Late enroll** (to account creation with the seminar chosen), Coining Reason's **View archive** (to its units, on hiatus), the forthcoming seminar's **Express interest**. `<p class="nda-program__actions">` holding an outline small Button; it sits at the panel's foot so the actions align across the row. One action per panel, and only a real one.

## Status
On the homepage the state sits in the index rule: `<span class="nda-index__label"><span class="nda-status nda-status--current">Active</span></span>`. Where the label must name the kind, put the StatusBadge after the subtitle instead (`<p class="nda-program__meta">…</p>`).
