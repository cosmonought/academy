import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScreenings } from '../js/seminar-screenings.js';

function node() {
  return {
    children: [], textContent: '', classList: { toggle() {} },
    replaceChildren() { this.children = []; this.textContent = ''; },
    append(value) { this.children.push(value); this.textContent += typeof value === 'string' ? value : value.textContent; }
  };
}

test('revealed screening credits italicize only the film title', () => {
  const skin = node();
  const root = {
    querySelector(selector) { return selector === '[data-screening="skin"]' ? skin : null; },
    createElement() { return { tagName: 'EM', textContent: '' }; }
  };
  renderScreenings(root, true);
  assert.equal(skin.children[0].tagName, 'EM');
  assert.equal(skin.children[0].textContent, 'Dans Ma Peau');
  assert.equal(skin.children[1], ' (dir. Marina de Van)');
});
