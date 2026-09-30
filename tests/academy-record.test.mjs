import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ATTENDANCE_EVENTS, EVALUATION_CONFIG, attendanceRecord, participantAttendanceRecord } from '../js/academy-record.js';

test('Sex/Love records distinct lecture and screening events without inferring old unit marks', () => {
  const events = ATTENDANCE_EVENTS['sex-and-or-love'];
  assert.equal(events.filter(event => event.type === 'lecture').length, 9);
  assert.equal(events.filter(event => event.type === 'screening').length, 8);
  const record = attendanceRecord('sex-and-or-love', { attendance: { s6: true, 'lecture-s6': true, 'screening-mother': false } });
  assert.equal(record.attended, 1);
  assert.equal(record.total, 17);
  assert.equal(record.legacy.length, 1);
  assert.equal(record.detail.find(event => event.key === 'screening-cook').status, 'unrecorded');
  assert.equal(record.detail.find(event => event.key === 'screening-mother').status, 'missed');
});
test('Coining Reason legacy keys map directly to single discussion events', () => {
  assert.equal(attendanceRecord('coining-reason-unit-1', { attendance: { s1: true } }).attended, 1);
});


test('Love’s Measure screenings stay chronological inside their parent session', () => {
  const events = ATTENDANCE_EVENTS['sex-and-or-love'].filter(event => event.parent === 's6');
  assert.deepEqual(events.map(event => event.key), [
    'screening-cook',
    'screening-mother',
    'screening-park',
    'screening-hiroshima',
    'lecture-s6'
  ]);
});

test('participant attendance does not reveal future film titles', () => {
  const beforeKenPark = Date.parse('2026-09-29T12:00:00-04:00');
  const record = participantAttendanceRecord('sex-and-or-love', { attendance: {} }, beforeKenPark);
  const park = record.detail.find(event => event.key === 'screening-park');
  const cook = record.detail.find(event => event.key === 'screening-cook');
  assert.ok(!park.label.includes('Ken Park'));
  assert.match(park.label, /Screening/);
  assert.equal(cook.label, 'The Cook, the Thief, His Wife & Her Lover');
  assert.deepEqual(record.legacy, []);
});

test('evaluation configuration distinguishes enabled seminars from not-enabled records', () => {
  assert.equal(EVALUATION_CONFIG['sex-and-or-love'].enabled, false);
  assert.equal(EVALUATION_CONFIG['coining-reason-unit-2'].enabled, false);
  assert.equal(EVALUATION_CONFIG['sex-monsters-superheroes'].enabled, true);
  assert.equal(EVALUATION_CONFIG['sex-monsters-superheroes'].minimumAttendanceEvents, 1);
});
