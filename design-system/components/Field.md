# Field

Square inputs with a 1px `rule-strong` border, a Barlow label above, and help or error text below.

## Use
- Label every input with a visible `<label>`; mark optional ones "(optional)" rather than starring required ones.
- Help text (`nda-field__help`, `ink-dim`) is linked with `aria-describedby`.
- Errors: set `aria-invalid="true"` (2px `ink` border) and put a plain sentence in `nda-field__error`, also linked. Errors are `ink` with a "!" square, not red: pink means "current" here.
- Checkboxes use `nda-check`. Inputs are 16px so phones don't zoom.

## Markup
```html
<form class="nda-form" novalidate>
  <div class="nda-field">
    <label class="nda-field__label" for="fs-name">Name <span class="nda-field__optional">(optional)</span></label>
    <input class="nda-field__input" id="fs-name" type="text" autocomplete="name">
  </div>
  <div class="nda-field">
    <label class="nda-field__label" for="fs-email">Email address</label>
    <input class="nda-field__input" id="fs-email" type="email" autocomplete="email" required aria-invalid="true" aria-describedby="fs-email-error" value="reader@">
    <p class="nda-field__error" id="fs-email-error">Please enter an email address.</p>
  </div>
  <div class="nda-field">
    <label class="nda-field__label" for="fs-topic">Proposed topic and background</label>
    <textarea class="nda-field__input" id="fs-topic" rows="3" aria-describedby="fs-topic-help"></textarea>
    <p class="nda-field__help" id="fs-topic-help">A paragraph is enough. We reply to every proposal.</p>
  </div>
  <label class="nda-check"><input type="checkbox" checked> Propose a guest lecture</label>
  <button class="nda-button nda-button--primary" type="submit">Subscribe to updates</button>
</form>
```
