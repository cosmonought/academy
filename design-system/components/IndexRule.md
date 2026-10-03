# IndexRule

The numbered line that opens every panel: a bold two-digit numeral, a `rule-thin` hairline, and the panel's kind in mono caps.

## Use
- First element of ProgramPanel, AccessTile and any panel in a numbered row. Number in reading order: 01, 02, 03.
- The label names the kind or the state (Course, Seminar, Journal; Current, Upcoming, Archive), one word.
- The line stretches; keep at least `space-6` of it visible.

## Markup
```html
<p class="nda-index"><span class="nda-index__num">01</span><span class="nda-index__label">Course</span></p>
```
