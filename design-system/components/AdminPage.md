# AdminPage (draft)

`admin.html`, the staff tool: the system's type and colour on a working layout, not a showpiece. Only the Academy administrator sees it; instructors and teaching assistants get their own seminar's enrollment, attendance and evaluations on their profile's Teacher tab (ProfileTeacher).

- **Seminars | Inquiries | Fork** as tabs; under Seminars, one tab per seminar with its count.
- **Registrations**: a table on hairlines, data in mono. Status uses the StatusBadge (Pending in pink because it is waiting on someone now, Enrolled, Unenrolled). One action per row (Enroll, or Unenroll), with Delete as a ghost button; both destructive actions keep the site's confirm step.
- **Attendance**: the current session first, each person marked ✓ / — / ? in a three-way switch (the pressed one in ink), with Mark all attended; upcoming and past sessions fold up below.
- **Optional evaluation**: requests, forms and outcomes, where the seminar offers it.
- **Account assistance** in the side column: look up an account, send a password link, grant or revoke teaching access.
- **Inquiries** (not shown): guest-lecture proposals and general signups, as two of the same tables.
- **Fork** (not shown): registrations of interest from the journal's Register interest form (fork.netadao.org/submit.html), in the same table: name, email, interest, research area, and when (UTC). A count by interest above it, with Refresh and Copy email addresses. They live in the database's `forkInterests` list (see the repository's `docs/fork-interest.md`); an Editorial view for Fork's editors can come later.

Placeholder names and example.com addresses only. Draft for review; the page's scripts keep their element ids.
