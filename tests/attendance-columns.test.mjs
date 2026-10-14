import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceColumns, DAY } from '../js/attendance-columns.js';
import { screenings, SCREENING_WINDOW_MS } from '../js/seminar-data.js';

const ID = 'sex-and-or-love';
const at = id => Date.parse(screenings.find(film => film.id === id).startsAt);
const dogtooth = at('dogtooth'), amour = at('amour'), hiroshima = at('hiroshima');
const current = columns => columns.find(column => column.state === 'current');
const column = (columns, id) => columns.find(item => item.event.screeningId === id);

test('one column per meeting, in order, with the session and kind above the title', () => {
  const columns = attendanceColumns(ID, { now: Date.parse('2026-10-03T12:00:00Z') });
  assert.ok(columns.length > 10);
  const intermezzo = column(columns, 'dogtooth');
  assert.equal(intermezzo.kicker, 'Session 6 · Screening 4');
  assert.equal(intermezzo.title, 'Dogtooth');
  assert.equal(intermezzo.date, '7 Oct');
  const second = column(columns, 'amour');
  assert.equal(second.kicker, 'Session 6 · Screening 5');
  assert.equal(second.date, '14 Oct');
  assert.equal(columns.indexOf(second), columns.indexOf(intermezzo) + 1);
  const after = column(columns, 'hiroshima');
  assert.equal(after.kicker, 'Session 6 · Screening 6');
  assert.equal(after.date, '21 Oct');
  assert.equal(columns.indexOf(after), columns.indexOf(second) + 1);
  const lecture = columns.find(item => item.event.parent === 's6' && item.event.type === 'lecture');
  assert.equal(lecture.kicker, 'Session 6 · Lecture');
  assert.equal(lecture.date, '28 Oct');
});

test('the current meeting moves on a day after each one ends', () => {
  for (const now of [Date.parse('2026-10-03T12:00:00Z'), dogtooth - 1, dogtooth + 60_000, dogtooth + SCREENING_WINDOW_MS + DAY - 60_000]) {
    const columns = attendanceColumns(ID, { now });
    assert.equal(current(columns).event.screeningId, 'dogtooth', new Date(now).toISOString());
    const index = columns.indexOf(current(columns));
    assert.ok(columns.slice(0, index).every(item => item.state === 'past'));
    assert.ok(columns.slice(index + 1).every(item => item.state === 'upcoming'));
  }
  assert.equal(current(attendanceColumns(ID, { now: dogtooth + SCREENING_WINDOW_MS + DAY + 60_000 })).event.screeningId, 'amour');
  assert.equal(current(attendanceColumns(ID, { now: amour + SCREENING_WINDOW_MS + DAY + 60_000 })).event.screeningId, 'hiroshima');
  const next = current(attendanceColumns(ID, { now: hiroshima + SCREENING_WINDOW_MS + DAY + 60_000 }));
  assert.equal(next.event.parent, 's6');
  assert.equal(next.event.type, 'lecture');
});

test('once every dated meeting is over, the next one still to be scheduled is current', () => {
  const columns = attendanceColumns(ID, { now: Date.parse('2027-06-01T00:00:00Z') });
  const index = columns.indexOf(current(columns));
  assert.ok(index > 0);
  assert.equal(columns[index].end, null);
  assert.ok(columns.slice(0, index).every(item => item.state === 'past'));
});

test('a teaching assistant sees an unrevealed screening by its own title in the series', () => {
  const before = attendanceColumns(ID, { now: dogtooth - 60_000, ta: true });
  assert.equal(column(before, 'dogtooth').title, 'Intermezzo: Sin or Sine or Sign or—the Curve');
  assert.equal(column(before, 'hiroshima').title, 'Après-Coup, Love’s Oblivion, or—the Eye');
  assert.equal(column(before, 'tambien').title, 'The End of Ends: Sex, Reason, Being');   // no title of its own: its session's
  for (const item of before.filter(entry => entry.event.type === 'screening' && entry.state === 'upcoming')) {
    assert.ok(!screenings.some(film => film.title === item.title), 'no film title ahead: ' + item.title);
  }
  // the syllabus reveals a film when its screening begins; so does the table
  assert.equal(column(attendanceColumns(ID, { now: dogtooth + 1, ta: true }), 'dogtooth').title, 'Dogtooth');
  assert.equal(column(attendanceColumns(ID, { now: dogtooth + 1, ta: true }), 'hiroshima').title, 'Après-Coup, Love’s Oblivion, or—the Eye');
  // an instructor always sees the film
  assert.equal(column(attendanceColumns(ID, { now: dogtooth - 60_000 }), 'hiroshima').title, 'Hiroshima, Mon Amour');
});

test('Intermezzo II: a teaching assistant sees its series title until 10 p.m. Eastern on 14 October, then Amour Fou', () => {
  assert.equal(amour, Date.parse('2026-10-15T02:00:00Z'));
  assert.equal(column(attendanceColumns(ID, { now: amour - 1, ta: true }), 'amour').title, 'Intermezzo II: Till Death Do Us Part, or—the Gap');
  assert.equal(column(attendanceColumns(ID, { now: amour, ta: true }), 'amour').title, 'Amour Fou');
  // admins and teachers see the film throughout
  assert.equal(column(attendanceColumns(ID, { now: amour - 60_000 }), 'amour').title, 'Amour Fou');
});

test('undated seminars: every column, none current', () => {
  const columns = attendanceColumns('coining-reason-unit-1', { now: Date.parse('2026-10-03T12:00:00Z') });
  assert.equal(columns.length, 9);
  assert.ok(columns.every(item => item.state === 'none' && item.date === 'Date TBD' && item.kicker === 'Discussion'));
  assert.deepEqual(attendanceColumns('no-such-seminar'), []);
});
