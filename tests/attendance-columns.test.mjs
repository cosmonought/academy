import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceColumns, DAY } from '../js/attendance-columns.js';
import { screenings, SCREENING_WINDOW_MS } from '../js/seminar-data.js';

const ID = 'sex-and-or-love';
const hiroshima = screenings.find(film => film.id === 'hiroshima');
const start = Date.parse(hiroshima.startsAt), over = start + SCREENING_WINDOW_MS;
const current = columns => columns.find(column => column.state === 'current');

test('one column per meeting, in order, with the session and kind above the title', () => {
  const columns = attendanceColumns(ID, { now: Date.parse('2026-10-03T12:00:00Z') });
  assert.ok(columns.length > 10);
  const screening = columns.find(column => column.event.screeningId === 'hiroshima');
  assert.equal(screening.kicker, 'Session 6 · Screening 4');
  assert.equal(screening.title, 'Hiroshima, Mon Amour');
  assert.equal(screening.date, '7 Oct');
  assert.equal(columns.find(column => column.event.parent === 's6' && column.event.type === 'lecture').kicker, 'Session 6 · Lecture');
});

test('the current meeting: Hiroshima until a day after it, then the next one', () => {
  for (const now of [Date.parse('2026-10-03T12:00:00Z'), start - 1, start + 60_000, over + DAY - 60_000]) {
    const columns = attendanceColumns(ID, { now });
    assert.equal(current(columns).event.screeningId, 'hiroshima', new Date(now).toISOString());
    const at = columns.indexOf(current(columns));
    assert.ok(columns.slice(0, at).every(column => column.state === 'past'));
    assert.ok(columns.slice(at + 1).every(column => column.state === 'upcoming'));
  }
  const next = current(attendanceColumns(ID, { now: over + DAY + 60_000 }));
  assert.equal(next.event.parent, 's6');
  assert.equal(next.event.type, 'lecture');
});

test('once every dated meeting is over, the next one still to be scheduled is current', () => {
  const columns = attendanceColumns(ID, { now: Date.parse('2027-06-01T00:00:00Z') });
  const at = columns.indexOf(current(columns));
  assert.ok(at > 0);
  assert.equal(columns[at].end, null);
  assert.ok(columns.slice(0, at).every(column => column.state === 'past'));
});

test('a teaching assistant sees an unrevealed screening by its session’s title', () => {
  const before = attendanceColumns(ID, { now: start - 60_000, ta: true });
  const film = before.find(column => column.event.screeningId === 'hiroshima');
  assert.equal(film.title, 'Love’s Measure');
  assert.ok(!before.some(column => column.title === 'Hiroshima, Mon Amour'));
  for (const column of before.filter(item => item.event.type === 'screening' && item.state === 'upcoming')) {
    assert.ok(!screenings.some(item => item.title === column.title), 'no film title ahead: ' + column.title);
  }
  // the syllabus reveals a film when its screening begins; so does the table
  assert.equal(attendanceColumns(ID, { now: start + 1, ta: true }).find(column => column.event.screeningId === 'hiroshima').title, 'Hiroshima, Mon Amour');
  // an instructor always sees the film
  assert.equal(attendanceColumns(ID, { now: start - 60_000 }).find(column => column.event.screeningId === 'hiroshima').title, 'Hiroshima, Mon Amour');
});

test('undated seminars: every column, none current', () => {
  const columns = attendanceColumns('coining-reason-unit-1', { now: Date.parse('2026-10-03T12:00:00Z') });
  assert.equal(columns.length, 9);
  assert.ok(columns.every(column => column.state === 'none' && column.date === 'Date TBD' && column.kicker === 'Discussion'));
  assert.deepEqual(attendanceColumns('no-such-seminar'), []);
});
