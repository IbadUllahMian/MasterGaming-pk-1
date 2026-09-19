import { NextResponse } from 'next/server';
import {
  CMS_SESSION_COOKIE,
  CMS_SESSION_TTL_SECONDS,
  mintSessionToken,
  verifyPlatformToken,
} from '@/payload/platform-token';

// Auto-login entry for the platform content tab. The platform mints a
// short-lived signed token and points the content-tab iframe at
// `{previewUrl}/admin-login?token=…`. We verify that ONE-TIME token, then mint a
// longer-lived sandbox-signed SESSION token and drop it as a first-party cookie
// on the sandbox origin (SameSite=None; Secure so it rides inside the cross-site
// iframe). The `platform-token` auth strategy on the Users collection verifies
// that session cookie on every admin request — so the session lives for the
// session TTL without the platform being re-contacted each minute.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? undefined;
  const result = verifyPlatformToken(
    token,
    process.env.PLATFORM_LOGIN_PUBLIC_KEY,
  );

  // Exchange the verified one-time token for a session token. Fails closed
  // (null) if PAYLOAD_SECRET is missing/misprovisioned — treat that like an
  // invalid token rather than setting a forgeable cookie.
  const sessionToken = result.valid
    ? mintSessionToken(
        process.env.PAYLOAD_SECRET,
        result.appId ?? '',
        CMS_SESSION_TTL_SECONDS,
      )
    : null;

  if (!result.valid || !token || !sessionToken) {
    // The iframe src freezes a ~60s token, so any later document-level reload of
    // that src re-hits this route with a long-expired token: returning to a
    // long-backgrounded tab whose sandbox paused/resumed, or a preview-host
    // rotation that changes the iframe URL. Without recovery that strands the
    // embedded admin on a dead "Invalid or expired login token" page until a
    // full parent refresh. Hand off to the self-recovering `/admin-relogin`
    // page (a client route that reuses the same CMS-token bridge
    // SessionKeepalive does), forwarding the recovery hop count so it can cap
    // retries. Relative Location for the same reason as the success redirect
    // below.
    const recovery = Number(url.searchParams.get('recovery'));
    const hops = Number.isInteger(recovery) && recovery >= 0 ? recovery : 0;
    return new NextResponse(null, {
      status: 302,
      headers: { Location: `/admin-relogin?recovery=${hops}` },
    });
  }

  // Redirect with a RELATIVE Location so the browser resolves it against the
  // iframe's current origin (https sandbox host). An absolute URL built from
  // `request.url` would carry the internal `http` scheme `next dev` sees behind
  // the Caddy/preview proxy, and the public host only serves https — which the
  // browser refuses (ERR_CONNECTION_REFUSED).
  const response = new NextResponse(null, {
    status: 302,
    headers: { Location: '/admin' },
  });
  response.cookies.set(CMS_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    // SameSite=None is REQUIRED: the admin runs in a cross-site iframe (sandbox
    // origin embedded under the platform), so a Lax/Strict cookie would not be
    // sent. The session token is signed and short-lived; the strategy re-checks
    // its exp on every request.
    sameSite: 'none',
    // CHIPS. `SameSite=None` alone is no longer enough: browsers restricting
    // third-party cookies drop an unpartitioned one in an embedded context, and
    // the admin is ALWAYS embedded. Losing it is silent and looks like nothing
    // at all — Payload bounces to `/admin/login`, which renders an empty page
    // here because the local/JWT strategy is disabled and `platform-token` is
    // the only way in, so there is no form to draw. A blank Content tab is the
    // symptom.
    //
    // Partitioning is also the correct semantics rather than a workaround: this
    // session only ever exists inside the platform's top-level site, so keying
    // it to that partition is what it already meant. Browsers without CHIPS
    // ignore the attribute.
    partitioned: true,
    path: '/',
    // Drop the cookie at the signed token's own expiry — the strategy enforces
    // exp regardless, this just avoids sending a dead cookie.
    maxAge: CMS_SESSION_TTL_SECONDS,
  });
  return response;
}
