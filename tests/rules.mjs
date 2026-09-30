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

test('forthcoming seminar interest is public create-only and separate from newsletter signups', async () => {
  const guest = env.unauthenticatedContext().database();
  const interestPath = 'seminarInterests/request-1';
  const interest = {
    name: '',
    email: 'reader@example.org',
    seminarId: 'sex-monsters-superheroes',
    seminarTitle: 'Sex, Monsters, and Superheroes',
    state: 'interested',
    notifyWhenEnrollmentOpens: true,
    submittedAt: 1
  };
  await assertSucceeds(set(ref(guest, interestPath), interest));
  await assertFails(get(ref(guest, interestPath)));
  await assertFails(update(ref(guest, interestPath), { name: 'Changed' }));
  await assertFails(set(ref(guest, 'seminarInterests/request-2'), { ...interest, seminarId: 'sex-and-or-love' }));
  await assertSucceeds(get(ref(user('admin', true, 'academy@netadao.org'), 'seminarInterests')));
});

test('The Graphic enrollment requires current policy assent while existing seminar registration stays compatible', async () => {
  const graphicPath = 'academyRegistrations/participant@example,org/sex-monsters-superheroes';
  const base = { ...registration, accountUid: 'graphic-account' };
  const db = user('graphic-account');
  await assertFails(update(ref(db, graphicPath), base));
  await assertFails(update(ref(db, graphicPath), { ...base, policyAccepted: false, policyVersion: '2026-09-29', policyAcceptedAt: 1 }));
  await assertFails(update(ref(db, graphicPath), { ...base, policyAccepted: true, policyVersion: 'old-version', policyAcceptedAt: 1 }));
  await assertSucceeds(update(ref(db, graphicPath), { ...base, policyAccepted: true, policyVersion: '2026-09-29', policyAcceptedAt: 1 }));

  const legacyCompatiblePath = 'academyRegistrations/second@example,org/sex-and-or-love';
  const legacyDb = user('second-account', false, 'second@example.org');
  await assertSucceeds(update(ref(legacyDb, legacyCompatiblePath), {
    email: 'second@example.org', name: 'Second', xHandle: '@second', reason: 'Study', requestedAt: 1, accountUid: 'second-account'
  }));
});

test('display name is account-owned and bounded', async () => {
  const owner = user('owner');
  await assertSucceeds(set(ref(owner, 'accountMeta/participant@example,org/displayName'), 'Jacques'));
  await assertFails(set(ref(owner, 'accountMeta/participant@example,org/displayName'), ' padded '));
  await assertFails(set(ref(owner, 'accountMeta/participant@example,org/displayName'), 'x'.repeat(41)));
  await assertFails(set(ref(user('other', false, 'different@example.org'), 'accountMeta/participant@example,org/displayName'), 'Intruder'));
  await assertFails(set(ref(owner, 'accountMeta/participant@example,org/unknown'), 'value'));
});

test('participant can request Graphic evaluation but cannot write instructor outcome or attendance', async () => {
  const graphicPath = 'academyRegistrations/participant@example,org/sex-monsters-superheroes';
  const evalPath = 'evaluations/participant@example,org/sex-monsters-superheroes';
  await env.withSecurityRulesDisabled(async context => set(ref(context.database(), graphicPath), { ...registration, enrolled: true, accountUid: 'owner', policyAccepted: true, policyVersion: '2026-09-29', policyAcceptedAt: 1 }));
  const owner = user('owner');
  await assertSucceeds(set(ref(owner, `${evalPath}/request`), { form: 'essay', requestedAt: 1, accountUid: 'owner' }));
  await assertSucceeds(get(ref(owner, evalPath)));
  await assertFails(set(ref(owner, `${evalPath}/instructor`), { state: 'completed', form: 'essay', outcome: 'distinction', feedback: 'Excellent.' }));
  await assertFails(set(ref(owner, `${graphicPath}/attendance/lecture-s0`), true));
  await assertFails(get(ref(user('other', true, 'different@example.org'), evalPath)));
  const admin = user('admin', true, 'academy@netadao.org');
  await assertSucceeds(set(ref(admin, `${evalPath}/instructor`), { state: 'completed', form: 'essay', outcome: 'merit', feedback: 'Detailed reading.' }));
  await assertFails(set(ref(owner, `${evalPath}/request`), { form: 'presentation', requestedAt: 2, accountUid: 'owner' }));
  await assertSucceeds(set(ref(admin, `${graphicPath}/attendance/lecture-s0`), true));
});

test('interest receipt is visible only to matching account, without exposing anonymous interest list', async () => {
  const receipt = 'accountSeminarInterests/participant@example,org/sex-monsters-superheroes';
  const owner = user('owner');
  await assertSucceeds(set(ref(owner, receipt), { email, accountUid: 'owner', submittedAt: 1 }));
  await assertSucceeds(get(ref(owner, receipt)));
  await assertFails(get(ref(owner, 'accountSeminarInterests/participant@example,org')));
  await assertFails(get(ref(owner, 'seminarInterests')));
  await assertFails(get(ref(user('other', true, 'different@example.org'), receipt)));
  await assertFails(set(ref(owner, receipt), { email, accountUid: 'owner', submittedAt: 2 }));
});
