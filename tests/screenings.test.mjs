import test from 'node:test';
import assert from 'node:assert/strict';
import { screenings, canRevealTitle, screeningText, filmCredit, renderScreenings } from '../js/seminar-screenings.js';

test('scheduled titles reveal at 10 p.m. Eastern, including the UTC date rollover', () => {
  for (const [id, utc] of [['park', '2026-10-01T02:00:00Z'], ['hiroshima', '2026-10-08T02:00:00Z']]) {
    const film = screenings.find(item => item.id === id);
    const start = Date.parse(utc);
    assert.equal(Date.parse(film.startsAt), start);
    assert.equal(canRevealTitle(film, true, start - 1), false);
    assert.equal(canRevealTitle(film, true, start), true);
    assert.equal(canRevealTitle(film, true, start + 1), true);
    assert.equal(screeningText(film, true, start - 1).includes(film.title), false);
    assert.equal(screeningText(film, true, start), filmCredit(film));
  }
});

test('enrollment is required even for completed screenings', () => {
  for (const film of screenings) {
    assert.equal(canRevealTitle(film, false, Date.parse('2030-01-01')), false);
    assert.equal(screeningText(film, false).includes(film.title), false);
  }
  assert.equal(canRevealTitle(screenings.find(film => film.id === 'cook'), true), true);
});

test('unknown and invalid screening times never reveal automatically', () => {
  for (const startsAt of [null, '', 'invalid']) {
    assert.equal(canRevealTitle({ title: 'Hidden', startsAt }, true, Date.parse('2030-01-01')), false);
  }
  for (const id of ['tambien', 'someone']) {
    assert.equal(canRevealTitle(screenings.find(film => film.id === id), true, Date.parse('2030-01-01')), false);
  }
});

test('an open page reveals at the boundary and hides again when enrollment is lost', () => {
  const film = screenings.find(item => item.id === 'park');
  const classes = new Set();
  const node = { textContent: '', classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } };
  const root = { querySelector(selector) { return selector === '[data-screening="park"]' ? node : null; } };
  const start = Date.parse(film.startsAt);
  renderScreenings(root, true, start - 1);
  assert.ok(!node.textContent.includes(film.title));
  renderScreenings(root, true, start);
  assert.equal(node.textContent, filmCredit(film));
  assert.ok(classes.has('film-revealed'));
  renderScreenings(root, false, start + 1);
  assert.ok(!node.textContent.includes(film.title));
  assert.ok(!classes.has('film-revealed'));
});
