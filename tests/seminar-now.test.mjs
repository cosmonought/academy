import test from 'node:test';
import assert from 'node:assert/strict';
import { participantPlan, currentScreening, bannerState, SCREENING_WINDOW_MS } from '../js/seminar-now.js';

const start = Date.parse('2026-10-01T02:00:00Z');
test('next-event panel advances from screening to screening, then lecture, then the undated session', () => {
  assert.equal(participantPlan(Date.parse('2026-09-27')).film.id, 'park');
  assert.equal(participantPlan(start).underway, true);
  assert.equal(participantPlan(start + SCREENING_WINDOW_MS).film.id, 'hiroshima');
  assert.equal(participantPlan(start + 90 * 60000).film.id, 'park');
  assert.equal(participantPlan(Date.parse('2026-10-08T06:00:00Z')).kind, 'lecture');
  assert.equal(participantPlan(Date.parse('2026-10-15T03:59:59Z')).today, true);
  const after = participantPlan(Date.parse('2026-10-15T04:00:00Z'));
  assert.equal(after.kind, 'unscheduled');
  assert.equal(after.session.id, 'session7');
});
for (const [id, timestamp] of [['park', '2026-10-01T02:00:00Z'], ['hiroshima', '2026-10-08T02:00:00Z']]) {
  test(`${id}: Cinema navigation starts at 10 p.m. Eastern and ends exactly at 2 a.m.`, () => {
    const begins = Date.parse(timestamp);
    assert.equal(bannerState(begins - 1), null);
    assert.equal(currentScreening(begins).id, id);
    for (const elapsed of [0, 30 * 60000, 90 * 60000, SCREENING_WINDOW_MS - 1]) {
      const state = bannerState(begins + elapsed);
      assert.equal(state.film.id, id);
      assert.equal(state.label, 'Screening night');
      assert.equal(participantPlan(begins + elapsed).film.id, id);
    }
    assert.equal(bannerState(begins + SCREENING_WINDOW_MS), null);
    assert.equal(currentScreening(begins + SCREENING_WINDOW_MS), null);
  });
}
test('no announcement appears outside a scheduled screening night', () => {
  assert.equal(bannerState(Date.parse('2026-09-27')), null);
  assert.equal(bannerState(Date.parse('2030-01-01')), null);
});
