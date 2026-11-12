import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { signStreamToken, CINEMA_STREAM, STREAM_TOKEN_TTL_SECONDS } from '../functions/stream-token.js';
import { createStaffService } from '../functions/staff-service.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

test('signs an RS256 Cloudflare Stream token that verifies, with Cloudflare base64 PEM or raw PEM', () => {
  for (const key of [Buffer.from(pem).toString('base64'), pem]) {
    const { token, expiresAt } = signStreamToken({ keyId: 'kid123', pem: key, sub: 'input', now: () => 1_000_000_000_000 });
    const [header, payload, signature] = token.split('.');
    assert.deepEqual(decode(header), { alg: 'RS256', kid: 'kid123' });
    const claims = decode(payload);
    assert.equal(claims.sub, 'input'); assert.equal(claims.kid, 'kid123');
    assert.equal(claims.exp, 1_000_000_000 + STREAM_TOKEN_TTL_SECONDS);
    assert.ok(claims.exp - 1_000_000_000 <= 24 * 3600, 'Cloudflare rejects tokens over 24 hours');
    assert.equal(expiresAt, claims.exp * 1000);
    assert.ok(verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url')));
  }
});

test('missing key configuration fails instead of issuing a token', () => {
  assert.throws(() => signStreamToken({ keyId: '', pem, sub: 'x' }));
  assert.throws(() => signStreamToken({ keyId: 'k', pem: '', sub: 'x' }));
});

function fixture(registration, staff = {}) {
  const data = { seminarStaff: { [CINEMA_STREAM.seminarId]: staff }, academyRegistrations: registration ? { 'p@example,org': { [CINEMA_STREAM.seminarId]: registration } } : {} };
  const users = { p: { uid: 'p', email: 'p@example.org', emailVerified: true }, other: { uid: 'other', email: 'p@example.org', emailVerified: true }, unverified: { uid: 'u', email: 'p@example.org', emailVerified: false }, ta: { uid: 'ta', email: 'ta@example.org' }, admin: { uid: 'admin', email: 'academy@netadao.org', emailVerified: true } };
  const get = path => path.split('/').filter(Boolean).reduce((v, k) => v?.[k], data) ?? null;
  const db = { ref: path => ({ get: async () => ({ val: () => structuredClone(get(path)) }) }) };
  const auth = { getUser: async uid => users[uid] };
  const signed = [];
  const service = createStaffService({ db, auth, streamSigner: sub => { signed.push(sub); return { token: 'signed.' + sub, expiresAt: 5 }; } });
  const call = uid => ({ auth: { uid, token: { email: users[uid].email, email_verified: users[uid].emailVerified } }, data: {} });
  return { service, call, signed };
}

test('enrolled owner, assigned staff and admin receive a token for the live input', async () => {
  const cases = [
    [fixture({ enrolled: true, accountUid: 'p' }), 'p'],
    [fixture({ enrolled: true }), 'p'],
    [fixture(null, { ta: { role: 'ta' } }), 'ta'],
    [fixture(null), 'admin']
  ];
  for (const [{ service, call, signed }, uid] of cases) {
    const result = await service.cinemaStreamToken(call(uid));
    assert.equal(result.token, 'signed.' + CINEMA_STREAM.liveInputId);
    assert.equal(result.host, `https://customer-${CINEMA_STREAM.customerCode}.cloudflarestream.com`);
    assert.deepEqual(signed, [CINEMA_STREAM.liveInputId]);
  }
});

test('unenrolled, someone else\'s registration, unverified unclaimed email and signed-out users get no token', async () => {
  for (const [registration, uid] of [[{ enrolled: false, accountUid: 'p' }, 'p'], [null, 'p'], [{ enrolled: true, accountUid: 'p' }, 'other'], [{ enrolled: true }, 'unverified']]) {
    const { service, call, signed } = fixture(registration);
    await assert.rejects(service.cinemaStreamToken(call(uid)), { code: 'permission-denied' });
    assert.deepEqual(signed, []);
  }
  const { service } = fixture({ enrolled: true });
  await assert.rejects(service.cinemaStreamToken({ data: {} }), { code: 'unauthenticated' });
});

test('an unconfigured signer refuses rather than leaking an unsigned URL', async () => {
  const data = { academyRegistrations: { 'p@example,org': { [CINEMA_STREAM.seminarId]: { enrolled: true, accountUid: 'p' } } } };
  const get = path => path.split('/').filter(Boolean).reduce((v, k) => v?.[k], data) ?? null;
  const service = createStaffService({ db: { ref: path => ({ get: async () => ({ val: () => get(path) }) }) }, auth: { getUser: async () => ({ uid: 'p', email: 'p@example.org', emailVerified: true }) } });
  await assert.rejects(service.cinemaStreamToken({ auth: { uid: 'p', token: {} }, data: {} }), { code: 'failed-precondition' });
});
