# SeminarPage (draft)

A seminar's own page in the system's style, using Sex, and/or Love: where the seminar's artwork lives, in colour, filling the right of the cover and fading out toward the text, as on Coining Reason's page.

## Structure
- SiteHeader (sticky), the ScreeningBanner on screening nights.
- Cover: kind and state (Seminar · Active), the title fitted to the copy column in NDA Display, the subtitle in mono caps, the lede and the description, and the page's action (Late enroll while enrollment is open) beside a link down to the sessions. The artwork fills the right of the cover and fades out across a horizontal mask as it reaches the copy; on phones it sits under the copy and fades upward. A seminar whose artwork is dark (Coining Reason) puts the cover on Night (`data-theme="dark"`).
- Facts in hairline columns: dates, time, discussions, participation.
- Sessions: SessionRows (past ones collapsed, the current one in pink).
- How to enroll: three numbered steps and the Create account button.

Draft for review; the pv- layout classes would become components (SeminarCover, FactList, Steps) if kept.
