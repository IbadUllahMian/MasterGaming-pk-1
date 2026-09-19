'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { CMS_TOKEN_REQUEST, CMS_TOKEN_RESPONSE } from './bridgeProtocol';
import { isEmbedded, requestFromParent } from './parentRpc';

// Keeps the embedded-admin session alive. `/admin-login` exchanges the one-time
// platform token for a sandbox-signed SESSION cookie (~15 min; see
// CMS_SESSION_TTL_SECONDS in payload/platform-token.ts), which the
// `platform-token` auth strategy (collections/Users.ts) re-checks the `exp` of
// on EVERY admin request. With no refresh, the session dies at ~15 min and the
// next navigation bounces to `/admin/login`, stranding the embedded admin on the
// Payload loading splash.
//
// Mounted via `admin.components.providers` (so it is always present, including
// on the login view), this slides the session before it expires WITHOUT
// reloading the admin: it asks the parent platform window for a fresh one-time
// token and re-exchanges it same-origin at `/admin-login`, whose `Set-Cookie`
// re-arms the session for another TTL. That re-exchange is also where the
// platform re-checks CMS access/ownership, so it is the revocation heartbeat —
// hence it runs on a cadence WELL inside the TTL, not per-minute. Two arms:
//   - proactive: refresh on mount, on a timer well inside the session lifetime,
//     and whenever the tab regains visibility/focus (covers returning to a tab
//     that was backgrounded long enough for the cookie to lapse). The
//     visibility/focus arm is rate-floored — see MIN_EVENT_SLIDE_GAP_MS.
//   - reactive: if a refresh still loses the race and Payload bounces us onto
//     `/admin/login`, slide the cookie and continue to the intended `?redirect=`
//     target — turning a permanent stuck-splash into a brief self-recovery.
//
// 10 min sits comfortably inside the ~15 min session TTL (slack for a slow
// parent round-trip) while erasing the old ~40s re-mint churn.
const REFRESH_INTERVAL_MS = 10 * 60_000;
// Light poll to notice a bounce onto the login view quickly — Payload may switch
// to it via a client navigation that fires no window event we could hook.
const LOGIN_WATCH_INTERVAL_MS = 2_000;
// The parent never answering shouldn't leak a pending resolver forever.
const REQUEST_TIMEOUT_MS = 10_000;
// Cap reactive recoveries per mount so a degenerate "cookie won't stick" state
// can't become a reload loop.
const MAX_RECOVERIES = 3;
// Floor between EVENT-driven slides. The visibility/focus arm fires far more
// often than the session needs: a single tab return raises both
// `visibilitychange` and `focus`, and every click back into the iframe raises
// `focus` again — each one spending a parent round-trip plus a `/admin-login`
// hop (~660ms) to re-arm a cookie that is still valid for most of its TTL.
// Well inside the session lifetime, so a genuinely lapsed cookie is still
// re-armed on the return that matters. The timer and the stranded-recovery
// path bypass this deliberately (see `force`).
const MIN_EVENT_SLIDE_GAP_MS = 60_000;

function isOnLoginView(): boolean {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/admin/login');
}

export const SessionKeepalive = ({ children }: { children?: ReactNode }) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !isEmbedded()) return;

    let cancelled = false;
    let recovering = false;
    let recoveries = 0;
    let lastSlideAtMs = 0;
    let slideInFlight: Promise<boolean> | null = null;

    const requestToken = async (): Promise<string | null> => {
      const reply = await requestFromParent(
        CMS_TOKEN_REQUEST,
        CMS_TOKEN_RESPONSE,
        {},
        REQUEST_TIMEOUT_MS,
      );
      return reply && typeof reply.token === 'string' ? reply.token : null;
    };

    // Re-set the session cookie from a fresh token without reloading the admin.
    // `/admin-login` answers with a 302 + Set-Cookie; `redirect: 'manual'` keeps
    // us from following it and downloading the whole `/admin` document (the
    // cookie is still stored regardless of redirect mode).
    const slideCookie = async (token: string): Promise<boolean> => {
      try {
        await fetch(`/admin-login?token=${encodeURIComponent(token)}`, {
          credentials: 'include',
          redirect: 'manual',
        });
        return true;
      } catch {
        return false;
      }
    };

    const mintAndSlide = async (): Promise<boolean> => {
      const token = await requestToken();
      if (cancelled || !token) return false;
      const slid = await slideCookie(token);
      if (slid) lastSlideAtMs = Date.now();
      return slid;
    };

    // `force` skips the rate floor: the timer is the guaranteed revocation
    // heartbeat and the stranded-recovery path is answering a cookie Payload
    // has already rejected, so neither may be suppressed. A throttled call
    // reports success — the session it would have re-armed is still valid.
    //
    // The in-flight share is not redundant with the timestamp: `lastSlideAtMs`
    // is only stamped once BOTH round trips finish (~850ms), and a single tab
    // return raises `visibilitychange` and `focus` in the same turn — so a
    // time floor alone would let that pair straight through. A failed attempt
    // leaves the timestamp untouched, so the next event retries immediately.
    const refresh = ({ force = false } = {}): Promise<boolean> => {
      if (force) return mintAndSlide();
      if (Date.now() - lastSlideAtMs < MIN_EVENT_SLIDE_GAP_MS) {
        return Promise.resolve(true);
      }
      slideInFlight ??= mintAndSlide().finally(() => {
        slideInFlight = null;
      });
      return slideInFlight;
    };

    // Reactive recovery: a refresh lost the race and Payload bounced us to the
    // login view. Re-arm the cookie, then continue to the intended target.
    const recoverIfStranded = async () => {
      if (!isOnLoginView()) {
        recoveries = 0; // healthy again — reset the loop guard
        return;
      }
      if (recovering || recoveries >= MAX_RECOVERIES) return;
      recovering = true;
      recoveries += 1;
      const slid = await refresh({ force: true });
      if (slid && !cancelled && isOnLoginView()) {
        const target =
          new URLSearchParams(window.location.search).get('redirect') ||
          '/admin';
        window.location.replace(target);
        return; // navigating away; leave `recovering` set
      }
      recovering = false;
    };

    void refresh();
    void recoverIfStranded();
    const refreshTimer = window.setInterval(
      () => void refresh({ force: true }),
      REFRESH_INTERVAL_MS,
    );
    const loginTimer = window.setInterval(
      () => void recoverIfStranded(),
      LOGIN_WATCH_INTERVAL_MS,
    );
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.clearInterval(refreshTimer);
      window.clearInterval(loginTimer);
    };
  }, []);

  return <>{children}</>;
};
