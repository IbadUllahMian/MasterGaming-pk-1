import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Legacy HTML pipeline marker. The old Python ``website_create`` pipeline
// writes the chosen design to ``public/prototype.html``; the Next.js
// pipeline (``website_create_opencode``) overlays real routes onto
// ``src/app/`` and never writes a prototype file. The rewrite below only
// kicks in for legacy apps so the new pipeline's real routes take effect
// without hitting an infinite-loop on Vercel
// (``/`` → ``/prototype.html`` → 404 → ``_not-found`` → rewrite → loop).
const hasPrototypeHtml = fs.existsSync(
  path.join(dirname, 'public', 'prototype.html'),
);

// Content-derived redirects. A generated site often needs per-slug legacy
// redirects (old URLs → new slugs) that can't go in the baked config and aren't
// bulk enough for Vercel's `redirects.csv` channel. The generation/migration
// pipeline may emit a `redirects.json` manifest at the project root — an array of
// `{ source, destination, permanent? }` (Next.js redirect rules). This baked
// loader reads it so the redirects apply in both `next dev` and on Vercel.
// Missing/malformed → no redirects (never a build break).
function loadGeneratedRedirects() {
  const manifestPath = path.join(dirname, 'redirects.json');
  if (!fs.existsSync(manifestPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        // Next.js throws (not skips) during config normalization for a redirect
        // whose source isn't `/`-prefixed or whose destination is neither
        // `/`-prefixed nor an absolute URL — that would fail `next build`/`dev`
        // startup outright, contradicting the never-a-build-break intent. Drop
        // such entries here so a malformed manifest degrades to no redirects.
        // The source charset check keeps path-to-regexp specials (`(`, `)`,
        // `?`, `+`, `*`, `:param`) out — an unbalanced pattern also throws at
        // normalization, and migration manifests only carry literal paths.
        // Self-redirects (source === destination) would loop; drop them too.
        (r) =>
          r &&
          typeof r.source === 'string' &&
          /^\/[A-Za-z0-9\-._~/%]*$/.test(r.source) &&
          typeof r.destination === 'string' &&
          (r.destination.startsWith('/') ||
            /^https?:\/\//.test(r.destination)) &&
          r.source !== r.destination,
      )
      .map((r) => ({
        source: r.source,
        destination: r.destination,
        // Legacy-URL redirects default to permanent (308); a manifest entry can
        // opt into a temporary (307) redirect with `"permanent": false`.
        permanent: r.permanent !== false,
      }));
  } catch {
    return [];
  }
}

// The editing sandbox runs `next dev` behind the Caddy/preview proxy, served
// to the browser on the public `*.sandbox.kite.ai` host (a port-prefixed e2b
// host masked by the proxy — see backend `e2b_service`). Next sees an internal
// host, so for any cross-origin check the request's `Origin` (the public host)
// won't match Next's own host. Both Next allowlists below must carry this host:
//   - `allowedDevOrigins`        — dev assets / HMR / RSC fetches.
//   - `serverActions.allowedOrigins` — the Server Actions CSRF check. Payload's
//     admin drives its post-save re-render and the live-preview toggle through
//     Server Actions; without this they fail with "Invalid Server Actions
//     request", which silently collapses the Live Preview pane on save (the doc
//     itself still saves over the `/cms-api` REST route). These are SEPARATE
//     allowlists — `allowedDevOrigins` does not cover Server Actions.
const sandboxPreviewOrigins = ['*.sandbox.kite.ai'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp's libvips shared library is opened by the OS dynamic linker through
  // the native binding's rpath, never by a JS `require`, so Next's file tracing
  // cannot see it: it traces the binding `.node` and the package's
  // `index.js`/`package.json` and stops there. The deployed bundle then ships
  // sharp without its library, and because `payload.config.ts` imports sharp at
  // module scope the resulting ERR_DLOPEN_FAILED throws inside Payload init —
  // killing every SSR route of the site, not just image handling.
  //
  // Names one real directory, which requires the hoisted node_modules layout
  // set in `.npmrc`: globbing the library out of pnpm's default store instead
  // pulls in symlinked directories, and Vercel rejects a serverless package
  // that contains those ("invalid deployment package for a Serverless
  // Function") — failing the deploy rather than fixing the site.
  outputFileTracingIncludes: {
    '**/*': ['./node_modules/@img/sharp-libvips-*/lib/**'],
  },
  reactStrictMode: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: sandboxPreviewOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: sandboxPreviewOrigins,
    },
    // Firefox reports transferSize=0 for cross-site iframe navigations, which
    // the dev client's debug channel misreads as an HTTP-cache restore and
    // answers with location.reload() — an infinite reload loop inside the
    // preview iframe. The channel only streams React debug info in dev.
    reactDebugChannel: false,
  },

  // Allow the Payload admin to be embedded in the platform's content-tab
  // iframe (a cross-origin sandbox host). Next sets `X-Frame-Options: DENY`
  // and a restrictive default CSP on framework routes otherwise, which would
  // block the iframe. Scope this to `/admin/*` only.
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *;',
          },
        ],
      },
    ];
  },

  // Content-derived per-slug redirects from the generated `redirects.json`
  // manifest (legacy URLs → new slugs). Empty when no manifest is present.
  async redirects() {
    return loadGeneratedRedirects();
  },

  // Legacy: serve the chosen design as the live site. The backend writes
  // ``public/prototype.html`` (with its content JSONs in ``public/content/``)
  // and this rewrite makes any non-API, non-static request fall through to
  // that single static file. The prototype's own client-side router handles
  // route changes by reading ``window.location.pathname``, so multi-page
  // sites work without per-route server handlers.
  async rewrites() {
    // `/favicon.ico` has no file on disk (the icon ships as `favicon.svg`,
    // linked via the frontend layout's `metadata.icons`), so a browser's
    // automatic request for it would fall through the `[[...slug]]` catch-all
    // into a full CMS-backed not-found render on every tab load. Serve the
    // static SVG instead — clients that honor the icon link never ask.
    const faviconFallback = {
      source: '/favicon.ico',
      destination: '/favicon.svg',
    };
    if (!hasPrototypeHtml) return [faviconFallback];
    return [
      faviconFallback,
      {
        source:
          '/((?!api|cms-api|admin|_next|content|images|js|favicon|robots|sitemap|prototype).*)',
        destination: '/prototype.html',
      },
    ];
  },
};

export default withPayload(nextConfig);
