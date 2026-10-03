# AccessTile

A "Seminar access" tile: index rule, one giant word (Current, Upcoming, Archive) and a CircleLink, the whole tile clickable.

## Use
- Not on the homepage for now: with one seminar in each state, the program panels carry their state themselves. Keep it for when there is enough to sort (several seminars, a real archive), on the homepage or the seminars page.
- Three in a row under the `text-heading` "Seminar access", divided by `rule-strong`.
- Hover or focus fades in the pigment wash, the film drifting slowly behind the tile; the preview pins it on the first tile.
- Inside `.nda-columns` the first tile drops its left padding and the last its right, so text lines up with the heading and the gutter.

## You provide
- Number, label, the word (it fits up to UPCOMING at the default `--nda-fit: 3.8`), the link's two lines and `href`. The CircleLink's `::after` covers the tile.

## Markup
```html
<section class="nda-access-group" aria-labelledby="access-title">
  <h2 class="nda-section-heading" id="access-title">Seminar access</h2>
  <div class="nda-columns">
    <article class="nda-access nda-wash">
      <p class="nda-index"><span class="nda-index__num">01</span><span class="nda-index__label">Current</span></p>
      <h3 class="nda-access__title">Current</h3>
      <a class="nda-circle-link" href="/seminars.html#current">
      <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
      <span class="nda-circle-link__label"><span class="nda-circle-link__line">View</span><span class="nda-circle-link__line">current seminars</span></span>
    </a>
    </article>
    <article class="nda-access nda-wash">
      <p class="nda-index"><span class="nda-index__num">02</span><span class="nda-index__label">Upcoming</span></p>
      <h3 class="nda-access__title">Upcoming</h3>
      <a class="nda-circle-link" href="/seminars.html#upcoming">
      <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
      <span class="nda-circle-link__label"><span class="nda-circle-link__line">View</span><span class="nda-circle-link__line">upcoming seminars</span></span>
    </a>
    </article>
    <article class="nda-access nda-wash">
      <p class="nda-index"><span class="nda-index__num">03</span><span class="nda-index__label">Archive</span></p>
      <h3 class="nda-access__title">Archive</h3>
      <a class="nda-circle-link" href="/seminars.html#archive">
      <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
      <span class="nda-circle-link__label"><span class="nda-circle-link__line">View</span><span class="nda-circle-link__line">archive</span></span>
    </a>
    </article>
  </div>
</section>
```
