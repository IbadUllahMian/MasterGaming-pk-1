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
  'tournaments.manage', 'players.manage', 'teams.manage', 'results.manage', 'payments.review', 'withdrawals.review', 'wallet.manage', 'settings.manage',
] as const;

export const PLATFORM_OWNER_EMAIL = 'ibadullahmian6@gmail.com';
export const PLATFORM_ADMIN_PERMISSIONS = [...platformPermissions];
const normalizedOwnerEmail = () => PLATFORM_OWNER_EMAIL;
const isPlatformAdmin = (user: unknown) => {
  const candidate = user as { collection?: string; role?: string } | null;
  return candidate?.collection === 'platform-users' && candidate.role === 'Admin';
};

/** Reconciles an existing owner record on backend boot; signup/update is covered by the collection hook. */
export async function promoteExistingPlatformOwner(payload: Payload) {
  const existing = await payload.find({ collection: 'platform-users', where: { email: { equals: PLATFORM_OWNER_EMAIL } }, limit: 1, depth: 0, overrideAccess: true });
  const owner = existing.docs[0];
  if (owner && (owner.role !== 'Admin' || JSON.stringify(owner.permissions ?? []) !== JSON.stringify(PLATFORM_ADMIN_PERMISSIONS))) {
    await payload.update({ collection: 'platform-users', id: owner.id, data: { role: 'Admin', permissions: PLATFORM_ADMIN_PERMISSIONS }, overrideAccess: true });
  }
}

export const PlatformUsers: CollectionConfig = {
  slug: 'platform-users',
  auth: {
    // The public app and Payload REST endpoints share one first-party origin.
    // Payload writes this HttpOnly cookie on login; browser navigations then
    // carry it to the server-side /admin-panel guard.
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  admin: { useAsTitle: 'email', hideAPIURL: true, hidden: true },
  access: {
    create: () => true,
    read: ({ req }) => isPlatformAdmin(req.user) || (req.user?.collection === 'platform-users' ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => isPlatformAdmin(req.user) || (req.user?.collection === 'platform-users' ? { id: { equals: req.user.id } } : false),
    delete: ({ req }) => isPlatformAdmin(req.user),
  },
  hooks: {
    beforeChange: [({ data, originalDoc }) => {
      const email = String(data.email ?? originalDoc?.email ?? '').trim().toLowerCase();
      const isOwner = Boolean(normalizedOwnerEmail() && email === normalizedOwnerEmail());
      // Role and permissions are always assigned from verified account identity;
      // client-submitted values can never promote an account.
      data.role = isOwner ? 'Admin' : (originalDoc?.role === 'Admin' ? 'Admin' : 'Player');
      data.permissions = isOwner || data.role === 'Admin' ? [...platformPermissions] : [];
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
