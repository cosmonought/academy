# LiquidWord

One display word with the pigment film moving inside its letters; the film loops continuously while the word is on screen.

## Use
- Only for **THOUGHT** in the homepage hero. No other word, title or panel gets the film; panels answer hover with the pigment wash instead. The intro's THOUGHT is part of IntroSequence and uses the kinetic film.
- The word is NDA Display Heavy, tracked `--nda-word-tracking` (-.03em) and drawn `--nda-word-stretch` (1.6) times its natural height from its top edge, as in the intro film; its bottom margin gives the line that extra height, and its right padding gives back the trailing tracking so the film covers every letter. Set `--nda-word-stretch: 1` for natural proportions.
- Paper (light): the word is keyed with `mix-blend-mode: lighten`, so the film shows through black letters and the paper stays clean. The ink cut of the film (`pigment-loop-ink.mp4`) has its highlights clamped below `paper` for this.
- Night (dark): the blend flips to `darken` and `NDA.liquidWord()` swaps to the cream cut (`pigment-loop-cream.mp4`, pigment over the cream `ink`), so the letters never fall into the black ground.

## You provide
- A display context: put it inside a fitted line or any display element; it inherits size.
- Two `<source>`s, WebM first then MP4, each with the Paper file in `src` and the Night file in `data-src-dark`; `poster` and `data-poster-dark` likewise. All six files are in `assets/Motion`.
- A plain ground behind it. The word's background is `--nda-liquid-ground` (default `paper`); set it if the surface differs.

## Behaviour
- Plays only while at least 5% of the word is in view and the tab is visible; pauses otherwise.
- `prefers-reduced-motion: reduce`: never plays; the poster frame fills the letters.
- Without JavaScript it shows the poster frame through the letters.
- The video is `aria-hidden`; the word itself is real text.

## Markup
```html
<span class="nda-liquid" data-nda-liquid>
  <video class="nda-liquid__media" poster="/ds/media/pigment-poster-ink.webp" data-poster-dark="/ds/media/pigment-poster-cream.webp"
         muted loop playsinline preload="auto" aria-hidden="true">
    <source src="/ds/media/pigment-loop-ink.webm" data-src-dark="/ds/media/pigment-loop-cream.webm" type="video/webm">
    <source src="/ds/media/pigment-loop-ink.mp4" data-src-dark="/ds/media/pigment-loop-cream.mp4" type="video/mp4">
  </video>
  <span class="nda-liquid__word">Thought</span>
</span>
```
