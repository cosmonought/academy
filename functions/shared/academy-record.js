import { sessions, screenings } from './seminar-data.js';
import { canRevealTitle } from './seminar-screenings.js';
// Canonical attendance events. Keys identify real meetings, independent of syllabus labels.
const sexLectures = [
  'Seduction', 'The Origin of Sexuality', 'Sexual Difference: Man, Animal, Plant, Amoeba',
  'The Impersonality of Desire', 'Traumatophilia', 'Feminine Sexuality',
  'Love’s Measure', 'The End of Ends: Sex, Reason, Being', 'To Touch, To Bid, To Kiss: On Parting'
];
const sexScreenings = [
  [4, 'skin'], [5, 'sister'], [6, 'cook'], [6, 'mother'],
  [6, 'park'], [6, 'dogtooth'], [6, 'hiroshima'], [7, 'tambien'], [8, 'someone']
];
const sexEvents = [];
for (let i = 0; i < sexLectures.length; i += 1) {
  const parent = `s${i}`;
  const events = [
    { key: `lecture-s${i}`, label: sexLectures[i], parent, type: 'lecture', date: sessions[i].lectureDate }
  ];
  for (const [unit, key] of sexScreenings.filter(([unit]) => unit === i)) {
    const film = screenings.find(item => item.id === key);
    if (!film) continue;
    events.push({
      key: `screening-${key}`,
      label: film.title,
      screeningId: film.id,
      parent,
      type: 'screening',
      date: film.screenedOn || film.startsAt?.slice(0, 10) || null
    });
  }
  // Real meetings are presented chronologically inside their parent syllabus
  // session. Stable event keys, not DOM order, remain authoritative.
  events.sort((a, b) => {
    if (!a.date && !b.date) return a.type === 'lecture' ? -1 : 1;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date) || (a.type === 'screening' ? -1 : 1);
  });
  sexEvents.push(...events);
}
const unit = labels => labels.map((label, i) => ({ key: `s${i}`, label, parent: `s${i}`, type: 'discussion' }));
export const ATTENDANCE_EVENTS = {
  'sex-and-or-love': sexEvents,
  'coining-reason-unit-1': unit(['1.0','1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8']),
  'coining-reason-unit-2': unit(['2.0','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.X','2.Xb','2.10','2.11','2.12','2.13','2.14','2.15','2.16']),
  'sex-monsters-superheroes': []
};
export const EVALUATION_CONFIG = {
  'sex-and-or-love': { enabled: false, minimumAttendanceEvents: 1, requestCutoff: null },
  'coining-reason-unit-1': { enabled: false, minimumAttendanceEvents: 1, requestCutoff: null },
  'coining-reason-unit-2': { enabled: false, minimumAttendanceEvents: 1, requestCutoff: null },
  'sex-monsters-superheroes': { enabled: true, minimumAttendanceEvents: 1, requestCutoff: null }
};
export const EVALUATION_OFFERED = Object.fromEntries(
  Object.entries(EVALUATION_CONFIG).map(([id, config]) => [id, config.enabled === true])
);
export const EVALUATION_FORMS = {
  essay: 'Paper / essay', presentation: 'Oral presentation', discussion: 'Lead a text discussion', other: 'Other / to be arranged'
};
export const EVALUATION_OUTCOMES = {
  completed: 'Completed', merit: 'Completed with Merit', distinction: 'Completed with Distinction'
};
export function attendanceRecord(seminarId, registration) {
  const events = ATTENDANCE_EVENTS[seminarId] || [];
  const values = registration?.attendance || {};
  const detail = events.map(event => ({ ...event, status: values[event.key] === true ? 'attended' : values[event.key] === false ? 'absent' : 'unrecorded' }));
  const legacy = seminarId === 'sex-and-or-love'
    ? Object.entries(values).filter(([key, value]) => /^s[0-8]$/.test(key) && typeof value === 'boolean')
        .map(([key, value]) => ({ key, value, label: `Syllabus unit ${key.slice(1)}` }))
    : [];
  return { attended: detail.filter(event => event.status === 'attended').length, total: events.length, detail, legacy };
}

export function participantAttendanceRecord(seminarId, registration, now = Date.now()) {
  const record = attendanceRecord(seminarId, registration);
  if (seminarId !== 'sex-and-or-love') return { ...record, legacy: [] };
  const detail = record.detail.map(event => {
    if (event.type !== 'screening' || !event.screeningId) return event;
    const film = screenings.find(item => item.id === event.screeningId);
    if (!film || canRevealTitle(film, registration?.enrolled === true, now)) return event;
    return { ...event, label: event.date ? `Screening · ${event.date}` : 'Screening · title revealed at screening' };
  });
  return { ...record, detail, legacy: [] };
}
