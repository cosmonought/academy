# ProfilePage (draft)

`profile.html`: your Academy record. Your name in the display face (Edit name beside it), your email and X handle in mono, then the tabs: **Student** (shown) and **Account** (in ProfileStates). Instructors and teaching assistants also get **Teacher**, between them (ProfileTeacher).

The Student tab, top to bottom:
- **Needs your attention**, only when something does: an enrollment waiting on its DM, with the pink Action required badge (pink means now).
- **Your seminars**: one row per seminar, the title in the display face with its state (Enrolled, Enrollment requested), then Attendance (with the event-by-event record behind "See the record"), Evaluation and a link to the seminar.
- **Forthcoming**: interest recorded in a seminar that hasn't opened (blue, the Next colour).
- **Completed**: the transcript, finished seminars in the same row (a tab of its own on the live site).

Rows are separated by `rule-thin` hairlines inside full-width `rule` sections; on phones each row stacks. Draft for review; the page's script keeps its element ids.
