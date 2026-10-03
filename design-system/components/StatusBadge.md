# StatusBadge

One mono word for where a session, screening or program stands, with a small square that carries the colour.

## States
- `--current`: `pink` word, filled `pink-mark` square. In progress, Active. Pink marks the present and nothing else.
- `--next`: `blue` word, filled square. The first dated upcoming session.
- `--scheduled`: `ink-mid`, hollow square. Later dated sessions.
- default: `ink-dim`, hollow square. Date TBD, On hiatus.
- `--past`: `ink-dim`, no square. Past, Screened.

## Use
- The word always says the state; colour only repeats it. Use the site's exact words: In progress, Next, Scheduled, Date TBD, Past, Screened, Active, On hiatus, Forthcoming (`--next`).
- In an IndexRule's label it names a program's state instead of its kind: the homepage's panels read "01 —— ■ Active".
- Inside the screening panel only Screened appears (past) and the current screening gets "Stream here →" instead of a badge.
- `blue` text sits on `paper` only.

## Markup
```html
<span class="nda-status nda-status--current">In progress</span>
```
