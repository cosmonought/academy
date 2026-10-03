# Wordmark

"NETA DAO ACADEMY" set in NDA Display Bold: the Academy's name is its mark.

## Use
- Header: `nda-wordmark` (36px, `display-wordmark`). Footer: `nda-wordmark--footer` (32px). Large: `nda-wordmark--lg` (56px).
- Live text wherever the fonts load. Where they can't (email, social cards, PDFs), use the outlined SVGs in `assets/Logos`: `wordmark-ink.svg` on `paper`, `wordmark-paper.svg` on dark grounds. Each is a single fixed ink; an `<img>` can't recolor it.
- Always in `ink` (or `paper` on Night). Never filled with the pigment film, outlined, stretched or tracked.

## Markup
```html
<a class="nda-wordmark" href="/">Neta DAO Academy</a>
```
