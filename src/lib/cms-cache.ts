// `unstable_cache` is deprecated in Next 16 in favor of `'use cache'` /
// Cache Components; migrate when the template adopts `cacheComponents`
// (directive-based caching needs that build mode, this API doesn't).
import { unstable_cache } from 'next/cache';

// Cross-request caching for CMS reads (the `site-settings` global and the
// catch-all route's document lookup), production only.
//
// Production (`next start` — the published Vercel site): every page view
// otherwise pays 2+ round trips to the remote Neon database under
// `force-dynamic`. Entries are tagged, so an in-process Payload write
// (afterChange hooks in `src/payload/revalidate.ts`) refreshes them instantly;
// the TTL is the backstop for writes from OTHER processes (the editing
// sandbox's admin writes to the same database the published site reads).
//
// Development (`next dev` — the editing sandbox): caching is off. Seeding and
// migration tooling write to the database from standalone scripts where
// `revalidateTag` has no Next server to invalidate, and those flows verify
// content visually right after writing — a stale window there breaks them.
export const SITE_SETTINGS_TAG = 'site-settings';
export const CMS_CONTENT_TAG = 'cms-content';

// Bounded staleness for out-of-process writes on the published site.
const CMS_CACHE_TTL_SECONDS = 30;

export function cmsCached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[],
): (...args: Args) => Promise<Result> {
  if (process.env.NODE_ENV !== 'production') return fn;
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate: CMS_CACHE_TTL_SECONDS,
  });
}
