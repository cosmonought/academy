import { sessions, screenings } from './seminar-data.js';
// Canonical attendance events. Keys identify real meetings, independent of syllabus labels.
const sexLectures = [
  'Seduction', 'The Origin of Sexuality', 'Sexual Difference: Man, Animal, Plant, Amoeba',
  'The Impersonality of Desire', 'Traumatophilia', 'Feminine Sexuality',
  'Love’s Measure', 'The End of Ends: Sex, Reason, Being', 'To Touch, To Bid, To Kiss: On Parting'
];
const sexScreenings = [
  [4, 'skin'], [5, 'sister'], [6, 'cook'], [6, 'mother'],
  [6, 'park'], [6, 'hiroshima'], [7, 'tambien'], [8, 'someone']
];
const sexEvents = sexLectures.map((label, i) => ({ key: `lecture-s${i}`, label, parent: `s${i}`, type: 'lecture', date: sessions[i].lectureDate }));
for (const [unit, key] of sexScreenings) {
  const film = screenings.find(item => item.id === key);
  const lectureIndex = sexEvents.findIndex(event => event.parent === `s${unit}`);
  sexEvents.splice(lectureIndex, 0, { key: `screening-${key}`, label: film.title, parent: `s${unit}`, type: 'screening', date: film.screenedOn || film.startsAt?.slice(0, 10) || null });
}
const unit = labels => labels.map((label, i) => ({ key: `s${i}`, label, parent: `s${i}`, type: 'discussion' }));
export const ATTENDANCE_EVENTS = {
  'sex-and-or-love': sexEvents,
  'coining-reason-unit-1': unit(['1.0','1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8']),
  'coining-reason-unit-2': unit(['2.0','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.X','2.Xb','2.10','2.11','2.12','2.13','2.14','2.15','2.16']),
  'sex-monsters-superheroes': []
};
export const EVALUATION_OFFERED = { 'sex-monsters-superheroes': true };
export const EVALUATION_FORMS = {
  essay: 'Paper / essay', presentation: 'Oral presentation', discussion: 'Lead a text discussion', other: 'Other / to be arranged'
};
export const EVALUATION_OUTCOMES = {
  completed: 'Completed', merit: 'Completed with Merit', distinction: 'Completed with Distinction'
};
export function attendanceRecord(seminarId, registration) {
  const events = ATTENDANCE_EVENTS[seminarId] || [];
  const values = registration?.attendance || {};
  const detail = events.map(event => ({ ...event, status: values[event.key] === true ? 'attended' : values[event.key] === false ? 'missed' : 'unrecorded' }));
  const legacy = seminarId === 'sex-and-or-love'
    ? Object.entries(values).filter(([key, value]) => /^s[0-8]$/.test(key) && typeof value === 'boolean')
        .map(([key, value]) => ({ key, value, label: `Syllabus unit ${key.slice(1)}` }))
    : [];
  return { attended: detail.filter(event => event.status === 'attended').length, total: events.length, detail, legacy };
}
