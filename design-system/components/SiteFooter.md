# SiteFooter

The colophon in one compact row: wordmark, the off-site links, and copyright.

## Use
- Every page, once. The header is sticky and carries the site's own pages (Seminars, Cinema, Journal, Sign in / Account), so the footer doesn't repeat them: it carries only what the header doesn't, X, Discord and Neta DAO.
- X and Discord are their platforms' own marks (`nda-footer__icon`, 24px, `ink`, each with an accessible name), as the site's footer has always drawn them. They sit at the right of the first row, between the wordmark and the copyright, with a `rule-strong` divider before the copyright.
- **One line.** The X and Discord glyphs and the Neta N stand about the same height (20px), centred on one line: the icons are 24px boxes, the still mark 22px tall, the film 27px (its frame has more room around the N).
- **Neta DAO.** The links row ends in Neta DAO's own mark (the N with its gradient bar), alone and unlabelled, linking to netadao.org; its accessible name is "Neta DAO". It is sized to sit in the row without making it taller. The mark is Neta DAO's supplied artwork: on Paper a still from its own logo film (`assets/Logos/neta-mark-paper.png`, an ink N); on Night the film itself, as in netadao.org's hero and footer (`assets/Logos/neta-mark-loop.webp`, a white N on black whose black blends into the page, `mix-blend-mode: lighten`), with `neta-mark-night.png` standing in under reduced motion. The film exists only as a white N, so Paper keeps the still. Never redraw it, recolour its bar, or set it anywhere but as this link.
- Below 900px of its own width it stacks; the dividers become `rule-thin` rules above and below the links.
- No disclaimer line: the footer is the wordmark, the links and the copyright, on one line, and nothing else.

## Markup
```html
<footer class="nda-footer">
  <div class="nda-footer__inner">
    <a class="nda-wordmark nda-wordmark--footer" href="/">Neta DAO Academy</a>
    <nav class="nda-footer__nav" aria-label="Footer">
      <ul>
        <li><a class="nda-footer__icon" href="https://x.com/NetaDAO_Academy" aria-label="Neta DAO Academy on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg></a></li>
        <li><a class="nda-footer__icon" href="https://discord.com/invite/gvjC86WXC2" aria-label="Neta DAO Academy on Discord"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515c-.074.127-.158.298-.217.432a18.27 18.27 0 0 0-5.487 0 4.64 4.64 0 0 0-.218-.432A19.736 19.736 0 0 0 4.625 4.37 20.02 20.02 0 0 0 1 18.855a19.9 19.9 0 0 0 5.993 3.03 14.62 14.62 0 0 0 1.226-1.994 12.7 12.7 0 0 1-1.93-.934c.162-.12.32-.246.474-.373a14.18 14.18 0 0 0 12.281 0c.155.127.313.252.475.373-.616.366-1.265.68-1.93.934a14.49 14.49 0 0 0 1.225 1.994 19.87 19.87 0 0 0 5.994-3.03A20.03 20.03 0 0 0 20.317 4.37ZM8.02 15.332c-1.17 0-2.128-1.065-2.128-2.366S6.85 10.6 8.02 10.6c1.18 0 2.147 1.075 2.128 2.366 0 1.301-.947 2.366-2.128 2.366Zm7.974 0c-1.17 0-2.128-1.065-2.128-2.366s.958-2.366 2.128-2.366c1.18 0 2.147 1.075 2.128 2.366 0 1.301-.947 2.366-2.128 2.366Z"/></svg></a></li>
        <li><a class="nda-footer__parent" href="https://netadao.org" aria-label="Neta DAO">
          <img class="nda-footer__mark nda-footer__mark--paper" src="/ds/media/neta-mark-paper.png" alt="" width="251" height="192">
          <img class="nda-footer__mark nda-footer__mark--night" src="/ds/media/neta-mark-night.png" alt="" width="251" height="192">
          <img class="nda-footer__mark nda-footer__mark--loop" src="/ds/media/neta-mark-loop.webp" alt="" width="160" height="106" loading="lazy">
        </a></li>
      </ul>
    </nav>
    <p class="nda-footer__copy">© Neta DAO Academy · All rights reserved</p>
  </div>
</footer>
```
