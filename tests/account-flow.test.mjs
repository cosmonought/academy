import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, passwordIssue, accountError } from '../js/account-flow.js';

test('sign-in returns only to known local Academy pages', () => {
  assert.equal(safeReturnPath('/cinema.html'), '/cinema.html');
  assert.equal(safeReturnPath('/sex-and-or-love.html#sessions'), '/sex-and-or-love.html#sessions');
  for (const path of [null, 'https://attacker.test', '//attacker.test', '/\\attacker.test', '/account.html?mode=resetPassword', '/%2f%2fattacker.test', '/other.html']) {
    assert.equal(safeReturnPath(path), '/profile.html');
  }
});
test('new passwords require confirmation while existing passwords are not restricted', () => {
  assert.match(passwordIssue('short', 'short'), /8 characters/);
  assert.match(passwordIssue('long enough', 'different'), /do not match/);
  assert.equal(passwordIssue('a longer password', 'a longer password'), '');
});
test('sign-in errors do not identify whether an email has an account', () => {
  assert.equal(accountError({ code: 'auth/user-not-found' }), accountError({ code: 'auth/wrong-password' }));
  assert.match(accountError({ code: 'auth/email-already-in-use' }), /Set or reset a password/);
  assert.match(accountError({ code: 'PERMISSION_DENIED' }), /registered X handle/);
});
