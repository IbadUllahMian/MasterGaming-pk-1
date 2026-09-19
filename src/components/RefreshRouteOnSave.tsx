'use client';

import { useEffect, useRef } from 'react';
import { RefreshRouteOnSave as PayloadRefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';

// Minimum gap between refreshes. The admin posts a document event during the
// live-preview handshake right as the iframe finishes its own fresh load, so
// without a floor every doc-open renders the page twice back-to-back (two
// identical RSC fetches ~30ms apart in the HAR). Trailing-edge: a refresh
// arriving inside the window is deferred to the window's end, never dropped —
// a save's re-render is delayed at most this long, not lost.
const REFRESH_MIN_GAP_MS = 1500;

// Payload Live Preview (configured in `payload.config.ts`) renders the live site
// in an iframe inside the admin edit view. Server-side live preview only
// refreshes that iframe on save if the rendered page registers this listener:
// on save the admin window posts a `payload-document-event`, and this component
// then calls `router.refresh()` to re-fetch the (force-dynamic) page. Without
// it, the preview pane stays frozen on its first render until a manual reload.
//
// `serverURL` must equal the posting admin window's `event.origin` *exactly* —
// Payload checks `event.origin === serverURL` (no trailing slash). The admin and
// this page are same-origin (the live-preview URL is relative) and the
// sandbox/Vercel host is only known at runtime, so we use the live origin rather
// than a build-time env var. On the server there is no `window`; the empty
// fallback is replaced on hydration, before any admin message can arrive.
export function RefreshRouteOnSave() {
  const router = useRouter();
  const serverURL = typeof window !== 'undefined' ? window.location.origin : '';
  // Mount counts as a refresh: the page the iframe just loaded is already
  // fresh, so the handshake-triggered refresh right after it is redundant.
  const lastRefreshAt = useRef(Date.now());
  const pending = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pending.current !== null) window.clearTimeout(pending.current);
    };
  }, []);

  const refresh = () => {
    if (pending.current !== null) return; // one deferred refresh covers the burst
    const elapsed = Date.now() - lastRefreshAt.current;
    if (elapsed >= REFRESH_MIN_GAP_MS) {
      lastRefreshAt.current = Date.now();
      router.refresh();
      return;
    }
    pending.current = window.setTimeout(() => {
      pending.current = null;
      lastRefreshAt.current = Date.now();
      router.refresh();
    }, REFRESH_MIN_GAP_MS - elapsed);
  };

  return <PayloadRefreshRouteOnSave refresh={refresh} serverURL={serverURL} />;
}
