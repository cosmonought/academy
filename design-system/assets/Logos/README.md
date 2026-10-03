# Logos

- `wordmark-ink.svg` — "NETA DAO ACADEMY" outlined from NDA Display Bold (Archivo) as the live Wordmark sets it, single ink `#050505` (`ink`, Paper). For light grounds where the font can't load: email, social cards, PDFs. On the site use the live-text Wordmark.
- `wordmark-paper.svg` — the same outline in `#fafaf2` (`paper`). For dark grounds.
- `fork-wordmark-ink.svg` — Fork's mark, cut: FORK in `#050505`, cut along the slash, the lower half set down and right; the slash runs `#C9338A` to `#5B8EF0` at 90%. For light grounds outside the site, where nothing can hover, so the mark shows cut. On the site use the inline ForkMark, which is whole until hovered.
- `fork-wordmark-paper.svg` — the same mark with FORK in `#fafaf2`, for dark grounds. The slash is the same in both.
- `neta-mark-paper.png`, `neta-mark-night.png` — Neta DAO's mark, the parent organisation's: its white N crossed by a gradient bar, a still from Neta DAO's own logo film (the rest frame, 251×192, transparent). `-night` keeps the white N for dark grounds; `-paper` sets the N in ink so it reads on Paper, the bar unchanged. Supplied artwork, not a redrawing: use it only as the SiteFooter's link back to netadao.org, never redraw, recolour or crop it.
- `neta-mark-loop.webp` — Neta DAO's logo film itself, as netadao.org shows it in its footer (160×106, animated, a white N on black, looping). The SiteFooter's mark on Night, its black blended into the page (`mix-blend-mode: lighten`); `neta-mark-night.png` stands in under reduced motion. It exists only with the white N, so Paper keeps the still `-paper` mark. Supplied artwork: never redraw or recolour it.
- `monogram-a.svg` — the current favicon: a cream "A" on `#080808`, drawn in a system sans before this system. Copied verbatim from the site.
- `app-icon-512.png`, `apple-touch-icon.png` — the current app icons (same "A"), 512px and 180px.

The SVGs can't inherit `currentColor` through `<img>`; pick the file whose ink matches the ground.
