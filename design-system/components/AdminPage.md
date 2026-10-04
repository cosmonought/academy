# AdminPage (draft)

`admin.html`, the staff tool: the system's type and colour on a working layout, not a showpiece. Only the Academy administrator sees it; instructors and teaching assistants get their own seminar's enrollment, attendance and evaluations on their profile's Teacher tab (ProfileTeacher).

- **Seminars | Inquiries | Fork** as tabs; under Seminars, one tab per seminar with its count.
- **Registrations**: a table on hairlines, data in mono. Status uses the StatusBadge (Pending in pink because it is waiting on someone now, Enrolled, Unenrolled). One action per row (Enroll, or Unenroll), with Delete as a ghost button; both destructive actions keep the site's confirm step.
- **Attendance**: the same table as the Teacher tab (ProfileTeacher): participants down the left, every meeting across the top, opening on the current meeting with its pink rule; one box per cell, present or absent, and All present per meeting. Admin lists every registration, so a name that isn't enrolled carries Pending or Unenrolled in pink beneath it.
- **Optional evaluation**: requests, forms and outcomes, where the seminar offers it.
- **Account assistance** in the side column: look up an account, send a password link, grant or revoke teaching access.
- **Inquiries** (not shown): guest-lecture proposals and general signups, as two of the same tables.
- **Fork** (not shown): registrations of interest from the journal's Register interest form (fork.netadao.org/submit.html), in the same table: name, email, interest, research area, and when (UTC). A count by interest above it, with Refresh and Copy email addresses. They live in the database's `forkInterests` list (see the repository's `docs/fork-interest.md`); an Editorial view for Fork's editors can come later.

Placeholder names and example.com addresses only. Draft for review; the page's scripts keep their element ids.
