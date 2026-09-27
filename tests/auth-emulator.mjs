import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode, signOut,
  sendSignInLinkToEmail, signInWithEmailLink, updatePassword } from 'firebase/auth';

test('password-first and legacy email-link accounts can sign in and recover without losing their UID', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Run only with the local Auth emulator');
  const app = initializeApp({ projectId: 'demo-academy', apiKey: 'demo-api-key' }, 'auth-flow-test');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
  try {
    const email = `new-${Date.now()}@example.org`;
    const created = await createUserWithEmailAndPassword(auth, email, 'Local-test-only-123');
    const uid = created.user.uid;
    assert.equal(auth.currentUser.uid, uid);
    await signOut(auth);
    assert.equal(auth.currentUser, null);
    assert.equal((await signInWithEmailAndPassword(auth, email, 'Local-test-only-123')).user.uid, uid);
    // A signed-in participant can choose a password directly.
    await updatePassword(auth.currentUser, 'Changed-local-only-123');
    await signOut(auth);
    assert.equal((await signInWithEmailAndPassword(auth, email, 'Changed-local-only-123')).user.uid, uid);
    await signOut(auth);

    const legacyEmail = `legacy-${Date.now()}@example.org`;
    await sendSignInLinkToEmail(auth, legacyEmail, { url: 'http://localhost/set-password.html', handleCodeInApp: true });
    const codes = async () => (await (await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/demo-academy/oobCodes`)).json()).oobCodes;
    const signInCode = (await codes()).find(code => code.email === legacyEmail && code.requestType === 'EMAIL_SIGNIN');
    const legacy = await signInWithEmailLink(auth, legacyEmail, signInCode.oobLink);
    const legacyUid = legacy.user.uid;
    assert.equal(legacy.user.emailVerified, true);
    await signOut(auth);
    await sendPasswordResetEmail(auth, legacyEmail);
    const reset = (await codes()).find(code => code.email === legacyEmail && code.requestType === 'PASSWORD_RESET');
    assert.equal(await verifyPasswordResetCode(auth, reset.oobCode), legacyEmail);
    await confirmPasswordReset(auth, reset.oobCode, 'Recovered-local-only-123');
    const recovered = await signInWithEmailAndPassword(auth, legacyEmail, 'Recovered-local-only-123');
    assert.equal(recovered.user.uid, legacyUid);
    assert.equal(recovered.user.emailVerified, true);
    await assert.rejects(confirmPasswordReset(auth, reset.oobCode, 'Another-local-only-123'));
  } finally { await deleteApp(app); }
});
