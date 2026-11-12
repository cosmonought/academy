import { createPrivateKey, sign } from 'node:crypto';

// Cloudflare Stream live input for the Cinema screening room. These are
// public playback identifiers, not credentials; the signing key is the secret.
export const CINEMA_STREAM = Object.freeze({
  seminarId: 'sex-and-or-love',
  customerCode: 'piioie1ibxduv2ke',
  liveInputId: 'f1908b679bf82268c809e1709ab0c580'
});

// Long enough for a full screening; Cloudflare refuses tokens over 24 hours.
export const STREAM_TOKEN_TTL_SECONDS = 6 * 60 * 60;

const base64url = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

// Cloudflare's /stream/keys returns `pem` base64-encoded. Accept either that or a raw PEM.
function privateKeyFrom(pem) {
  if (typeof pem !== 'string' || !pem.trim()) throw new Error('Stream signing key is not configured.');
  const text = pem.includes('BEGIN') ? pem : Buffer.from(pem.trim(), 'base64').toString('utf8');
  return createPrivateKey(text);
}

// Self-signed RS256 token, as documented for Cloudflare Stream signing keys.
export function signStreamToken({ keyId, pem, sub, ttlSeconds = STREAM_TOKEN_TTL_SECONDS, now = Date.now }) {
  if (typeof keyId !== 'string' || !keyId.trim()) throw new Error('Stream signing key ID is not configured.');
  const kid = keyId.trim();
  const issued = Math.floor(now() / 1000);
  const exp = issued + ttlSeconds;
  const header = base64url({ alg: 'RS256', kid });
  const payload = base64url({ sub, kid, exp, nbf: issued - 60 });
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKeyFrom(pem)).toString('base64url');
  return { token: `${header}.${payload}.${signature}`, expiresAt: exp * 1000 };
}
