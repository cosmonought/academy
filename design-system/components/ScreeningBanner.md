# ScreeningBanner

The screening-night announcement under the header: a `pink-mark` square, "Screening night", the seminar and window, and a link into Cinema.

## Use
- Shown from 10 p.m. to 2 a.m. Eastern on scheduled screening nights, on every public page except Cinema, admin and account pages (the site's screening-banner.js decides).
- It is navigation, not a promise the stream is live: never "Live now". No film titles.
- It sits in the flow below the header and wraps on phones; it reserves its own height.

## Markup
```html
<aside class="nda-banner" aria-label="Screening announcement">
  <p role="status"><strong>Screening night</strong> <span>Sex, and/or Love · 10 p.m.–2 a.m. Eastern</span></p>
  <a class="nda-banner__action" href="/cinema.html">Open Cinema →</a>
</aside>
```
