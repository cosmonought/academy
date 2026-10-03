# RadioControl

Play and pause for the Academy's live radio, side by side as in the mockup; the action you can take is the circled one.

## Use
- In the SiteHeader, after the navigation. Stopped: play is circled and pause is dimmed (`ink-dim`). Playing: pause is circled.
- Both are real buttons with `aria-label`s; the unavailable one is `aria-disabled="true"` and focus moves to the other after a press.
- `NDA.radio()` plays `data-src` with an `Audio` element and emits `nda:radio` with `{ playing }`. The site's persistent-radio shell (site.js) can listen for it.
- No autoplay. No volume slider in the header; keep it in the menu or Cinema if needed.

## Markup
```html
<div class="nda-radio" role="group" aria-label="Academy radio" data-nda-radio data-src="https://s3.radio.co/s39c195d74/listen">
  <button class="nda-radio__play" type="button" aria-label="Play Academy radio"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1v10l9-5z"/></svg></button>
  <button class="nda-radio__pause" type="button" aria-label="Pause Academy radio"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg></button>
</div>
```
