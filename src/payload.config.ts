import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Pages } from './payload/collections/Pages';
import { PlatformUsers, promoteExistingPlatformOwner, Users } from './payload/collections/Users';
import { Tournaments } from './payload/collections/Tournaments';
import { TournamentRegistrations } from './payload/collections/TournamentRegistrations';
import { DepositRequests, RewardAwards, WalletLedger, Wallets, WithdrawalRequests } from './payload/collections/Finance';
import { generatedCollections } from './payload/collections/generated';
import { SiteSettings } from './payload/globals/SiteSettings';
import { withKiteAdmin, withKiteAdminGlobal } from './payload/kiteAdmin';
import { attachPoolErrorHandler } from './payload/pool-error-handler';
import { resolveSchemaName } from './payload/schema-name';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  // Each generated site has its own Neon Postgres. The three design iterations
  // share one database but stay isolated via a per-iter Postgres schema
  // (`payload_iter1/2/3`); the selected iter's schema is carried into the
  // promoted site, so there is no content migration at selection time.
  // `push: true` creates/updates the schema on dev boot — no build-time
  // `payload migrate` step is needed.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.APP_DATABASE_URL || '',
      // The database is a remote Neon instance, so a fresh connection costs a
      // full cross-cloud TCP+TLS+auth handshake (hundreds of ms). node-postgres
      // closes idle clients after 10s by default, which makes the first query
      // of every editing burst pay that handshake again. In dev (the
      // long-lived sandbox server) 0 disables idle disconnects entirely
      // (one-shot scripts like scripts/seed-payload.ts exit explicitly, so
      // they don't hang on live pool sockets). In production (serverless —
      // many short-lived instances that are never guaranteed to close their
      // pool) keep the default reaping so per-instance pools can't pile up
      // toward Neon's connection cap.
      idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 10_000 : 0,
      keepAlive: true,
      // Bounded per-process pool (pg's default, pinned explicitly): the cap
      // on how many Neon connections one instance can hold.
      max: 10,
    },
    // `undefined` when unset, never a literal `'public'` — see schema-name.ts.
    schemaName: resolveSchemaName(),
    push: true,
    // Store `blocks` fields (the page `layout`) as a single JSON column instead
    // of one child table per block type. Payload's relational block storage
    // rewrites the whole tree on every save — it DELETEs from every block table
    // and reinserts, dozens of statements each paying the cross-cloud Neon round
    // trip (measured: a one-field save = ~29 statements, ~5.7s). JSON storage
    // collapses that to a single row write.
    //
    // Store `blocks` fields (the page `layout`) as a single JSON column instead
    // of one child table per block type. Payload's relational block storage
    // rewrites the whole tree on every save — DELETE from every block table then
    // reinsert, dozens of statements each paying the cross-cloud Neon round trip
    // (~29 statements / ~5.7s for a one-field edit). JSON storage collapses that
    // to a single row write.
    //
    // On for all apps. This fixes how a schema is CREATED: an app whose schema
    // was already created with relational block tables will try to drop them on
    // its next `push` and wedge on drizzle's data-loss prompt — such apps must be
    // moved to JSON storage once with Payload's `blocksToJsonMigrator`.
    blocksAsJSON: true,
  }),
  // Neon terminates idle connections server-side (Postgres 57P01).
  // node-postgres surfaces that as a pool-level 'error' event; with no
  // listener Node escalates every one to an uncaughtException. The adapter
  // creates the pool inside `connect()` and `onInit` runs after it, so this
  // is the earliest the real Pool instance exists. Dev HMR reloads reuse the
  // same instance, so the listener attaches once per process. See
  // `src/payload/pool-error-handler.ts`.
  onInit: async (payload) => {
    attachPoolErrorHandler(payload);
    await promoteExistingPlatformOwner(payload);
  },
  secret: process.env.PAYLOAD_SECRET || '',
  // Remap the REST API off `/api` so it never collides with the template's
  // own `/api/v1/*` routes. Admin stays at the default `/admin`.
  routes: {
    api: '/cms-api',
  },
  admin: {
    user: Users.slug,
    // The Content tab embeds this admin in a light-themed product surface and
    // the design mockups are all light, so pin light mode rather than following
    // the viewer's OS preference (which could flip the embed to dark).
    theme: 'light',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Keep the embedded-admin session alive. `/admin-login` exchanges the
      // one-time platform token for a sandbox-signed session cookie (~15 min);
      // this always-mounted provider slides it before it expires by re-exchanging
      // a fresh token, so navigating after some idle time doesn't bounce to
      // `/admin/login` and strand the admin on the loading splash. See
      // `src/admin/SessionKeepalive.tsx`.
      providers: ['/admin/SessionKeepalive#SessionKeepalive'],
      // Hide the admin logout button: the content tab embeds this admin via a
      // platform-minted auto-login token with no in-iframe re-login, so logging
      // out would strand the editor. See `src/admin/HiddenLogout.tsx`.
      logout: {
        Button: '/admin/HiddenLogout#HiddenLogout',
      },
      // Hide the admin navigation sidebar: the content tab embeds this admin
      // scoped to content editing, so the Collections/Globals nav is redundant
      // chrome. See `src/admin/HiddenNav.tsx`.
      Nav: '/admin/HiddenNav#HiddenNav',
      // Brand mark for the screens Payload still renders it on — the loading
      // splash, and the login screen a session expiry can bounce to. The
      // app header that used to carry it is hidden (admin-skin.css), so this
      // no longer brands the breadcrumb home mark.
      graphics: {
        Icon: '/admin/KiteIcon#KiteIcon',
      },
      // Replace Payload's stock widget dashboard (the `/admin` homepage) with
      // the Kite card layout — the editor's entry point since the nav is hidden.
      // See `src/admin/Dashboard.tsx`.
      views: {
        dashboard: {
          Component: '/admin/Dashboard#Dashboard',
        },
        // The account screen edits the machine-provisioned admin user this
        // admin authenticates as — nothing an editor owns. Bounced to the
        // dashboard. See `src/admin/AccountRedirect.tsx`.
        account: {
          Component: '/admin/AccountRedirect#AccountRedirect',
        },
      },
    },
    // Live Preview: the admin renders the actual page in a responsive iframe so
    // editors see their content in context. The URL is same-origin (relative),
    // so it works in the platform content-tab iframe without extra config. It
    // shows published content and refreshes on navigation/save.
    livePreview: {
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 375, height: 667 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || '';
        const slug = typeof data?.slug === 'string' ? data.slug : '';
        return !slug || slug === 'home' ? `${base}/` : `${base}/${slug}`;
      },
      collections: ['pages'],
      // Site-wide chrome (header/footer/theme) renders on every route, so the
      // site root is a valid preview surface for the whole global. It has no
      // `slug` field, so the url resolver above already lands on `${base}/`.
      globals: ['site-settings'],
    },
  },
  editor: lexicalEditor(),
  // Content collections (e.g. a blog) are generation-driven: the generator
  // authors them into `collections/generated.ts` only when the site needs
  // repeating content. The template ships none, so a simple site has just
  // Users + Pages.
  //
  // `withKiteAdmin` applies the design-system field renderers and list view
  // across every collection and global here rather than field by field, so
  // generator-authored collections and blocks are covered too — see
  // src/payload/kiteAdmin.ts.
  collections: [Users, PlatformUsers, Pages, Tournaments, TournamentRegistrations, Wallets, WalletLedger, DepositRequests, WithdrawalRequests, RewardAwards, ...generatedCollections].map(withKiteAdmin),
  globals: [SiteSettings].map(withKiteAdminGlobal),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
});
