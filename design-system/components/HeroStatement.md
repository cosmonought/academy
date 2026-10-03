# HeroStatement

The homepage statement, "Neta DAO Academy is the home of Web3 and THOUGHT", set as three lines that each span the hero column, with THOUGHT filled by the pigment film.

## Use
- Homepage only. It spans the page (`nda-hero--page`): the statement runs the full width of the row at the intro's own scale, but never taller than the first screen leaves room for (`--nda-hero-room`, 170px, for the tags and a glimpse of the panels below). In a narrower column, leave the modifier off and the lines fit the column.
- The tag line under it fades in one tag at a time, "For a more open tomorrow" a beat later, once the statement is on screen (after the intro on a first visit): `data-nda-sequence` on the TagList, see TagList.
- It is the page's `<h1>`: screen readers hear one sentence; the line breaks are visual.
- THOUGHT is the only animated word on the site. Everything else in the statement is solid `ink`.
- **One gap between lines.** The lines are spaced by their letters, not their boxes: each baseline sits `--nda-line-gap` (2.4% of the column) above the next line's cap top, so NETA DAO ACADEMY to IS THE HOME OF WEB3 AND and IS THE HOME OF WEB3 AND to THOUGHT read as the same gap. The `h1` is a flex column so the margins that do this add up exactly; don't wrap the lines in other blocks.

## You provide
- A column. Each `.nda-hero__line` fills it: font-size is `100cqi / --nda-fit`, where `--nda-fit` is the line's width in ems. The inline values are measured for NDA Display (Bold lines, Heavy THOUGHT); `NDA.fit()` re-measures the ink after the font loads, so edited copy still fits.
- The pigment film files (see LiquidWord). Host them yourself and change the paths.

## Markup
```html
<section class="nda-hero" aria-labelledby="hero-title">
  <h1 class="nda-hero__title" id="hero-title">
    <span class="nda-hero__line" data-nda-fit style="--nda-fit: 6.536">Neta DAO Academy</span>
    <span class="nda-hero__line" data-nda-fit style="--nda-fit: 8.606">is the home of Web3 and</span>
    <span class="nda-hero__line nda-hero__line--word" data-nda-fit style="--nda-fit: 3.697">
      <span class="nda-liquid" data-nda-liquid>
        <video class="nda-liquid__media" poster="/ds/media/pigment-poster-ink.webp" data-poster-dark="/ds/media/pigment-poster-cream.webp"
               muted loop playsinline preload="auto" aria-hidden="true">
          <source src="/ds/media/pigment-loop-ink.webm" data-src-dark="/ds/media/pigment-loop-cream.webm" type="video/webm">
          <source src="/ds/media/pigment-loop-ink.mp4" data-src-dark="/ds/media/pigment-loop-cream.mp4" type="video/mp4">
        </video>
        <span class="nda-liquid__word">Thought</span>
      </span>
    </span>
  </h1>
  <ul class="nda-taglist" aria-label="What the Academy gathers">
    <li>Ideas</li><li>Community</li><li>Discipline</li><li>For a more open tomorrow</li>
  </ul>
</section>
```

## Sizes
At a 1440px desktop the lines land near `display-md` (74px), `display-sm` (55px) and `hero-word` (130px, drawn 1.6 times as tall). Don't set these sizes by hand; fit the lines.

## Don't
- Don't add a fourth line, a lede paragraph inside the heading, or a second liquid word.
- Don't put the hero on a wash or an image: the film is keyed against `paper`.
