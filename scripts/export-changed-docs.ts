/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { getPayload } from 'payload';
import type { SanitizedConfig } from 'payload';
import config from '../src/payload.config';

// Export the documents a draft changed since its branch point into a seed.json
// manifest, so the merge step (V2-5667) can apply exactly those documents to the
// live schema via the existing `seed-payload.ts` upsert-by-slug path — nothing
// the draft did not touch is moved. This is the "diff" half of the draft merge;
// `seed-payload.ts` is the "apply" half.
//
// Reads the DRAFT schema (via PAYLOAD_SCHEMA) and emits every SiteSettings /
// Pages / generated-collection document whose `updatedAt` is newer than the
// branch point. Payload stamps `updatedAt` on every write, so this captures
// exactly the admin edits made inside the draft.
//
// Required env: APP_DATABASE_URL, PAYLOAD_SECRET, PAYLOAD_SCHEMA (the draft
// schema), SINCE (ISO-8601 branch-point timestamp — the draft's created_at).
// Output: CLI arg path, else env OUT_FILE, else ./changed-docs.json.
//
// Payload-managed fields (id, createdAt, updatedAt) are stripped: the apply step
// upserts by `slug` and lets the live doc keep its own id, so a draft doc's id is
// never forced onto live. NOTE (DP-verify): relationship fields that store a
// draft-side id are not remapped to the live id here — self-contained page/block
// content merges cleanly; cross-document relationships are a known follow-up.

type OutDoc = Record<string, unknown> & { slug: string };
type OutManifest = {
  siteSettings?: Record<string, unknown>;
  pages?: OutDoc[];
  collections?: Record<string, OutDoc[]>;
};

const MANAGED_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

function stripManaged<T extends Record<string, unknown>>(doc: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (!MANAGED_FIELDS.has(k)) out[k] = v;
  }
  return out as T;
}

function outFile(): string {
  const file = process.argv[2] ?? process.env.OUT_FILE ?? 'changed-docs.json';
  return path.isAbsolute(file) ? file : path.resolve(file);
}

function since(): Date {
  const raw = process.env.SINCE;
  if (!raw) throw new Error('SINCE (branch-point ISO timestamp) is required');
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()))
    throw new Error(`invalid SINCE timestamp: ${raw}`);
  return d;
}

async function main() {
  const cutoff = since();
  const payload = await getPayload({ config });
  const sanitized = payload.config as unknown as SanitizedConfig;
  const manifest: OutManifest = {};

  // Globals carry no slug; SiteSettings is the single content global. Include it
  // only when it changed inside the draft.
  const settings = await payload.findGlobal({ slug: 'site-settings' });
  if (settings?.updatedAt && new Date(settings.updatedAt as string) > cutoff) {
    manifest.siteSettings = stripManaged(
      settings as unknown as Record<string, unknown>,
    );
  }

  // Content collections: Pages plus any generation-authored collections. Users is
  // auth/infra, not content — never merged.
  const contentCollections = (sanitized.collections ?? [])
    .map((c) => c.slug)
    .filter((slug) => slug !== 'users');

  for (const slug of contentCollections) {
    // Fetch all docs and filter by ``updatedAt`` in JS: a where-clause on
    // ``updatedAt`` trips Payload's query-path validation on collections
    // without queryable timestamps, and content collections are small.
    const all = await payload.find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: slug as any,
      limit: 0, // 0 = no limit: every doc
      depth: 0, // relationships as ids, not populated objects
      pagination: false,
    });
    const docs = all.docs
      .filter((d): d is Record<string, unknown> & { slug: string } => {
        const doc = d as { slug?: unknown; updatedAt?: unknown };
        return (
          typeof doc.slug === 'string' &&
          typeof doc.updatedAt === 'string' &&
          new Date(doc.updatedAt) > cutoff
        );
      })
      .map((d) => stripManaged(d) as OutDoc);
    if (docs.length === 0) continue;
    if (slug === 'pages') {
      manifest.pages = docs;
    } else {
      (manifest.collections ??= {})[slug] = docs;
    }
  }

  fs.writeFileSync(outFile(), JSON.stringify(manifest, null, 2));
  const pageCount = manifest.pages?.length ?? 0;
  const collCount = Object.values(manifest.collections ?? {}).reduce(
    (n, docs) => n + docs.length,
    0,
  );
  console.log(
    `exported ${pageCount} page(s) + ${collCount} collection doc(s) + ` +
      `${manifest.siteSettings ? 1 : 0} global changed since ${cutoff.toISOString()}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('export-changed-docs failed:', err);
  process.exit(1);
});
