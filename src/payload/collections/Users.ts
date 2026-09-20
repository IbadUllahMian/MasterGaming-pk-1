import type { AuthStrategyResult, CollectionConfig, Payload } from 'payload';
import {
  CMS_SESSION_COOKIE,
  readCookie,
  verifySessionToken,
} from '../platform-token';

// Minimal auth-enabled collection backing the Payload admin session. One
// admin user is provisioned per schema at seed time, with no password. The
// `platform-token` strategy below (a signed cookie minted by the platform) is
// the ONLY way to authenticate: the local email/password strategy is disabled
// because `/admin` is publicly served on every deployed site and a password
// login surface would have to be provisioned with per-site credentials nobody
// ever uses.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // `enableFields` keeps the `email` column (used as the admin title and by
    // the seed) while removing password verification and the login endpoint.
    disableLocalStrategy: { enableFields: true, optionalPassword: true },
    // On each admin/API request, verify the sandbox-signed session cookie
    // (minted at /admin-login after the one-time platform-token handoff) and
    // resolve it to the auto-provisioned admin user. Only the session cookie is
    // accepted — never the raw platform token — so there is no path back to the
    // 60s-churn credential.
    strategies: [
      {
        name: 'platform-token',
        authenticate: async ({
          headers,
          payload,
        }): Promise<AuthStrategyResult> => {
          const token = readCookie(headers.get('cookie'), CMS_SESSION_COOKIE);
          const result = verifySessionToken(token, process.env.PAYLOAD_SECRET);
          if (!result.valid) return { user: null };
          // `result.appId` is intentionally not checked against this app's own id:
          // PAYLOAD_SECRET is per-app, so a valid HMAC could only have been minted
          // by THIS app's own /admin-login. Add an appId equality check here only
          // if the secret ever becomes shared across apps/environments.
          const found = await payload.find({
            collection: 'users',
            limit: 1,
            sort: 'createdAt',
            depth: 0,
          });
          const user = found.docs[0];
          if (!user) return { user: null };
          return { user: { ...user, collection: 'users' } };
        },
      },
    ],
  },
  admin: {
    useAsTitle: 'email',
    hideAPIURL: true,
    // Hidden from the Content tab: the single admin user is auto-provisioned per
    // schema and never edited by hand. `hidden` only affects admin-UI visibility
    // (nav, dashboard, direct routes) — the platform-token auth strategy still
    // reads this collection via the Local API, so login keeps working.
    hidden: true,
  },
  fields: [],
};

const platformPermissions = [
  'tournaments.manage', 'players.manage', 'registrations.manage', 'rooms.manage', 'results.manage', 'finance.manage', 'payments.review', 'withdrawals.review', 'wallet.manage', 'settings.manage',
] as const;

export const PLATFORM_OWNER_EMAIL = 'ibadullahmian6@gmail.com';
export const PLATFORM_ADMIN_PERMISSIONS = [...platformPermissions];
const normalizedOwnerEmail = () => PLATFORM_OWNER_EMAIL.trim().toLowerCase();
const isPlatformAdmin = (user: unknown) => {
  const candidate = user as { collection?: string; role?: string } | null;
  return candidate?.collection === 'platform-users' && candidate.role === 'Admin';
};

/** Preserves the provisioned owner role and removes untrusted Admin assignments. */
export async function promoteExistingPlatformOwner(payload: Payload) {
  const nonOwnerAdmins = await payload.find({ collection: 'platform-users', where: { and: [{ role: { equals: 'Admin' } }, { email: { not_equals: normalizedOwnerEmail() } }] }, limit: 100, depth: 0, overrideAccess: true });
  await Promise.all(nonOwnerAdmins.docs.map((user) => payload.update({ collection: 'platform-users', id: user.id, data: { role: 'Player', permissions: [] }, overrideAccess: true })));
}

export const PlatformUsers: CollectionConfig = {
  slug: 'platform-users',
  auth: {
    // The public app and Payload REST endpoints share one first-party origin.
    // Payload writes this HttpOnly cookie on login; browser navigations then
    // carry it to the server-side /admin-panel guard.
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    // The player JWT must not share the CMS/admin cookie namespace. This keeps
    // a player login, the role-protected control panel, and the embedded CMS
    // session independently authenticated on the same first-party origin.
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false },
  },
  admin: { useAsTitle: 'email', hideAPIURL: true, hidden: true },
  access: {
    create: () => true,
    read: ({ req }) => isPlatformAdmin(req.user) || (req.user?.collection === 'platform-users' ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => isPlatformAdmin(req.user) || (req.user?.collection === 'platform-users' ? { id: { equals: req.user.id } } : false),
    delete: ({ req }) => isPlatformAdmin(req.user),
  },
  hooks: {
    beforeChange: [({ data, operation, originalDoc, req }) => {
      if (operation === 'update' && !isPlatformAdmin(req.user)) {
        // A player must never gain elevated access by changing profile data.
        // Keep authorization fields tied to the persisted account identity.
        data.email = originalDoc?.email;
        data.role = originalDoc?.role ?? 'Player';
        data.permissions = originalDoc?.permissions ?? [];
        return data;
      }
      // Public registration never grants an administrative role. The configured
      // owner must be provisioned in the trusted shared account data.
      if (operation === 'create') {
        data.role = 'Player';
        data.permissions = [];
      }
      return data;
    }],
  },
  fields: [
    { name: 'full_name', type: 'text', required: true },
    { name: 'username', type: 'text', required: true, unique: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'Player', options: ['Admin', 'Player'], access: { update: ({ req }) => isPlatformAdmin(req.user) } },
    { name: 'permissions', type: 'select', hasMany: true, options: [...platformPermissions], defaultValue: [], access: { update: ({ req }) => isPlatformAdmin(req.user) } },
    { name: 'free_fire_uid', type: 'text', required: true, unique: true },
    { name: 'in_game_name', type: 'text', required: true },
    { name: 'mobile_number', type: 'text', required: true },
  ],
};
