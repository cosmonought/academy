import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ATTENDANCE_EVENTS, attendanceRecord } from '../js/academy-record.js';

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
