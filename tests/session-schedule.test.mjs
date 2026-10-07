import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionStates, scheduleLabels } from '../js/session-schedule.js';
import { sessions, screenings } from '../js/seminar-data.js';

const state = (id, date) => sessionStates(Date.parse(date)).find(session => session.id === id);
test('session status follows the Eastern lecture day and screening sequence', () => {
  assert.equal(state('session6', '2026-09-27T12:00:00Z').label, 'In progress');
  assert.equal(state('session5', '2026-09-27T12:00:00Z').label, 'Past');
  assert.equal(state('session6', '2026-10-15T04:00:00Z').label, 'In progress');   // Hiroshima, then the lecture on 21 October
  assert.equal(state('session6', '2026-10-22T03:59:59Z').label, 'In progress');
  assert.equal(state('session6', '2026-10-22T04:00:00Z').label, 'Past');
  assert.equal(state('session7', '2026-10-22T04:00:00Z').label, 'Date TBD');
});
test('the first dated lecture is next before the series starts; later lectures are scheduled', () => {
  assert.equal(state('session0', '2026-02-01T12:00:00Z').label, 'Next');
  assert.equal(state('session1', '2026-02-01T12:00:00Z').label, 'Scheduled');
});
test('all lecture dates, screening dates and summaries derive from the same schedule', () => {
  const labels = scheduleLabels();
  assert.equal(labels.filter(label => label.attribute === 'data-lecture-date').length, sessions.length);
  assert.equal(labels.filter(label => label.attribute === 'data-screening-date').length, screenings.length);
  const summary = labels.find(label => label.attribute === 'data-screening-summary' && label.id === 'session6').text;
  for (const date of ['16 September', '23 September', '30 September', '7 October', '14 October']) assert.ok(summary.includes(date));
  assert.equal(labels.find(label => label.id === 'session7' && label.attribute === 'data-lecture-date').text, 'Date TBD');
});
