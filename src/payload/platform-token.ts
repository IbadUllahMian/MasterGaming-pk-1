import crypto, { type KeyObject } from 'node:crypto';

// Single source (template side) for the platform auto-login token grammar. The
// platform mints a short-lived token so the content tab can open the Payload
// admin in an iframe without a separate login. Must stay byte-for-byte
// compatible with the backend minter (app/utils/payload_secrets.py).
//
// Token shape: `${base64url(payload)}.${base64url(ed25519_sig)}` where `payload`
// is `${appId}.${expUnixSeconds}`. The token is signed with the per-app Ed25519
// PRIVATE key held only by the platform; the website verifies with the matching
// PLATFORM_LOGIN_PUBLIC_KEY (base64 raw key, synced into the sandbox/Vercel env).
// The website never holds a key that can mint a token.

// First-party session cookie the sandbox sets AFTER a one-time platform-token
// handoff (see admin-login/route.ts). It carries a sandbox-signed session token
// (mintSessionToken below), NOT the platform token — so the admin session lives
// as long as the session TTL without re-contacting the platform every minute.
export const CMS_SESSION_COOKIE = 'kite-cms-session';

// Admin session lifetime. Sized from the CMS-access revocation window: losing
// access (team removal / plan downgrade / flag off) takes effect within at most
// this long, because the platform is only re-consulted when SessionKeepalive
// re-mints a platform token (well inside this TTL). Kept short enough that a
// removed user can't keep editing indefinitely, long enough to erase the old
// ~40s re-mint churn.
export const CMS_SESSION_TTL_SECONDS = 15 * 60;

export type TokenResult = { valid: boolean; appId?: string };

// A real per-app PAYLOAD_SECRET is a 64-char hex digest. This floor only rejects
// an empty or misprovisioned secret — which MUST fail closed: an empty HMAC key
// makes a session token forgeable from the appId alone, and the appId sits in
// the shareable preview URL. (verifyPlatformToken already fails closed the same
// way when PLATFORM_LOGIN_PUBLIC_KEY is missing.)
const MIN_SECRET_LENGTH = 32;

function publicKeyFrom(publicKeyB64: string): KeyObject {
  // The env carries the 32-byte raw Ed25519 public key as base64; Node builds a
  // KeyObject from it via JWK (raw keys aren't accepted by createPublicKey).
  const raw = Buffer.from(publicKeyB64, 'base64');
  return crypto.createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: raw.toString('base64url') },
    format: 'jwk',
  });
}

export function verifyPlatformToken(
  token: string | undefined,
  publicKeyB64: string | undefined,
): TokenResult {
  if (!token || !publicKeyB64) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [b64Payload, b64Sig] = parts;
  let payload: string;
  let signature: Buffer;
  let publicKey: KeyObject;
  try {
    payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    signature = Buffer.from(b64Sig, 'base64url');
    publicKey = publicKeyFrom(publicKeyB64);
  } catch {
    return { valid: false };
  }
  // Ed25519 verify is constant-time; algorithm is null for EdDSA.
  if (!crypto.verify(null, Buffer.from(payload), publicKey, signature)) {
    return { valid: false };
  }
  const sep = payload.lastIndexOf('.');
  if (sep === -1) return { valid: false };
  const appId = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return { valid: false };
  return { valid: true, appId };
}

// Mint the sandbox-signed admin session token. Symmetric (HMAC-SHA256 with the
// per-app PAYLOAD_SECRET the sandbox already holds): the sandbox both signs and
// verifies it, so keeping the session alive needs no platform round-trip. Shape
// mirrors the platform token — `${base64url(appId.exp)}.${base64url(hmac)}`.
// Returns null (fail closed) when the secret is missing/too short.
export function mintSessionToken(
  secret: string | undefined,
  appId: string,
  ttlSeconds: number,
  nowMs: number = Date.now(),
): string | null {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const payload = `${appId}.${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest();
  const b64Payload = Buffer.from(payload).toString('base64url');
  return `${b64Payload}.${sig.toString('base64url')}`;
}

// Verify a session token minted by mintSessionToken. Fails closed on a
// missing/short secret, a malformed token, a bad signature (constant-time
// compare), or a passed `exp`.
export function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  nowMs: number = Date.now(),
): TokenResult {
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH)
    return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [b64Payload, b64Sig] = parts;
  let payload: string;
  let signature: Buffer;
  try {
    payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    signature = Buffer.from(b64Sig, 'base64url');
  } catch {
    return { valid: false };
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(signature, expected)
  ) {
    return { valid: false };
  }
  const sep = payload.lastIndexOf('.');
  if (sep === -1) return { valid: false };
  const appId = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!Number.isFinite(exp) || exp * 1000 < nowMs) return { valid: false };
  return { valid: true, appId };
}

export function readCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}
