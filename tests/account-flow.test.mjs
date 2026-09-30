import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, signInDestination, destinationLabel, seminarAccountLink, passwordIssue, accountError } from '../js/account-flow.js';

test('seminar registration and sign-in share an explicit confirmation destination', () => {
  for (const view of ['create', 'signin']) {
    const url = new URL(seminarAccountLink('sex-and-or-love', view, '/sex-and-or-love.html#accessPanel'), 'https://academy.netadao.org');
    assert.equal(url.searchParams.get('view'), view);
    assert.equal(url.searchParams.get('seminar'), 'sex-and-or-love');
    assert.equal(signInDestination(url.searchParams.get('returnTo')), '/sex-and-or-love.html#accessPanel');
  }
  assert.equal(destinationLabel('/sex-and-or-love.html#accessPanel'), 'Return to seminar access →');
});

test('sign-in preserves explicitly requested access sections and names the destination', () => {
  assert.equal(signInDestination('/sex-and-or-love.html#participation'), '/sex-and-or-love.html#participation');
  assert.equal(signInDestination('/seminar.html#coining-access'), '/seminar.html#coining-access');
  assert.equal(signInDestination('/sex-and-or-love.html#session6'), '/sex-and-or-love.html#session6');
  assert.equal(signInDestination('https://example.invalid'), '/profile.html');
  assert.equal(destinationLabel('/profile.html'), 'Continue to your profile →');
  assert.equal(destinationLabel('/sex-and-or-love.html#session6'), 'Continue to Sex, and/or Love →');
});

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

test('Google provider conflicts preserve the existing sign-in method and offer recovery', () => {
  assert.match(accountError({ code: 'auth/account-exists-with-different-credential' }), /existing email and password/);
  assert.match(accountError({ code: 'auth/account-exists-with-different-credential' }), /Accounts have not been linked/);
  assert.match(accountError({ code: 'auth/popup-blocked' }), /popup/);
});
