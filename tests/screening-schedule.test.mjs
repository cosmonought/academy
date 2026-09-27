import test from 'node:test';
import assert from 'node:assert/strict';
import { screeningSchedule } from '../js/screening-schedule.js';

test('only the nearest scheduled screening gets navigation, through its full four-hour window', () => {
  const before = screeningSchedule(Date.parse('2026-09-27T12:00:00Z'));
  assert.equal(before.nextId, 'park');
  assert.deepEqual(before.pastIds, ['skin', 'sister', 'cook', 'mother']);
  assert.equal(screeningSchedule(Date.parse('2026-10-01T05:59:59Z')).nextId, 'park');
  const after = screeningSchedule(Date.parse('2026-10-01T06:00:00Z'));
  assert.equal(after.nextId, 'hiroshima');
  assert.ok(after.pastIds.includes('park'));
  const done = screeningSchedule(Date.parse('2026-10-08T06:00:00Z'));
  assert.equal(done.nextId, null);
  assert.ok(done.pastIds.includes('hiroshima'));
  assert.ok(!done.pastIds.includes('tambien'));
});
