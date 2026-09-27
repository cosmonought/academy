import test from 'node:test';
import assert from 'node:assert/strict';
import { emailActionDestination } from '../js/auth-action-route.js';

test('password links go to Academy without accepting an external return destination', () => {
  const destination = emailActionDestination('?mode=resetPassword&oobCode=test-code&continueUrl=https://example.invalid&returnTo=//example.invalid');
  assert.equal(destination, '/account.html?mode=resetPassword&oobCode=test-code');
  assert.equal(emailActionDestination('?mode=resetPassword'), '/account.html?mode=resetPassword');
});

test('other email actions retain their parameters at the fixed Firebase handler', () => {
  for (const mode of ['verifyEmail', 'recoverEmail', 'signIn', 'verifyAndChangeEmail']) {
    const query = new URLSearchParams({ mode, oobCode: 'test-code', apiKey: 'test-key', continueUrl: 'https://academy.netadao.org/set-password.html', lang: 'en' });
    const destination = new URL(emailActionDestination('?' + query));
    assert.equal(destination.origin, 'https://neta-dao-cinema.firebaseapp.com');
    assert.equal(destination.pathname, '/__/auth/action');
    assert.equal(destination.searchParams.toString(), query.toString());
  }
});
