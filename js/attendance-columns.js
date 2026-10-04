import { ATTENDANCE_EVENTS } from './academy-record.js';
import { screenings, SCREENING_WINDOW_MS } from './seminar-data.js';
import { canRevealTitle } from './seminar-screenings.js';

// The staff attendance table's columns (js/session-attendance.js): every meeting of a seminar, in order, and which one
// is current. The current meeting is the first that hasn't been over for a day yet: a screening is over four hours
// after it starts, a lecture or discussion at the end of its day (Eastern), so the highlight moves on to the next
// meeting 24 hours after this one. With `ta`, a screening the syllabus hasn't revealed yet goes by its session's title.
// No network or page here, so the tests can run it.

export const DAY = 24 * 60 * 60 * 1000;
const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function endOf(event) {
  const film = event.screeningId && screenings.find(item => item.id === event.screeningId);
  if (film?.startsAt && Number.isFinite(Date.parse(film.startsAt))) return Date.parse(film.startsAt) + SCREENING_WINDOW_MS;
  return event.date ? Date.parse(event.date + 'T23:59:59-05:00') : null;   // the end of its day, Eastern
}

// The meetings as columns, in order, with the current one marked. `ta`: label unrevealed screenings by their session.
export function attendanceColumns(seminarId, { now = Date.now(), ta = false } = {}) {
  const events = ATTENDANCE_EVENTS[seminarId] || [];
  const lectureOf = parent => events.find(event => event.parent === parent && event.type === 'lecture')?.label || '';
  const columns = events.map(event => {
    const session = /^s\d+$/.test(event.parent || '') ? Number(event.parent.slice(1)) : null;
    const siblings = events.filter(item => item.parent === event.parent && item.type === 'screening');
    const film = event.screeningId && screenings.find(item => item.id === event.screeningId);
    const hidden = ta && event.type === 'screening' && film && !canRevealTitle(film, true, now);
    const kind = event.type === 'screening' ? (siblings.length > 1 ? `Screening ${siblings.indexOf(event) + 1}` : 'Screening')
      : event.type === 'lecture' ? 'Lecture' : 'Discussion';
    return {
      event, end: endOf(event),
      kicker: event.type === 'discussion' ? kind : `Session ${session} · ${kind}`,
      title: hidden ? (lectureOf(event.parent) || `Session ${session}`) : event.label,
      date: event.date ? SHORT.format(new Date(event.date + 'T12:00:00Z')) : 'Date TBD'
    };
  });
  const dated = columns.filter(column => column.end !== null);
  let current = dated.find(column => column.end + DAY > now) || null;
  if (!current && dated.length) {   // every dated meeting is over: the next one still to be scheduled, if any
    const last = columns.indexOf(dated.at(-1));
    current = columns.slice(last + 1).find(column => column.end === null) || null;
  }
  const at = current ? columns.indexOf(current) : -1;
  return columns.map((column, index) => ({ ...column, state: at < 0 ? 'none' : index < at ? 'past' : index === at ? 'current' : 'upcoming' }));
}
