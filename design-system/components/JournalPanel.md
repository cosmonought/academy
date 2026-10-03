# JournalPanel

Fork, the Academy's journal, under its mark: a narrow column version ("A project by Neta DAO Academy") and a wide feature version.

## Use
- Not on the homepage now: Fork appears there once, as the fourth program panel. Keep the column or the feature for pages that introduce the journal at more length.
- Column (`nda-journal--column`): a narrow column. Feature (`nda-journal--feature`): a wide block. Use one per page.
- The ForkMark spans the column (the feature caps it at 560px). It sits whole until the panel is hovered or focused, then cuts (see ForkMark).
- No pigment wash and no image: Fork's own look waits for fork.netadao.org's design.

## You provide
- The kicker or `text-heading`, the four tags (Research, Peer reviewed, Open access, Interchain: what the journal is, from the site's own description, short enough to stack in the column) and the link to fork.netadao.org.
- The ForkMark markup, with a visually hidden "Fork" beside it so the panel's label reads as a word.

## Markup
```html
<aside class="nda-journal nda-journal--column" aria-labelledby="fork-column-mark">
  <p class="nda-journal__kicker">A project by<br>Neta DAO Academy</p>
  <p class="nda-journal__mark" id="fork-column-mark"><span class="nda-visually-hidden">Fork</span><span class="nda-forkmark"><svg …>…</svg></span><!-- ForkMark markup --></p>
  <ul class="nda-taglist nda-taglist--stack">
    <li>Research</li><li>Peer reviewed</li><li>Open access</li><li>Interchain</li>
  </ul>
  <a class="nda-circle-link" href="https://fork.netadao.org">
    <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
    <span class="nda-circle-link__label"><span class="nda-circle-link__line">Explore</span><span class="nda-circle-link__line">the journal</span></span>
  </a>
</aside>

<section class="nda-journal nda-journal--feature" aria-labelledby="fork-feature-title">
  <h2 class="nda-section-heading" id="fork-feature-title">The journal</h2>
  <p class="nda-journal__mark"><span class="nda-visually-hidden">Fork</span><span class="nda-forkmark"><svg …>…</svg></span><!-- ForkMark markup --></p>
  <div class="nda-journal__foot">
    <ul class="nda-taglist" aria-label="Fork">
      <li>Research</li><li>Peer reviewed</li><li>Open access</li><li>Interchain</li>
    </ul>
    <a class="nda-circle-link" href="https://fork.netadao.org">
      <span class="nda-circle-link__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
      <span class="nda-circle-link__label"><span class="nda-circle-link__line">Explore</span><span class="nda-circle-link__line">the journal</span></span>
    </a>
  </div>
</section>
```
