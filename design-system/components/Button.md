# Button

Mono-caps buttons with a 4px radius, the only rounded rectangles in the system.

## Variants
- `nda-button--primary`: `ink` fill, `on-ink` label. The page's one main action (Create account, Request enrollment). Hover: `ink-mid`.
- `nda-button--outline`: 1.5px `ink` border. Secondary actions (Sign in, Late enroll). Hover: `paper-hover`.
- `nda-button--ghost`: underlined label, no border. Tertiary (Cancel, Close).
- `nda-button--sm`: 32px tall, for the header. Default height is 44px (`control`).

## Use
- Verb first, sentence case in the source ("Subscribe to updates"); CSS sets the caps.
- `<button>` for actions, `<a class="nda-button">` only when it navigates.
- To move through the site prefer CircleLink or TextLink.
- Disabled buttons fade to 45% and say why in their label or next to them.

## Markup
```html
<a class="nda-button nda-button--outline nda-button--sm" href="/account.html">Sign in</a>
<button class="nda-button nda-button--primary" type="button">Create account</button>
```
