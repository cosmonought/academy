# SessionRow

A syllabus session: number and status in a 100px margin, the title in NDA Display, then the lecture date and readings on the page, then a smaller pale-blue panel of screenings.

## The accepted hierarchy
- Lecture date, then readings, on plain `paper`. Then the screening summary line (`screening-ink`, film icon) and the subordinate `screening-bg` panel with compact rows divided by `screening-rule`.
- **Pink marks the present**: the current session gets a 3px `pink-mark` rule, a `pink` title one size up (`display-session-lg`) and the In progress badge; the current screening gets a `pink-mark` left edge and the only "Stream here →" link.
- Past screenings: `ink-dim` text and a Screened label, no grey boxes. Past sessions collapse into `<details>` with +/−.
- Undated sessions say Date TBD. Never invent a time.

## You provide
- Wrap rows in `.nda-sessions` (a container: rows stack under 640px of its width).
- Session number, title, status; lecture `<time>`; readings (a locked one shows "Enrollment required" in `ink-dim`, an open one links in `blue`); screening rows with title, date and either Screened or the stream link. Film titles stay hidden until the reveal time; that logic lives in the site's js/seminar-screenings.js.

## Markup
```html
<div class="nda-sessions">
<article class="nda-session nda-session--current" id="session6">
  <header class="nda-session__head">
    <span class="nda-session__num">Session 6</span>
    <h3 class="nda-session__title">Love’s Measure</h3>
    <span class="nda-status nda-status--current">In progress</span>
  </header>
  <div class="nda-session__body">
    <h4 class="nda-session__phase"><span>Lecture — <time datetime="2026-10-14">14 October 2026</time></span></h4>
    <ul class="nda-readings">
      <li>Lauren Berlant, <em>Desire/Love</em> — <span class="nda-readings__locked">Enrollment required</span></li>
      <li>Alain Badiou, <em>In Praise of Love</em> — <a href="#">PDF</a></li>
    </ul>
    <h5 class="nda-session__screening-summary"><span>Screenings — <time>16 September, 23 September, 30 September, 7 October 2026</time></span></h5>
    <ol class="nda-screenings" aria-label="Film screenings">
      <li class="nda-screenings__item--past"><span class="nda-screenings__title"><b>Haute Goût,</b> Love’s Gastronomy, or—the Mouth</span><span class="nda-screenings__date">16 September</span><span class="nda-status nda-status--past">Screened</span></li>
      <li class="nda-screenings__item--past"><span class="nda-screenings__title"><b>Peccatum Originale,</b> Love’s Genealogy, or—the Mother</span><span class="nda-screenings__date">23 September</span><span class="nda-status nda-status--past">Screened</span></li>
      <li class="nda-screenings__item--past"><span class="nda-screenings__title"><b>Bad Blood,</b> Love’s Education, or—the Other</span><span class="nda-screenings__date">30 September</span><span class="nda-status nda-status--past">Screened</span></li>
      <li class="nda-screenings__item--current"><span class="nda-screenings__title"><b>Après-Coup,</b> Love’s Oblivion, or—the Eye</span><span class="nda-screenings__date">7 October · 10:00 p.m. Eastern / 7:00 p.m. Pacific</span><a class="nda-screenings__link" href="/cinema.html">Stream here →</a></li>
    </ol>
  </div>
</article>
</div>
```
Past session (collapsed):
```html
<details class="nda-session nda-session--past" id="session5">
  <summary class="nda-session__head">
    <span class="nda-session__num">Session 5</span>
    <h3 class="nda-session__title">Feminine Sexuality</h3>
    <span class="nda-status nda-status--past">Past</span>
  </summary>
  <div class="nda-session__body">
    <h4 class="nda-session__phase"><span>Lecture — <time datetime="2026-08-12">12 August 2026</time></span></h4>
    <ul class="nda-readings">
      <li>Sigmund Freud, “Femininity,” from <em>New Introductory Lectures on Psycho-Analysis</em> — <span class="nda-readings__locked">Enrollment required</span></li>
      <li>Catherine Malabou, <em>Pleasure Erased: The Clitoris Unthought</em> — <span class="nda-readings__locked">Enrollment required</span></li>
    </ul>
    <h5 class="nda-session__screening-summary"><span>Screening — <time datetime="2026-08-05">5 August 2026</time></span></h5>
    <ol class="nda-screenings" aria-label="Film screenings">
      <li class="nda-screenings__item--past"><span class="nda-screenings__title">Title shown to enrolled participants</span><span class="nda-screenings__date">5 August</span><span class="nda-status nda-status--past">Screened</span></li>
    </ol>
  </div>
</details>
```
