import { revalidateTag } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';
import { CMS_CONTENT_TAG, SITE_SETTINGS_TAG } from '../lib/cms-cache';

// Instant invalidation for the production read cache (`src/lib/cms-cache.ts`):
// a Payload write that runs inside the Next server (admin saves, `/cms-api`
// route handlers) refreshes the cached frontend reads in the same process.
//
// Payload's local API also runs from standalone scripts (`scripts/seed-payload.ts`,
// migration tooling) where there is no Next request context and `revalidateTag`
// throws — swallow that, since those processes have no cache to invalidate;
// readers in other processes are covered by the cache TTL.
// A failed revalidate inside a running Next server would mean production
// silently serving stale reads — worth a signal. But the expected failure
// (standalone scripts) would hit it for every seeded doc, so warn once.
let warnedRevalidateFailure = false;

function safeRevalidate(tag: string): void {
  try {
    // `{ expire: 0 }` = expire the tagged entries immediately for every
    // reader. NOT the `'max'` profile: that gives stale-while-revalidate
    // semantics where the next reader after a save can still be served the
    // stale entry while Next refreshes in the background.
    revalidateTag(tag, { expire: 0 });
  } catch (err) {
    // Expected in standalone scripts (seed/migration tooling — no Next
    // server, nothing to invalidate). Logged once so an unexpected failure
    // in a real server isn't indistinguishable from that no-op.
    if (!warnedRevalidateFailure) {
      warnedRevalidateFailure = true;
      console.warn(
        `revalidateTag(${tag}) failed — expected only outside a Next server:`,
        err,
      );
    }
  }
}

export const revalidateContentAfterChange: CollectionAfterChangeHook = ({
  doc,
}) => {
  safeRevalidate(CMS_CONTENT_TAG);
  return doc;
};

export const revalidateContentAfterDelete: CollectionAfterDeleteHook = ({
  doc,
}) => {
  safeRevalidate(CMS_CONTENT_TAG);
  return doc;
};

export const revalidateSiteSettingsAfterChange: GlobalAfterChangeHook = ({
  doc,
}) => {
  safeRevalidate(SITE_SETTINGS_TAG);
  return doc;
};
