# CircleLink

The Academy's navigation action: an arrow in a 48px `ink` circle followed by a two-line mono label.

## Use
- To move into a section: "View / current seminars", "Explore / the journal". One per panel, at its foot.
- Hover fills the circle with `ink` and turns the arrow `on-ink`; focus draws the `focus` ring around the whole link.
- Inside an AccessTile its `::after` covers the tile; elsewhere it is just the link.
- Not for form submission or destructive actions: use Button.

## You provide
- Two short lines: a verb, then the object. Write them in sentence case.

## Markup
```html
<a class="nda-circle-link" href="/seminars.html#current">
  <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
  <span class="nda-circle-link__label"><span class="nda-circle-link__line">View</span><span class="nda-circle-link__line">current seminars</span></span>
</a>
```
