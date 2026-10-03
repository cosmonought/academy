# TextLink

An underlined Barlow link with a trailing arrow, for actions inside reading copy and program descriptions.

## Use
- → for links within the Academy, ↗ for other sites (fork.netadao.org, netadao.org). The arrow is `aria-hidden`.
- Hover turns it `pink`. Keep it on `paper`.
- Links inside reading lists are `blue` (`nda-readings a`), not this.

## Markup
```html
<a class="nda-text-link" href="/sex-and-or-love.html">View seminar <span aria-hidden="true">→</span></a>
```
