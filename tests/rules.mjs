import { readFile } from 'node:fs/promises';
import { test, before, after, beforeEach } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update } from 'firebase/database';

let env;
const seminar = 'sex-and-or-love';
const email = 'participant@example.org';
const path = `academyRegistrations/participant@example,org/${seminar}`;
const registration = { email, name: 'Participant', xHandle: '@participant', reason: 'Study', requestedAt: 1 };
const user = (uid, verified = false, address = email) => env.authenticatedContext(uid, { email: address, email_verified: verified }).database();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-academy', database: { rules: await readFile('firebase-rules-latest.json', 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearDatabase(); });
async function seed(record) {
  await env.withSecurityRulesDisabled(async context => {
    await set(ref(context.database(), path), record);
    await set(ref(context.database(), `seminarReadings/${seminar}`), { session1: { text: 'https://example.org/reading' } });
  });
}
test('new password user can create and read their own pending registration', async () => {
  const db = user('new-account');
  await assertSucceeds(get(ref(db, path)));
  await assertSucceeds(update(ref(db, path), { ...registration, accountUid: 'new-account' }));
  await assertSucceeds(get(ref(db, path)));
  await assertFails(get(ref(db, `seminarReadings/${seminar}`)));
  await assertFails(update(ref(db, path), { enrolled: true }));
  await assertFails(update(ref(db, path + '/attendance'), { s1: true }));
});
test('anonymous registration and forged UID/email are rejected', async () => {
  await assertFails(set(ref(env.unauthenticatedContext().database(), path), registration));
  await assertFails(set(ref(user('new-account'), path), { ...registration, accountUid: 'somebody-else' }));
  await assertFails(set(ref(user('new-account', false, 'different@example.org'), path), { ...registration, accountUid: 'new-account' }));
  await assertFails(set(ref(user('new-account'), path), { ...registration, accountUid: 'new-account', enrolled: true }));
});
test('unverified email cannot read or claim an enrolled legacy record', async () => {
  await seed({ ...registration, enrolled: true });
  const db = user('impostor');
  await assertFails(get(ref(db, path)));
  await assertFails(get(ref(db, `seminarReadings/${seminar}`)));
  await assertFails(update(ref(db, path), { accountUid: 'impostor' }));
  await assertFails(update(ref(db, path), { ...registration, accountUid: 'impostor' }));
  await assertFails(set(ref(db, path), null));
});
test('verified legacy email retains enrollment and protected reading access', async () => {
  await seed({ ...registration, enrolled: true });
  await assertSucceeds(get(ref(user('legacy-account', true), path)));
  await assertSucceeds(get(ref(user('legacy-account', true), `seminarReadings/${seminar}`)));
});
test('UID-bound enrollment survives password login but cannot be stolen by another UID', async () => {
  await seed({ ...registration, accountUid: 'owner', enrolled: true });
  await assertSucceeds(get(ref(user('owner'), path)));
  await assertSucceeds(get(ref(user('owner'), `seminarReadings/${seminar}`)));
  for (const verified of [false, true]) {
    await assertFails(get(ref(user('other', verified), path)));
    await assertFails(get(ref(user('other', verified), `seminarReadings/${seminar}`)));
    await assertFails(update(ref(user('other', verified), path), { accountUid: 'other' }));
  }
  await assertFails(update(ref(user('owner'), path), { accountUid: 'other' }));
});
test('only verified administrator can approve, record attendance or manually bind legacy accounts', async () => {
  await seed(registration);
  const unverified = user('fake-admin', false, 'academy@netadao.org');
  await assertFails(get(ref(unverified, 'academyRegistrations')));
  await assertFails(update(ref(unverified, path), { enrolled: true }));
  const admin = user('admin', true, 'academy@netadao.org');
  await assertSucceeds(get(ref(admin, 'academyRegistrations')));
  await assertSucceeds(update(ref(admin, path), { enrolled: true, accountUid: 'owner', 'attendance/s1': true }));
  await assertSucceeds(get(ref(user('owner'), `seminarReadings/${seminar}`)));
});
test('parent reads cannot bypass ownership checks; signup switch is server managed', async () => {
  await seed({ ...registration, enrolled: true, accountUid: 'owner' });
  await assertFails(get(ref(user('other', true), 'academyRegistrations/participant@example,org')));
  const guest = env.unauthenticatedContext().database();
  await assertSucceeds(get(ref(guest, 'academyConfig/passwordAccountsEnabled')));
  await assertFails(set(ref(guest, 'academyConfig/passwordAccountsEnabled'), true));
});
