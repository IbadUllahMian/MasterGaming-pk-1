'use client';

import { useEffect, useState } from 'react';

import { CMS_TOKEN_REQUEST, CMS_TOKEN_RESPONSE } from '@/admin/bridgeProtocol';
import { isEmbedded, requestFromParent } from '@/admin/parentRpc';

// Cap self-recovery hops before showing the static error, mirroring
// SessionKeepalive's MAX_RECOVERIES — a degenerate "token never sticks" state
// must not become an infinite reload loop.
const MAX_RECOVERIES = 3;
const REQUEST_TIMEOUT_MS = 10_000;

// Reached only when `/admin-login` was hit with an invalid/expired token. The
// content-tab iframe freezes a ~60s token in its src, so any later document
// reload of that src (returning to a long-backgrounded tab, a preview-host
// rotation) re-hits `/admin-login` with a long-dead token; that route sends the
// iframe here instead of a dead 401. When embedded, ask the parent for a fresh
// token over the SAME CMS-token bridge SessionKeepalive uses (`parentRpc`), then
// bounce back to `/admin-login` with it. Non-embedded visits and exhausted
// retries fall through to the static error.
export default function AdminReloginPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const recoveries = Number(
      new URLSearchParams(window.location.search).get('recovery') ?? '0',
    );
    if (
      !Number.isFinite(recoveries) ||
      recoveries >= MAX_RECOVERIES ||
      !isEmbedded()
    ) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const reply = await requestFromParent(
        CMS_TOKEN_REQUEST,
        CMS_TOKEN_RESPONSE,
        {},
        REQUEST_TIMEOUT_MS,
      );
      if (cancelled) return;
      const token =
        reply && typeof reply.token === 'string' ? reply.token : null;
      if (!token) {
        setFailed(true);
        return;
      }
      window.location.replace(
        `/admin-login?token=${encodeURIComponent(token)}&recovery=${recoveries + 1}`,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p>{failed ? 'Invalid or expired login token' : 'Signing you back in…'}</p>
  );
}
