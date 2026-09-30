import { sessions, screenings } from './seminar-data.js';

// Canonical attendance events identify real meetings independently of syllabus
// labels. Participant views may redact screening titles until their reveal,
// while staff views retain the canonical title.
const sexLectures = [
  'Seduction', 'The Origin of Sexuality', 'Sexual Difference: Man, Animal, Plant, Amoeba',
  'The Impersonality of Desire', 'Traumatophilia', 'Feminine Sexuality',
  'Love’s Measure', 'The End of Ends: Sex, Reason, Being', 'To Touch, To Bid, To Kiss: On Parting'
];

const sexScreenings = [
  [4, 'skin'], [5, 'sister'], [6, 'cook'], [6, 'mother'],
  [6, 'park'], [6, 'hiroshima'], [7, 'tambien'], [8, 'someone']
];

const dateValue = value => {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value.length === 10 ? value + 'T12:00:00Z' : value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

const sexEvents = [];
sexLectures.forEach((label, i) => {
  const parent = `s${i}`;
  const parentTitle = label;
  const grouped = [{
    key: `lecture-s${i}`,
    label,
    parent,
    parentIndex: i,
    parentTitle,
    type: 'lecture',
    date: sessions[i]?.lectureDate || null
  }];

  for (const [unit, screeningId] of sexScreenings) {
    if (unit !== i) continue;
    const film = screenings.find(item => item.id === screeningId);
    if (!film) continue;
    grouped.push({
      key: `screening-${screeningId}`,
      label: film.title,
      parent,
      parentIndex: i,
      parentTitle,
      type: 'screening',
      screeningId,
      date: film.screenedOn || film.startsAt?.slice(0, 10) || null
    });
  }

  // A parent session can have several screenings. Sorting once here fixes the
  // previous repeated-splice behavior that reversed same-session screenings.
  grouped.sort((a, b) => {
    const aDate = dateValue(a.date);
    const bDate = dateValue(b.date);
    if (aDate !== bDate) return aDate - bDate;
    if (a.type !== b.type) return a.type === 'lecture' ? -1 : 1;
    return 0;
  });
  sexEvents.push(...grouped);
});

const unit = labels => labels.map((label, i) => ({
  key: `s${i}`,
  label,
  parent: `s${i}`,
  parentIndex: i,
  parentTitle: label,
  type: 'discussion',
  date: null
}));

export const ATTENDANCE_EVENTS = {
  'sex-and-or-love': sexEvents,
  'coining-reason-unit-1': unit(['1.0','1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8']),
  'coining-reason-unit-2': unit(['2.0','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.X','2.Xb','2.10','2.11','2.12','2.13','2.14','2.15','2.16']),
  'sex-monsters-superheroes': []
};

// Evaluation availability is seminar-level configuration. A future calendar can
// set requestClosesAt explicitly; do not infer a historical cutoff from a
// participant's attendance percentage.
export const EVALUATION_CONFIG = {
  'sex-and-or-love': {
    enabled: true,
    minimumAttendanceEvents: 1,
    requestClosesAt: null
  },
  'coining-reason-unit-1': {
    enabled: false,
    minimumAttendanceEvents: 1,
    requestClosesAt: null
  },
  'coining-reason-unit-2': {
    enabled: true,
    minimumAttendanceEvents: 1,
    requestClosesAt: null
  },
  'sex-monsters-superheroes': {
    enabled: true,
    minimumAttendanceEvents: 1,
    requestClosesAt: null
  }
};

export const EVALUATION_OFFERED = Object.fromEntries(
  Object.entries(EVALUATION_CONFIG).map(([seminarId, config]) => [seminarId, config.enabled === true])
);

export const EVALUATION_FORMS = {
  essay: 'Paper / essay',
  presentation: 'Oral presentation',
  discussion: 'Lead a text discussion',
  other: 'Other / to be arranged'
};

export const EVALUATION_OUTCOMES = {
  completed: 'Completed',
  merit: 'Completed with Merit',
  distinction: 'Completed with Distinction'
};

export function attendanceRecord(seminarId, registration) {
  const events = ATTENDANCE_EVENTS[seminarId] || [];
  const values = registration?.attendance || {};
  const detail = events.map(event => ({
    ...event,
    status: values[event.key] === true
      ? 'attended'
      : values[event.key] === false
        ? 'absent'
        : 'unrecorded'
  }));

  // Retain legacy keys for migration/audit compatibility, but they are never
  // included in attended/total. Participant UI intentionally no longer renders
  // them now that the event-level record is authoritative.
  const legacy = seminarId === 'sex-and-or-love'
    ? Object.entries(values)
        .filter(([key, value]) => /^s[0-8]$/.test(key) && typeof value === 'boolean')
        .map(([key, value]) => ({ key, value, label: `Syllabus unit ${key.slice(1)}` }))
    : [];

  return {
    attended: detail.filter(event => event.status === 'attended').length,
    total: events.length,
    detail,
    legacy
  };
}
