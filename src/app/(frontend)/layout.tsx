import type { Metadata } from 'next';
import {
  RUNTIME_ERROR_CAPTURE_SCRIPT,
  buildErrorProviderPin,
  buildPosthogInitScript,
  escapeJsonForScript,
  isValidPosthogToken,
} from '@appsmithorg/template-frontend';
import { getPayload } from 'payload';
import config from '@payload-config';
import { SITE_SETTINGS_TAG, cmsCached } from '../../lib/cms-cache';
import { PlatformHeader } from '@/components/platform/PlatformHeader';
import { PlatformFooter } from '@/components/platform/PlatformFooter';
import { RefreshRouteOnSave } from '@/components/RefreshRouteOnSave';
import DevErrorOverlay from '@/components/dev-error-overlay';
import ScrollReveal from '@/components/scroll-reveal';
import {
  BRAND_FONT_ELEMENT_CSS,
  googleFontsHref,
  siteThemeStyle,
} from '@/lib/site-theme';
import '../globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://mastergaming.pk'),
  title: { default: 'MasterGaming.pk | Free Fire Tournaments', template: '%s | MasterGaming.pk' },
  description: 'Discover structured Free Fire tournaments, player standings, teams, rules, and verified results on MasterGaming.pk.',
  openGraph: { title: 'MasterGaming.pk | Free Fire Tournaments', description: 'Structured Free Fire tournaments, teams, standings, and clear results.', url: '/', images: ['https://static.kite.ai/image/upload/v1789264161/app/e5120da1-b491-4f79-b066-5ee9682049c7/iter3/freefire-squad-hero-r1.png'] },
  // Browsers with no icon link auto-request `/favicon.ico`, which would fall
  // through the catch-all route into a full CMS-backed not-found render;
  // `next.config.mjs` rewrites that path to this static file as the backstop.
  icons: { icon: '/favicon.svg' },
};

// Read on every request of every route under `force-dynamic`, but only changed
// by a CMS save — cached in production with instant invalidation via the
// SiteSettings afterChange hook (see src/lib/cms-cache.ts for the dev/prod
// split and staleness bounds).
// `apiHost` is an option of @appsmithorg/template-frontend 1.1.11. The installed
// 1.1.10 predates it, so its published .d.ts rejects the property while the
// helper below still reads it at runtime — a build-order gap, not a wrong call.
// Mirror the ONE missing field by intersecting the published parameter type
// rather than restating it, so every other option stays checked against the real
// shape. Delete this once package.json's range floors at 1.1.11 (the
// package-publish auto-PR) and pass the literal inline again.
type PosthogInitOptions = NonNullable<
  Parameters<typeof buildPosthogInitScript>[1]
> & { apiHost?: string };

const getSiteSettings = cmsCached(
  async () => {
    const payload = await getPayload({ config });
    return payload.findGlobal({ slug: 'site-settings' });
  },
  ['site-settings'],
  [SITE_SETTINGS_TAG],
);

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Site-wide chrome (header/footer) is read from the SiteSettings global so it
  // stays consistent across routes and editable in the CMS. Tolerate an
  // unseeded/unreachable DB during early boot by rendering just the children.
  let settings = null;
  try {
    settings = await getSiteSettings();
  } catch {
    settings = null;
  }

  // CMS colors + fonts → CSS custom properties on <html>. Migration rewrites
  // classic globals.css tokens to var(--brand-*, <fallback>) so Site Settings
  // edits flow through without regenerating components.
  const { style: htmlStyle, hasFontVars } = siteThemeStyle(
    settings?.colors,
    settings?.fonts,
  );
  const fontsHref = googleFontsHref(settings?.fonts);

  // PostHog analytics (autocapture + pageviews) — sits beside Pirsch. Per-site
  // project token injected at build via NEXT_PUBLIC_KITE_POSTHOG_KEY —
  // Kite-namespaced so an imported site's own PostHog config, which reads the
  // unprefixed name, is never resolved to Kite's token; production-only.
  // The stub + token guard + init live in the shared `buildPosthogInitScript`
  // (one source with the Vite posthog-injector); it returns null for a missing
  // or malformed token.
  const posthogOptions: PosthogInitOptions = {
    // The Kite SDK below owns the event vocabulary — page_viewed, engagement,
    // stamped interactions — exactly as in the classic template, so PostHog's
    // native capture must be OFF: the analytics read side counts $pageview
    // AND page_viewed under a one-vocabulary-per-site assumption, and leaving
    // native capture on would double-count every view.
    capturePageview: false,
    capturePageleave: false,
    autocapture: false,
    // Bootstrap on the first-party `kite_did` cookie rather than letting
    // posthog-js mint its own anonymous id. The helper prepends the
    // visitor-id script to what it returns, so this is one self-contained
    // blob and the ordering cannot be broken by a caller.
    // That id is what the platform reads off a same-origin form POST to
    // attribute a server-recorded conversion, so it is wired on every
    // consumer of this helper — not only the template that has a contact
    // form today.
    bootstrapFromVisitorId: true,
    // Injected at build beside the token, from the same backend setting
    // the management API and the read path use; absent, the helper falls
    // back to its US default.
    apiHost: process.env.NEXT_PUBLIC_KITE_POSTHOG_HOST,
    // The helper emits a NAMED instance ('kite') unconditionally, so
    // `window.__KITE_PH__` is the Kite destination on every site — and the
    // handle the SDK loaded below captures through.
  };
  const posthogScript =
    process.env.NODE_ENV === 'production'
      ? buildPosthogInitScript(
          process.env.NEXT_PUBLIC_KITE_POSTHOG_KEY,
          posthogOptions,
        )
      : null;

  // Kite custom-event analytics envelope + the stamp-driven SDK, identical to
  // the classic template's wiring: the SDK is the @appsmithorg/kite-analytics
  // dependency, copied into public/ by the prebuild script, so the served file
  // is the version this template's lockfile resolved. Payload pages
  // gain the lifecycle events and provider mirroring even before their blocks
  // carry data-kite-* stamps. Production-only; needs both a PostHog project
  // and a website id. `<` escaped so no value can close the inline <script>.
  const kiteEnv =
    process.env.NODE_ENV === 'production' &&
    isValidPosthogToken(process.env.NEXT_PUBLIC_KITE_POSTHOG_KEY) &&
    process.env.NEXT_PUBLIC_KITE_WEBSITE_ID
      ? escapeJsonForScript({
          posthogToken: process.env.NEXT_PUBLIC_KITE_POSTHOG_KEY,
          websiteId: process.env.NEXT_PUBLIC_KITE_WEBSITE_ID,
          accountId: process.env.NEXT_PUBLIC_KITE_ACCOUNT_ID || undefined,
          goalType: process.env.NEXT_PUBLIC_KITE_GOAL_TYPE || undefined,
          // The site's own analytics providers, DECLARED by the platform's
          // detector for this exact site (deploy env, comma-separated
          // detector names). The SDK's mirroring wraps only these.
          mirrorProviders: (process.env.NEXT_PUBLIC_KITE_MIRROR_PROVIDERS || '')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean),
          schemaVersion: '1.0',
        })
      : null;

  return (
    // suppressHydrationWarning (html + body): extensions and the preview
    // iframe host stamp attributes on both before React hydrates (Grammarly
    // marks <body>, Chrome Remote Frame marks <html>); the mismatch is
    // attribute-only and harmless, but would open the dev error overlay.
    <html lang="en" suppressHydrationWarning style={htmlStyle}>
      <head>
        {/* Flags scripting for the scroll-reveal CSS gate (html.js in */}
        {/* globals.css). Inline and first so the class lands before paint — */}
        {/* reveal content must never start hidden unless JS is running. The */}
        {/* html-level suppressHydrationWarning above covers the class-attr */}
        {/* mismatch this creates. */}
        <script
          id="js-class-bootstrap"
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        {fontsHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link href={fontsHref} rel="stylesheet" />
          </>
        ) : null}
        {hasFontVars ? (
          <style
            id="brand-font-elements"
            dangerouslySetInnerHTML={{ __html: BRAND_FONT_ELEMENT_CSS }}
          />
        ) : null}
        {/* Runtime error capture. Inlined first so window listeners attach before */}
        {/* any user code runs, catching async/window errors + unhandled rejections */}
        {/* that the global-error boundary (render errors only) never sees. Gated */}
        {/* on either analytics token. The provider pin (ANALYTICS_ERROR_PROVIDER, */}
        {/* set by provisioning to match the backend Errors view) is prepended so */}
        {/* writes go to the same provider reads do; absent, it falls back to */}
        {/* whichever SDK is present. Script + pin live in the shared package (one */}
        {/* source with the Vite runtime-error-capture plugin). */}
        {process.env.NODE_ENV === 'production' &&
          (process.env.NEXT_PUBLIC_PIRSCH_TOKEN ||
            process.env.NEXT_PUBLIC_KITE_POSTHOG_KEY) && (
            <script
              id="runtime-error-capture"
              dangerouslySetInnerHTML={{
                __html:
                  buildErrorProviderPin(
                    process.env.NEXT_PUBLIC_ANALYTICS_ERROR_PROVIDER,
                  ) + RUNTIME_ERROR_CAPTURE_SCRIPT,
              }}
            />
          )}
        {/* Pirsch analytics. A static <script> (not next/script) so it sits in */}
        {/* the server HTML at parse time — pa.js then auto-tracks the first */}
        {/* pageview and SPA navigations. next/script's afterInteractive injects */}
        {/* post-load, after pa.js's load hooks have fired, so the initial */}
        {/* pageview is missed; beforeInteractive can strip data-* in app router */}
        {/* (vercel/next.js#49830). Token injected at build via */}
        {/* NEXT_PUBLIC_PIRSCH_TOKEN (deployment_service); absent in dev. */}
        {process.env.NODE_ENV === 'production' &&
          process.env.NEXT_PUBLIC_PIRSCH_TOKEN && (
            <script
              defer
              src="https://api.pirsch.io/pa.js"
              id="pianjs"
              data-code={process.env.NEXT_PUBLIC_PIRSCH_TOKEN}
            />
          )}
        {/* PostHog analytics (autocapture + pageviews). Inline so it sits in the */}
        {/* server HTML at parse time, beside Pirsch. Because this was built with */}
        {/* bootstrapFromVisitorId, it already carries the first-party `kite_did` */}
        {/* script ahead of the init — one tag, so the order cannot be broken here. */}
        {posthogScript && (
          <script
            id="posthog-analytics"
            dangerouslySetInnerHTML={{ __html: posthogScript }}
          />
        )}
        {/* Kite custom-event analytics SDK. Inline envelope (parse-time, after */}
        {/* PostHog init) then the deferred versioned SDK artifact from public/. */}
        {kiteEnv && (
          <>
            <script
              id="kite-analytics-env"
              dangerouslySetInnerHTML={{
                __html: `window.__KITE_ENV__=${kiteEnv};`,
              }}
            />
            <script src="/kite-analytics.js" defer />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        {/* Refreshes the page inside the admin's Live Preview iframe on save. */}
        {/* Editing-time only — like the script injector above, it must never */}
        {/* run for end users (it would also `router.refresh()` once on every */}
        {/* production page load). The sandbox preview runs `next dev`. */}
        {process.env.NODE_ENV !== 'production' && <RefreshRouteOnSave />}
        {process.env.NODE_ENV !== 'production' && <DevErrorOverlay />}
        {/* Site-wide scroll-reveal observer. Mounted here only (it watches */}
        {/* <body> for new matches itself) — pages must not add their own. */}
        <ScrollReveal />
          <PlatformHeader />
        {children}
          <PlatformFooter />
      </body>
    </html>
  );
}
