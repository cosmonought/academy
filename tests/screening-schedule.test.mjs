import test from 'node:test';
import assert from 'node:assert/strict';
import { screeningSchedule } from '../js/screening-schedule.js';

test('only the nearest scheduled screening gets navigation, through its full four-hour window', () => {
  const before = screeningSchedule(Date.parse('2026-09-27T12:00:00Z'));
  assert.equal(before.nextId, 'park');
  assert.deepEqual(before.pastIds, ['skin', 'sister', 'cook', 'mother']);
  assert.equal(screeningSchedule(Date.parse('2026-10-01T05:59:59Z')).nextId, 'park');
  const after = screeningSchedule(Date.parse('2026-10-01T06:00:00Z'));
  assert.equal(after.nextId, 'dogtooth');
  assert.ok(after.pastIds.includes('park'));
  const intermezzo = screeningSchedule(Date.parse('2026-10-08T06:00:00Z'));   // Dogtooth's window closed: Amour Fou, a week on
  assert.equal(intermezzo.nextId, 'amour');
  assert.ok(intermezzo.pastIds.includes('dogtooth'));
  const second = screeningSchedule(Date.parse('2026-10-15T06:00:00Z'));   // then Hiroshima, a week later
  assert.equal(second.nextId, 'hiroshima');
  assert.ok(second.pastIds.includes('amour'));
  const done = screeningSchedule(Date.parse('2026-10-22T06:00:00Z'));
  assert.equal(done.nextId, null);
  assert.ok(done.pastIds.includes('hiroshima'));
  assert.ok(!done.pastIds.includes('tambien'));
});
