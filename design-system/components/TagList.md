# TagList

Short noun phrases in spaced mono caps that say what something gathers: "Ideas · Community · Discipline · For a more open tomorrow".

## Use
- Inline (`nda-taglist`, `mono-wide`): under the hero and the journal feature; in the hero the items spread across the column.
- Stacked (`nda-taglist--stack`, wider tracking): in the narrow Fork column.
- Not links and not filters. Two to five items, no bullets or separators: spacing does the work.
- `data-nda-sequence` (the homepage's tag line): the tags fade up into place one after another, 380ms apart, the last a beat later so the line lands on it, and all of them stay. It plays once, when the list is on screen, and after the intro on a first visit (`NDA.sequence()`). Under reduced motion they are simply there.

## Markup
```html
<ul class="nda-taglist" aria-label="What the Academy gathers">
  <li>Ideas</li><li>Community</li><li>Discipline</li><li>For a more open tomorrow</li>
</ul>
```
