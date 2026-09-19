// Forge/reject contract for the sandbox-signed admin session token. The
// template ships no unit-test runner, so this is a self-contained tsx script
// (run in CI by nextjs-template-code-quality.yml, like the cms-management seed
// contract). It drives the REAL helpers and asserts the security-relevant
// NEGATIVE cases — tamper, wrong secret, empty secret, expiry — because for auth
// code the rejections are the contract. Exits non-zero on any failure.
//
// Run locally: pnpm exec tsx src/payload/platform-token.test.ts

import { mintSessionToken, verifySessionToken } from './platform-token';

const SECRET = 'a'.repeat(64); // stand-in for a 64-char hex PAYLOAD_SECRET
const APP = 'app-123';

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

// Happy round-trip
const token = mintSessionToken(SECRET, APP, 900)!;
check('valid token verifies', verifySessionToken(token, SECRET).valid === true);
check(
  'valid token carries appId',
  verifySessionToken(token, SECRET).appId === APP,
);

// Empty / short secret must fail CLOSED on BOTH mint and verify — an empty HMAC
// key would be forgeable from the appId in the shareable preview URL.
check('mint refuses empty secret', mintSessionToken('', APP, 900) === null);
check(
  'mint refuses short secret',
  mintSessionToken('short', APP, 900) === null,
);
check(
  'verify refuses empty secret',
  verifySessionToken(token, '').valid === false,
);

// Wrong secret
check(
  'wrong secret rejected',
  verifySessionToken(token, 'b'.repeat(64)).valid === false,
);

// Tampered payload (swap appId/exp, keep the original signature)
const [, signature] = token.split('.');
const forgedPayload = Buffer.from('attacker.99999999999').toString('base64url');
check(
  'tampered payload rejected',
  verifySessionToken(`${forgedPayload}.${signature}`, SECRET).valid === false,
);

// Tampered signature
const [payload] = token.split('.');
check(
  'tampered signature rejected',
  verifySessionToken(
    `${payload}.${Buffer.from('nope').toString('base64url')}`,
    SECRET,
  ).valid === false,
);

// Malformed / missing
check(
  'malformed (no dot) rejected',
  verifySessionToken('garbage', SECRET).valid === false,
);
check('empty token rejected', verifySessionToken('', SECRET).valid === false);
check(
  'undefined token rejected',
  verifySessionToken(undefined, SECRET).valid === false,
);

// Expiry: minted 20 min ago with a 15-min TTL is expired now
const expired = mintSessionToken(SECRET, APP, 900, Date.now() - 20 * 60_000)!;
check(
  'expired token rejected',
  verifySessionToken(expired, SECRET).valid === false,
);

if (failures === 0) {
  console.log('platform-token forge contract OK');
} else {
  console.error(`platform-token forge contract: ${failures} FAILED`);
  process.exit(1);
}
